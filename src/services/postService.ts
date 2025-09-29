import { Service } from 'typedi';
import { Prisma, PrismaClient } from '@prisma/client';
import { Post } from '../modules/post/schema/postTypes';
import { CreatePostInput, UpdatePostInput } from '../modules/post/schema/postInputs';
import { NotFoundError, ValidationError } from '../modules/common/errors/graphql.error';
import Queue from 'bull';
import { ActivityExpirationService } from './activityExpirationService';
import { PointsService } from './pointService';
import { LoginStreakService } from './loginStreakService';
import logger from '../config/logger';
import { startOfDay, endOfDay, startOfMonth, endOfMonth } from 'date-fns';

/**
 * Service handling post-related business logic and database operations
 * 
 * This service provides methods for managing posts in the system, including:
 * - CRUD operations for post management
 * - Asynchronous processing of post targets using Bull queue
 * - Activity status tracking and expiration management
 * - Post view tracking and analytics
 * - Adding points when activity is completed through post creation
 * 
 * @remarks
 * Uses Prisma as the ORM and Bull for job queue management
 */
@Service()
export class PostService {
  public postTargetsQueue: Queue.Queue;

  constructor(
    private prisma: PrismaClient,
    private activityExpirationService: ActivityExpirationService,
    private pointsService: PointsService,
    private loginStreakService: LoginStreakService
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
   * @returns Promise<Post[]> The newly created post (array for backward compatibility)
   * @throws {ValidationError} If validation fails or prerequisites are not met
   * @throws {PrismaError} If database operations fail
   * @remarks This method creates a single post with multiple targets for efficiency
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

      return await this.prisma.$transaction(async (tx) => {
        // Create ONE post with ALL targets
        const post = await tx.post.create({
          data: {
            caption: data.caption,
            mediaUrls: data.mediaUrls,
            category: data.category,
            expires_at: new Date(Date.now() + 24 * 60 * 60 * 1000),
            author: { connect: { id: data.authorId } },
            post_targets: {
              create: data.post_targets.map(target => ({
                target_type: target.target_type,
                target_id: target.target_id
              }))
            }
          },
          include: {
            author: { include: { point: true } },
            post_targets: true,
            _count: { select: { likes: true } }
          }
        });

        // Update activity status
        const activity = await tx.activity.findUnique({
          where: { id: data.activityId },
          select: { 
            userId: true,
            category: true
          }
        });

        if (!activity) {
          throw new NotFoundError(`Activity with id ${data.activityId} not found`);
        }

        // Update activity as completed
        await tx.activity.update({
          where: { id: data.activityId },
          data: { 
            postId: post.id,
            status: "completed" 
          }
        });

        await this.activityExpirationService.cancelActivityExpiration(data.activityId);

        // Add points to user
        try {
          // Get user's primary_goal and secondary_goal
          const user = await tx.user.findUnique({
            where: { 
              id: activity.userId 
            },
            select: { 
              primary_goal: true,
              secondary_goal: true,
              timezone: true
            }
          });

          if (!user) {
            throw new Error(`User with id ${activity.userId} not found`);
          }
          
          // Determine points based on goal alignment
          let pointsToAdd = 45; // Default for additional goals
          
          if (user.primary_goal && activity.category === user.primary_goal) {
            // Primary goal match, get 100 points
            pointsToAdd = 100;
            logger.info(`Activity category ${activity.category} matches user's primary goal`);
          } else if (user.secondary_goal && activity.category === user.secondary_goal) {
            // Secondary goal match, get 75 points
            pointsToAdd = 75;
            logger.info(`Activity category ${activity.category} matches user's secondary goal`);
          } else {
            // Neither primary nor secondary goal, get 45 points
            logger.info(`Activity category ${activity.category} is an additional goal`);
          }
          
          // Update user points
          await this.pointsService.update(activity.userId, {
            points_added: pointsToAdd
          });
          
          logger.info(`Added ${pointsToAdd} points to user ${activity.userId} for completing activity ${data.activityId} through post creation (category: ${activity.category})`);
          
          // Update user's login streak
          try {
            const userTimezone = user.timezone || 'UTC';
            await this.loginStreakService.updateLoginStreak(activity.userId, userTimezone);
            logger.info(`Updated login streak for user ${activity.userId} after completing activity`);
          } catch (streakError) {
            logger.error('Failed to update login streak during post creation:', { 
              error: streakError, 
              userId: activity.userId,
              timezone: user.timezone || 'UTC'
            });
          }
        } catch (pointsError) {
          logger.error('Failed to add points during post creation:', { 
            error: pointsError, 
            userId: activity.userId,
            activityId: data.activityId 
          });
        }

        return [post]; // Return single post in array for backward compatibility
      });
    } catch (error) {
      logger.error('Failed to create post:', error);
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
   * @param options - Pagination options including currentUserId for like status
   * @returns Promise<Post[]> Array of posts by the user
   */
  async findByUserId(
    userId: number, 
    options?: { 
      skip?: number; 
      take?: number; 
      currentUserId?: number; 
    }
  ): Promise<Post[]> {
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
            likes: true,
            comments: true
          }
        },
        likes: options?.currentUserId ? {
          where: { user_id: options.currentUserId },
          select: { id: true }
        } : undefined
      }
    });

    return posts.map(post => ({
      ...post,
      liked: options?.currentUserId ? post.likes.length > 0 : false,
      likeCount: post._count.likes,
      commentCount: post._count.comments
    }));
  }

  /**
   * Find a specific post by its ID
   * 
   * @param id - ID of the post to find
   * @param currentUserId - ID of the current user to determine if post is liked
   * @returns Promise<Post> The found post
   * @throws {NotFoundError} If the post doesn't exist
   */
  async findById(id: number, currentUserId?: number): Promise<Post> {
    const post = await this.prisma.post.findUnique({
      where: { id },
      include: {
        author: {
          include: {point:true}
        },
        post_targets: true,
        _count: {
          select: {
            likes: true,
            comments: true
          }
        },
        likes: currentUserId ? {
          where: { user_id: currentUserId },
          select: { id: true }
        } : undefined
      }
    });

    if (!post) {
      throw new NotFoundError(`Post with id ${id} not found`);
    }

    return {
      ...post,
      liked: currentUserId ? post.likes.length > 0 : false,
      likeCount: post._count.likes,
      commentCount: post._count.comments
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
   * Find feed posts that are explicitly meant for friends or general feed
   * 
   * This method returns posts that are:
   * - Public posts targeting 'feed'
   * - Posts targeting specific friends
   * - Posts from friends that target communities (friends sharing in communities)
   * - User's own posts that target feed or friends
   * 
   * @param options - Query options for filtering and pagination
   * @returns Promise<Post[]> Array of feed posts meant for friends/feed
   */
  async findFeedPosts(options: {
    currentUserId: number;
    skip?: number;
    take?: number;
  }): Promise<Post[]> {
    // Get current user's friends
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

    // Build friend user IDs list
    const friendUserIds = friendIds.map(f => 
      f.user_id === options.currentUserId ? f.friend_id : f.user_id
    );

    // Add current user to the list to include their own posts
    const allRelevantUserIds = [...friendUserIds, options.currentUserId];

    // Query posts that are explicitly meant for friends or general feed
    const posts = await this.prisma.post.findMany({
      where: {
        AND: [
          {
            OR: [
              // Posts targeting 'feed' (public posts) - BUT ONLY FROM FRIENDS OR SELF
              {
                AND: [
                  { author_id: { in: allRelevantUserIds } },
                  {
                    post_targets: {
                      some: {
                        target_type: 'feed'
                      }
                    }
                  }
                ]
              },
              // Posts targeting specific friends
              {
                post_targets: {
                  some: {
                    target_type: 'user',
                    target_id: { in: friendUserIds }
                  }
                }
              },
              // Posts from friends that target communities (friends sharing in communities)
              {
                AND: [
                  { author_id: { in: friendUserIds } },
                  {
                    post_targets: {
                      some: {
                        target_type: 'community'
                      }
                    }
                  }
                ]
              },
              // User's own posts that target feed or friends
              {
                AND: [
                  { author_id: options.currentUserId },
                  {
                    OR: [
                      {
                        post_targets: {
                          some: {
                            target_type: 'feed'
                          }
                        }
                      },
                      {
                        post_targets: {
                          some: {
                            target_type: 'user'
                          }
                        }
                      }
                    ]
                  }
                ]
              }
            ]
          },
          // Filter by expiration
          {
            OR: [
              { expires_at: null },  // Posts that never expire
              { expires_at: { gt: new Date() } }  // Posts that haven't expired yet
            ]
          },
          // Only include non-deleted posts
          { is_deleted: false }
        ]
      },
      skip: options.skip,
      take: options.take,
      include: {
        author: {
          include: { point: true }
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
   * @remarks This method finds posts that target communities the user has joined
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
          },
          // Only include non-deleted posts
          { is_deleted: false }
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
   * Added this new method.
   * Counts the total number of posts created by a specific user.
   * This is used to check if a user is making their first post to complete a referral.
   *
   * @param userId - The ID of the user whose posts are to be counted.
   * @returns Promise<number> The total count of posts for the user.
   */
  async getPostCountForUser(userId: number): Promise<number> {
    return this.prisma.post.count({
      where: {
        author_id: userId,
      },
    });
  }

  /**
   * First finds a post by its ID to get its author and creation date,
   * then finds all posts by that author on that same day.
   *
   * @param postId The ID of the initial post.
   * @returns Promise<Post[]> An array of posts matching the criteria.
   * @throws {NotFoundError} If the initial post with postId is not found.
   */
  async findPostsFromSameDayAsPost(postId: number): Promise<Post[]> {
    // Step 1: Get the original post to find its author and creation date
    const originalPost = await this.prisma.post.findUnique({
      where: { id: postId },
      select: {
        author_id: true,
        created_at: true,
      },
    });

    if (!originalPost) {
      throw new NotFoundError(`Post with id ${postId} not found`);
    }

    const { author_id, created_at } = originalPost;

    // Step 2: Reuse the existing findMyPostsByDay logic to get all posts
    // from that author on that specific day.
    return this.prisma.post.findMany({
      where: {
        author_id,
        is_deleted: false,
        created_at: {
          gte: startOfDay(created_at),
          lte: endOfDay(created_at),
        },
      },
      orderBy: [{ created_at: 'asc' }, { id: 'asc' }],
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
        }
      }
    });
  }
}