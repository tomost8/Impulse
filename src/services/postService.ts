import { Service } from 'typedi';
import { Prisma, PrismaClient } from '@prisma/client';
import { Post } from '../modules/post/schema/postTypes';
import { CreatePostInput, UpdatePostInput } from '../modules/post/schema/postInputs';
import { NotFoundError, ValidationError } from '../modules/common/errors/graphql.error';
import Queue from 'bull';
import { ActivityExpirationService } from './activityExpirationService';

/**
 * Service handling post-related business logic and database operations
 * 
 * This service provides methods for managing posts in the system, including:
 * - CRUD operations for post management
 * - Asynchronous processing of post targets using Bull queue
 * - Activity status tracking and expiration management
 * - Post view tracking and analytics
 * 
 * @remarks
 * Uses Prisma as the ORM and Bull for job queue management
 */
@Service()
export class PostService {
  public postTargetsQueue: Queue.Queue;

  constructor(
    private prisma: PrismaClient,
    private activityExpirationService: ActivityExpirationService
  ) {
    // Initialize the Bull queue for post targets processing
    this.postTargetsQueue = new Queue('post-targets', {
      redis: {
        host: process.env.REDIS_HOST || 'localhost',
        port: parseInt(process.env.REDIS_PORT || '6379')
      }
    });

    // Process jobs in the queue
    this.postTargetsQueue.process(async (job) => {
      const { postId, targets } = job.data;
      await this.processTargetsQueue(postId, targets);
    });
  }

  /**
   * Retrieve all posts with optional filtering and pagination
   * 
   * @param options - Query options for filtering and pagination
   * @param options.skip - Number of records to skip
   * @param options.take - Number of records to take
   * @param options.category - Filter posts by category
   * @returns Promise<Post[]> Array of posts with their authors and targets
   * @throws {PrismaError} If database query fails
   */
  async findAll(options?: {
    skip?: number;
    take?: number;
    category?: string;
  }): Promise<Post[]> {
    const posts = await this.prisma.post.findMany({
      skip: options?.skip,
      take: options?.take,
      where: {
        category: options?.category
      },
      include: {
        author: {
          include: {point: true}
        },
        post_targets: true,
        _count: {
          select: {
            likes: true  // 只添加这一行来获取点赞数
          }
        }
      }
    });


    return posts.map(post => ({
      ...post,
      likeCount: post._count.likes
    }));
  }

  /**
   * Create a new post with associated targets and activity tracking
   * 
   * @param data - Post creation data containing required information
   * @returns Promise<Post[]> The newly created posts
   * @throws {ValidationError} If validation fails or prerequisites are not met
   * @throws {PrismaError} If database operations fail
   * @remarks This method handles high concurrency by processing targets in batches
   */
  async create(data: CreatePostInput): Promise<Post[]> {
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
        const posts: any[] = [];
        // 分离社区目标和其他目标
        const communityTargets = data.post_targets.filter(target => 
          target.target_type === 'community'
        );
        const otherTargets = data.post_targets.filter(target => 
          target.target_type !== 'community'
        );

        // 为每个社区创建独立帖子
        if (communityTargets.length > 0) {
          const communityPosts = await Promise.all(
            communityTargets.map(target => 
              tx.post.create({
                data: {
                  caption: data.caption,
                  mediaUrl: data.mediaUrl,
                  category: data.category,
                  expires_at: new Date(Date.now() + 24 * 60 * 60 * 1000),
                  author: { connect: { id: data.authorId } },
                  post_targets: {
                    create: {
                      target_type: target.target_type,
                      target_id: target.target_id
                    }
                  }
                },
                include: {
                  author: { include: { point: true } },
                  post_targets: true,
                  _count: { select: { likes: true } }
                }
              })
            )
          );
          posts.push(...communityPosts);
        }

        // 为其他目标创建一个帖子，保持原有的高并发处理逻辑
        if (otherTargets.length > 0) {
          const initialTargets = otherTargets.slice(0, HIGH_CONCURRENCY_THRESHOLD);
          const otherPost = await tx.post.create({
            data: {
              caption: data.caption,
              mediaUrl: data.mediaUrl,
              category: data.category,
              expires_at: new Date(Date.now() + 24 * 60 * 60 * 1000),
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
              author: { include: { point: true } },
              post_targets: true,
              _count: { select: { likes: true } }
            }
          });

          // 处理剩余的其他目标
          if (otherTargets.length > HIGH_CONCURRENCY_THRESHOLD) {
            const remainingTargets = otherTargets.slice(HIGH_CONCURRENCY_THRESHOLD);
            const BATCH_SIZE = 100;
            const chunks = this.chunkArray(remainingTargets, BATCH_SIZE);
            
            for (const chunk of chunks) {
              await this.addToQueue('create_post_targets', {
                postId: otherPost.id,
                targets: chunk
              });
            }
          }

          posts.push(otherPost);
        }

        // 更新活动状态
        if (posts.length > 0) {
          await tx.activity.update({
            where: { id: data.activityId },
            data: { 
              postId: posts[0].id,
              status: "completed" 
            }
          });

          await this.activityExpirationService.cancelActivityExpiration(data.activityId);
        }

        return posts.map(post => ({
          ...post,
          likeCount: post._count.likes,
          liked: false
        }));
      });
    } catch (error: any) {
      if (error.code === 'P2003') {
        throw new ValidationError(`Invalid authorId: ${data.authorId}`);
      }
      throw error;
    }
  }

  /**
   * Process queued post targets in batches
   * 
   * @param postId - ID of the post to create targets for
   * @param targets - Array of target objects to process
   * @throws {Error} If target creation fails
   * @private
   */
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
      console.error(`Failed to process targets for post ${postId}:`, error);
      throw error;
    }
  }

  /**
   * Add a job to the Bull queue with retry configuration
   * 
   * @param jobType - Type of job to add to queue
   * @param data - Job data to be processed
   * @private
   */
  private async addToQueue(jobType: string, data: any) {
    if (jobType === 'create_post_targets') {
      await this.postTargetsQueue.add(data, {
        attempts: 3,
        backoff: {
          type: 'exponential',
          delay: 2000
        }
      });
    }
  }

  /**
   * Get the progress of target processing for a post
   * 
   * @param postId - ID of the post to check progress for
   * @returns Promise with progress information including processed count and status
   */
  async getTargetsProgress(postId: number): Promise<{
    processed: number;
    total: number;
    status: 'processing' | 'completed';
  }> {
    const [processedCount, queueJobs] = await Promise.all([
      this.prisma.postTarget.count({
        where: { post_id: postId }
      }),
      this.postTargetsQueue.getJobs(['waiting', 'active'])
    ]);

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

  /**
   * Update an existing post
   * 
   * @param id - ID of the post to update
   * @param data - Updated post data
   * @returns Promise<Post> The updated post
   * @throws {NotFoundError} If the post doesn't exist
   * @throws {PrismaError} If database operation fails
   */
  async update(id: number, data: UpdatePostInput): Promise<Post> {
    try {
      const post = await this.prisma.post.update({
        where: { id },
        data,
        include: {
          author: {
            include: {point: true}
          },
          post_targets: true,
          _count: {
            select: {
              likes: true
            }
          }
        }
      });
      return {
        ...post,
        likeCount: post._count.likes
      };
    } catch (error: any) {
      if (error.code === 'P2025') {
        throw new NotFoundError(`Post with id ${id} not found`);
      }
      throw error;
    }
  }

  /**
   * Delete a post and its associated data
   * 
   * @param id - ID of the post to delete
   * @returns Promise<Post> The deleted post
   * @throws {NotFoundError} If the post doesn't exist
   * @throws {PrismaError} If database operation fails
   */
  async delete(id: number): Promise<Post> {
    try {
      const post = await this.prisma.post.delete({
        where: { id },
        include: {
          author: {
            include: {point: true}
          },
          post_targets: true,
          _count: {
            select: {
              likes: true
            }
          }
        }
      });
      return {
        ...post,
        likeCount: post._count.likes
      };
    } catch (error: any) {
      if (error.code === 'P2025') {
        throw new NotFoundError(`Post with id ${id} not found`);
      }
      throw error;
    }
  }

  /**
   * Find all posts by a specific user
   * 
   * @param userId - ID of the user to find posts for
   * @param options - Pagination options
   * @returns Promise<Post[]> Array of posts by the user
   */
  async findByUserId(userId: number, options?: { skip?: number; take?: number; }): Promise<Post[]> {
    const posts = await this.prisma.post.findMany({
      skip: options?.skip,
      take: options?.take,
      where: {
        author_id: userId
      },
      include: {
        author: {
          include: {point: true}
        },
        post_targets: true,
        _count: {
          select: {
            likes: true
          }
        }
      }
    });

    return posts.map(post => ({
      ...post,
      likeCount: post._count.likes
    }));
  }

  /**
   * Find a specific post by its ID
   * 
   * @param id - ID of the post to find
   * @returns Promise<Post> The found post
   * @throws {NotFoundError} If the post doesn't exist
   */
  async findById(id: number): Promise<Post> {
    const post = await this.prisma.post.findUnique({
      where: { id },
      include: {
        author: {
          include: {point:true}
        },
        post_targets: true,
        _count: {
          select: {
            likes: true
          }
        }
      }
    });

    if (!post) {
      throw new NotFoundError(`Post with id ${id} not found`);
    }

    return {
      ...post,
      likeCount: post._count.likes
    };
  }

  /**
   * Find posts with complex filtering options
   * 
   * @param options - Query options for filtering posts
   * @returns Promise<Post[]> Array of filtered posts
   * @remarks This method includes permission checks for community and group posts
   */
  async findPosts(
    options?: {
      targetType?: string;
      targetId?: number;
      skip?: number;
      take?: number;
      currentUserId?: number;
      unreadOnly?: boolean;
      category?: string;
    }
  ): Promise<Post[]> {
    // Check access permissions for target type
    if (options?.targetType && options?.targetId && options?.currentUserId) {
      let hasAccess = true;

      if (options.targetType === 'community') {
        const membership = await this.prisma.communityMember.findFirst({
          where: {
            community_id: options.targetId,
            user_id: options.currentUserId,
            status: 'ACCEPTED'
          }
        });
        hasAccess = !!membership;
      } else if (options.targetType === 'group') {
        const membership = await this.prisma.chatMember.findFirst({
          where: {
            chat_id: options.targetId,
            user_id: options.currentUserId,
            status: 'ACCEPTED'
          }
        });
        hasAccess = !!membership;
      }

      if (!hasAccess) {
        return [];
      }
    }

    // Build query conditions
    const whereConditions: Prisma.PostWhereInput[] = [];

    if (options?.targetType && options?.targetId) {
      whereConditions.push({
        post_targets: {
          some: {
            target_type: options.targetType,
            target_id: options.targetId
          }
        }
      });
    }

    if (options?.unreadOnly && options?.currentUserId) {
      whereConditions.push({
        post_views: {
          none: {
            user_id: options.currentUserId
          }
        }
      });
    }

    if (options?.category) {
      whereConditions.push({ category: options.category });
    }

    const where: Prisma.PostWhereInput = whereConditions.length > 0 
      ? { AND: whereConditions }
      : {};

    // Execute query with all includes
    const posts = await this.prisma.post.findMany({
      where,
      skip: options?.skip,
      take: options?.take,
      include: {
        author: {
          include: {point: true}
        },
        post_targets: true,
        post_views: true,
        _count: {
          select: {
            post_views: true,
            likes: true 
          }
        },
        likes: options?.currentUserId
        ? { where: { user_id: options.currentUserId }, select: { id: true } }
        : false,

      },
      orderBy: {
        created_at: 'desc'
      }
    });

    return posts.map((post) => ({
      ...post,
      liked: post.likes.length > 0, // 如果用户已点赞，则为 true
      likeCount: post._count.likes
    }));  
  }

  /**
   * Split an array into chunks of specified size
   * 
   * @param array - Array to split
   * @param size - Size of each chunk
   * @returns Array of chunks
   * @private
   */
  private chunkArray<T>(array: T[], size: number): T[][] {
    const chunks: T[][] = [];
    for (let i = 0; i < array.length; i += size) {
      chunks.push(array.slice(i, i + size));
    }
    return chunks;
  }

  /**
   * Record a view of a post by a user
   * 
   * @param postId - ID of the post viewed
   * @param userId - ID of the user viewing the post
   * @throws {NotFoundError} If the post or user doesn't exist
   * @throws {PrismaError} If database operation fails
   */
  async recordView(postId: number, userId: number): Promise<void> {
    try {
      await this.prisma.postView.upsert({
        where: {
          post_id_user_id: {
            post_id: postId,
            user_id: userId
          }
        },
        update: {}, // Empty update as viewed_at will auto-update
        create: {
          post_id: postId,
          user_id: userId
        }
      });
    } catch (error) {
      if (error instanceof Prisma.PrismaClientKnownRequestError) {
        if (error.code === 'P2002') {
          // Unique constraint violation, record already exists
          return;
        }
        if (error.code === 'P2003') {
          throw new NotFoundError('Post or user not found');
        }
      }
      throw error;
    }
  }

  /**
   * Find all feed posts from friends
   * 
   * @param options - Query options for filtering and pagination
   * @returns Promise<Post[]> Array of feed posts from friends
   */
  async findFeedPosts(options: {
    currentUserId: number;
    skip?: number;
    take?: number;
  }): Promise<Post[]> {
    // 获取当前用户的好友列表
    const friendIds = await this.prisma.friendship.findMany({
      where: {
        OR: [
          { user_id: options.currentUserId, status: 'ACCEPTED' },
          { friend_id: options.currentUserId, status: 'ACCEPTED' }
        ]
      },
      select: {
        user_id: true,
        friend_id: true
      }
    });

    // 构建好友ID列表
    const friendUserIds = friendIds.map(f => 
      f.user_id === options.currentUserId ? f.friend_id : f.user_id
    );

    // 查询好友的未过期 feed 帖子
    const posts = await this.prisma.post.findMany({
      where: {
        AND: [
          {
            post_targets: {
              some: {
                target_type: 'feed'
              }
            }
          },
          {
            author_id: {
              in: friendUserIds
            }
          },
          {
            OR: [
              { expires_at: null },  // 永不过期的帖子
              { expires_at: { gt: new Date() } }  // 未过期的帖子
            ]
          }
        ]
      },
      skip: options.skip,
      take: options.take,
      include: {
        author: {
          include: {point: true}
        },
        post_targets: true,
        _count: {
          select: {
            likes: true,
            comments: true
          }
        },
        likes: {
          where: { user_id: options.currentUserId },
          select: { id: true }
        }
      },
      orderBy: {
        created_at: 'desc'
      }
    });

    return posts.map((post) => ({
      ...post,
      liked: post.likes.length > 0,
      likeCount: post._count.likes,
      commentCount: post._count.comments
    }));
  }

  /**
   * Find all posts from joined communities
   * 
   * @param options - Query options for filtering and pagination
   * @returns Promise<Post[]> Array of posts from joined communities
   */
  async findJoinedCommunityPosts(options: {
    currentUserId: number;
    skip?: number;
    take?: number;
  }): Promise<Post[]> {
    // 1. 获取用户加入的社区ID列表
    const communityIds = await this.prisma.communityMember.findMany({
      where: {
        user_id: options.currentUserId,
        status: 'ACCEPTED'
      },
      select: {
        community_id: true
      }
    });

    // 2. 查询这些社区的未过期帖子
    const posts = await this.prisma.post.findMany({
      where: {
        AND: [
          {
            post_targets: {
              some: {
                target_type: 'community',
                target_id: {
                  in: communityIds.map(c => c.community_id)
                }
              }
            }
          },
          {
            OR: [
              { expires_at: null },  // 永不过期的帖子
              { expires_at: { gt: new Date() } }  // 未过期的帖子
            ]
          }
        ]
      },
      skip: options.skip,
      take: options.take,
      include: {
        author: {
          include: {point: true}
        },
        post_targets: true,
        _count: {
          select: {
            likes: true,
            comments: true
          }
        },
        likes: {
          where: { user_id: options.currentUserId },
          select: { id: true }
        }
      },
      orderBy: {
        created_at: 'desc'
      }
    });

    return posts.map((post) => ({
      ...post,
      liked: post.likes.length > 0,
      likeCount: post._count.likes,
      commentCount: post._count.comments
    }));
  }
}


