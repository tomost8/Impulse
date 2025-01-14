import { Service } from 'typedi';
import { Prisma, PrismaClient } from '@prisma/client';
import { Post } from '../modules/post/schema/postTypes';
import { CreatePostInput, UpdatePostInput } from '../modules/post/schema/postInputs';
import { NotFoundError, ValidationError } from '../modules/common/errors/graphql.error';
import Queue from 'bull';
import { ActivityExpirationService } from './activityExpirationService';

@Service()
export class PostService {
  public postTargetsQueue: Queue.Queue;

  constructor(
    private prisma: PrismaClient,
    private activityExpirationService: ActivityExpirationService
  ) {
    // 初始化队列
    this.postTargetsQueue = new Queue('post-targets', {
      redis: {
        host: process.env.REDIS_HOST || 'localhost',
        port: parseInt(process.env.REDIS_PORT || '6379')
      }
    });

    // 处理队列中的任务
    this.postTargetsQueue.process(async (job) => {
      const { postId, targets } = job.data;
      await this.processTargetsQueue(postId, targets);
    });
  }

  async findAll(options?: {
    skip?: number;
    take?: number;
    category?: string;
  }): Promise<Post[]> {
    return await this.prisma.post.findMany({
      skip: options?.skip,
      take: options?.take,
      where: {
        category: options?.category
      },
      include: {
        author: true,
        post_targets: true
      }
    });
  }


  async create(data: CreatePostInput): Promise<Post> {
    try {
      // Check if the user has an unexpired activity of the same category
      const hasValidActivity = await this.prisma.activity.findFirst({
        where: {
          id: data.activityId,
          userId: data.authorId,
          status: "pending"
        }
      });

      if (!hasValidActivity) {
        throw new ValidationError('User must have an unexpired activity of the same category to create a post.');
      }

      if (!data.post_targets || data.post_targets.length === 0) {
        throw new ValidationError('Post must have at least one target.');
      }

      const HIGH_CONCURRENCY_THRESHOLD = 10;

      return await this.prisma.$transaction(async (tx) => {
        // 创建帖子和前N个目标
        const initialTargets = data.post_targets.slice(0, HIGH_CONCURRENCY_THRESHOLD);
        const post = await tx.post.create({
          data: {
            caption: data.caption,
            mediaUrl: data.mediaUrl,
            expires_at: data.expires_at,
            author: { connect: { id: data.authorId } },
            post_targets: {
              createMany: {
                data: initialTargets.map(target => ({
                  target_type: target.target_type,
                  target_id: target.target_id
                }))
              }
            }
          },
          include: {
            author: true,
            post_targets: true
          }
        });

        // 更新对应的 activity 的 postId 并取消过期任务
        await tx.activity.update({
          where: { id: data.activityId },
          data: { postId: post.id, status: "completed" }
        });

        // 取消 activity 的过期任务
        await this.activityExpirationService.cancelActivityExpiration(data.activityId);

        // 如果还有更多目标，添加到队列中异步处理
        if (data.post_targets.length > HIGH_CONCURRENCY_THRESHOLD) {
          const remainingTargets = data.post_targets.slice(HIGH_CONCURRENCY_THRESHOLD);
          const BATCH_SIZE = 100;
          const chunks = this.chunkArray(remainingTargets, BATCH_SIZE);
          
          for (const chunk of chunks) {
            await this.addToQueue('create_post_targets', {
              postId: post.id,
              targets: chunk
            });
          }
        }

        return post;
      }, {
        timeout: 10000,
        isolationLevel: Prisma.TransactionIsolationLevel.ReadCommitted
      });
    } catch (error: any) {
      if (error.code === 'P2003') {
        throw new ValidationError(`Invalid authorId: ${data.authorId}`);
      }
      throw error;
    }
  }

  // 处理队列中的目标创建任务
  private async processTargetsQueue(postId: number, targets: Array<{ target_type: string; target_id: number }>) {
    try {
      await this.prisma.postTarget.createMany({
        data: targets.map(target => ({
          post_id: postId,
          target_type: target.target_type,
          target_id: target.target_id
        }))
      });
    } catch (error) {
      // 记录错误，可能需要重试
      console.error(`Failed to process targets for post ${postId}:`, error);
      throw error;
    }
  }

  private async addToQueue(jobType: string, data: any) {
    if (jobType === 'create_post_targets') {
      // 添加到队列，设置重试策略
      await this.postTargetsQueue.add(data, {
        attempts: 3, // 最多重试3次
        backoff: {
          type: 'exponential',
          delay: 2000 // 初始延迟2秒，然后指数增长
        }
      });
    }
  }

  // 获取处理进度
  async getTargetsProgress(postId: number): Promise<{
    processed: number;
    total: number;
    status: 'processing' | 'completed';
  }> {
    const [processedCount, queueJobs] = await Promise.all([
      // 获取已处理的目标数量
      this.prisma.postTarget.count({
        where: { post_id: postId }
      }),
      // 获取队列中待处理的任务
      this.postTargetsQueue.getJobs(['waiting', 'active'])
    ]);

    // 计算队列中待处理的目标总数
    const pendingTargets = queueJobs
      .filter(job => job.data.postId === postId)
      .reduce((acc, job) => acc + job.data.targets.length, 0);

    const total = processedCount + pendingTargets;
    
    return {
      processed: processedCount,
      total,
      status: pendingTargets === 0 ? 'completed' : 'processing'
    };
  }

  async update(id: number, data: UpdatePostInput): Promise<Post> {
    try {
      return await this.prisma.post.update({
        where: { id },
        data,
        include: {
          author: true,
          post_targets: true
        }
      });
    } catch (error: any) {
      if (error.code === 'P2025') {
        throw new NotFoundError(`Post with id ${id} not found`);
      }
      throw error;
    }
  }

  async delete(id: number): Promise<Post> {
    try {
      return await this.prisma.post.delete({
        where: { id },
        include: {
          author: true,
          post_targets: true
        }
      });
    } catch (error: any) {
      if (error.code === 'P2025') {
        throw new NotFoundError(`Post with id ${id} not found`);
      }
      throw error;
    }
  }

  async findByUserId(userId: number, options?: { skip?: number; take?: number; }): Promise<Post[]> {
    return await this.prisma.post.findMany({
      skip: options?.skip,
      take: options?.take,
      where: {
        author_id: userId
      },
      include: {
        author: true,
        post_targets: true
      }
    });
  }

  async findById(id: number): Promise<Post> {
    const post = await this.prisma.post.findUnique({
      where: { id },
      include: {
        author: true,
        post_targets: true
      }
    });

    if (!post) {
      throw new NotFoundError(`Post with id ${id} not found`);
    }

    return post;
  }

  async findByTarget(targetType: string, targetId: number, options?: {
    skip?: number;
    take?: number;
  }): Promise<Post[]> {
    return await this.prisma.post.findMany({
      where: {
        post_targets: {
          some: {
            target_type: targetType,
            target_id: targetId
          }
        }
      },
      skip: options?.skip,
      take: options?.take,
      include: {
        author: true,
        post_targets: true
      },
      orderBy: {
        created_at: 'desc'  // 默认按创建时间倒序排列
      }
    });
  }

  private chunkArray<T>(array: T[], size: number): T[][] {
    const chunks: T[][] = [];
    for (let i = 0; i < array.length; i += size) {
      chunks.push(array.slice(i, i + size));
    }
    return chunks;
  }
}
