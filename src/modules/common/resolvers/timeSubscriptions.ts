import { Resolver, Subscription, Root } from 'type-graphql';
import { Service } from 'typedi';
import { CurrentTime, TimeSubscriptionPayload } from '../schema/timeTypes';
import { timeService, TIME_UPDATED } from '../../../services/timeService';
import { pubsub } from '../../../config/pubsub';
@Service()
@Resolver()
export class TimeSubscriptions {
  @Subscription(() => CurrentTime, {
    // @ts-ignore: type-graphql 和 yoga pubsub 类型不匹配
    subscribe: async function* () {
      console.log('Subscription started');
      timeService.incrementSubscribers();
      const subscription = pubsub.subscribe(TIME_UPDATED);
      try {
        for await (const value of subscription) {
          console.log('Received value:', value);
          yield value;
        }
      } finally {
        console.log('Subscription ended');
        timeService.decrementSubscribers();
      }
    }
  })
  currentTime(@Root() payload: TimeSubscriptionPayload): CurrentTime {
    console.log('Resolving time data:', payload);
    return payload.currentTime;
  }
} 