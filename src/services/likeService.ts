import { PrismaClient } from "@prisma/client";
import { Service } from "typedi";
import { NotFoundError } from "../modules/common/errors/graphql.error";

@Service()
export class LikeService {
  constructor(
    private prisma: PrismaClient
  ) {}


  async likePost(postId: number, userId: number): Promise<{ success: boolean; message?: string }> {
    try {
      // check if post exists
      const post = await this.prisma.post.findUnique({
        where: { id: postId },
      });
  
      if (!post) {
        throw new Error('Post not found');
      }
  
      // create like record
      await this.prisma.like.create({
        data: {
          post: { connect: { id: postId } },
          user: { connect: { id: userId } },
        },
      });
  
      return { success: true, message: 'Post liked successfully' };
    } catch (error: any) {
      if (error.code === 'P2002') {
        throw new Error('You have already liked this post');
      }
  
      console.error('Failed to like post:', error);
      throw error;
    }
  }  

  async unlikePost(postId: number, userId: number): Promise<{ success: boolean; message?: string }> {
    try {
      // 检查是否有点赞记录
      const like = await this.prisma.like.findUnique({
        where: {
          post_id_user_id: {
            post_id: postId,
            user_id: userId,
          },
        },
      });
  
      if (!like) {
        throw new Error('Like not found');
      }
  
      // 删除点赞记录
      await this.prisma.like.delete({
        where: { id: like.id },
      });
  
      return { success: true, message: 'Post unliked successfully' };
    } catch (error) {
      console.error('Failed to unlike post:', error);
      throw error;
    }
  }

  async getPostLikesCount(postId: number): Promise<number> {
    return await this.prisma.like.count({
      where: { post_id: postId },
    });
  }

  async hasLikedPost(postId: number, userId: number): Promise<boolean> {
    const like = await this.prisma.like.findUnique({
      where: {
        post_id_user_id: {
          post_id: postId,
          user_id: userId,
        },
      },
    });
  
    return !!like;
  }
  
}