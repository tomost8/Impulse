import { Service } from 'typedi';
import { CurrentTime } from '../modules/common/schema/timeTypes';
import { pubsub } from '../config/pubsub';

export const TIME_UPDATED = 'TIME_UPDATED';

@Service()
class TimeService {
  private interval: NodeJS.Timeout | null = null;
  private subscriberCount: number = 0;

  isRunning(): boolean {
    return this.interval !== null;
  }

  incrementSubscribers() {
    this.subscriberCount++;
    console.log(`Subscriber added. Total subscribers: ${this.subscriberCount}`);
    if (this.subscriberCount === 1) {
      this.startTimeUpdates();
    }
  }

  decrementSubscribers() {
    this.subscriberCount = Math.max(0, this.subscriberCount - 1);
    console.log(`Subscriber removed. Total subscribers: ${this.subscriberCount}`);
    if (this.subscriberCount === 0) {
      this.stopTimeUpdates();
    }
  }

  async startTimeUpdates() {
    if (this.interval) {
      console.log('Time updates already running');
      return;
    }

    console.log('Starting time updates');
    // 立即发送一次更新
    const now = new Date();
    const timeData = {
      currentTime: {
        timestamp: now.toISOString(),
        formatted: now.toLocaleTimeString()
      }
    };
    console.log('Publishing initial time update:', timeData);
    await pubsub.publish(TIME_UPDATED, timeData);

    // 每秒更新一次时间
    this.interval = setInterval(async () => {
      const now = new Date();
      const timeData = {
        currentTime: {
          timestamp: now.toISOString(),
          formatted: now.toLocaleTimeString()
        }
      };
      console.log('Publishing time update:', timeData);
      await pubsub.publish(TIME_UPDATED, timeData);
    }, 1000);
  }

  private stopTimeUpdates() {
    if (this.interval) {
      console.log('Stopping time updates');
      clearInterval(this.interval);
      this.interval = null;
    }
  }
}

export const timeService = new TimeService(); 