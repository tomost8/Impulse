import { Resolver, Subscription, Root } from 'type-graphql';
import { Service } from 'typedi';
import { User, UserCreatedPayload } from '../schema/userTypes';
import { USER_CREATED } from '../../../services/userService';

@Service()
@Resolver()
export class UserSubscriptions {
  @Subscription(() => User, {
    topics: USER_CREATED,
    description: 'Subscribe to user creation events'
  })
  userCreated(@Root() payload: { userCreated: User }): User {
    console.log('Resolving user subscription data:', payload);
    return payload.userCreated;
  }
} 