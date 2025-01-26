import { InputType, Field, Int } from 'type-graphql';

@InputType()
export class CreateCommentInput {
  @Field(() => Int)
  post_id: number;

  @Field(() => String)
  content: string;

  @Field(() => Int, { nullable: true })
  parent_comment_id?: number;
}
