import { ObjectType, Field, InputType } from 'type-graphql';
import { Post } from './postTypes';
import { FieldError } from '../../common/types/errorTypes';

@InputType()
export class MonthFilterInput {
  @Field()
  year!: number;

  @Field()
  month!: number; // 1..12

  @Field(() => [String], { nullable: true })
  categories?: string[];
}

@ObjectType()
export class DayPreview {
  @Field()
  date!: Date; // start-of-day UTC

  @Field(() => Post, { nullable: true })
  firstPost?: Post | null;

  @Field()
  count!: number;
}

@ObjectType()
export class MonthCalendarResponse {
  @Field()
  success!: boolean;

  @Field(() => [DayPreview])
  days!: DayPreview[];

  @Field(() => [FieldError], { nullable: true })
  errors?: FieldError[];
}