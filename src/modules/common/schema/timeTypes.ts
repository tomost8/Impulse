import { Field, ObjectType } from 'type-graphql';

@ObjectType()
export class CurrentTime {
  @Field(() => String)
  timestamp!: string;

  @Field(() => String)
  formatted!: string;
}

@ObjectType()
export class TimeSubscriptionPayload {
  @Field(() => CurrentTime)
  currentTime!: CurrentTime;
}
