import Queue from 'bull';
import { Service } from 'typedi';
import { PrismaClient } from '@prisma/client';
import logger from '../config/logger';
import { ChallengeService } from './challengeService';

@Service()
export class ChallengeQueueService {
  public challengeFinalizeQueue: Queue.Queue;
  private challengeService: ChallengeService;

  constructor(private prisma: PrismaClient) {
    this.challengeService = new ChallengeService(this.prisma);

    // Initialize Bull queue
    this.challengeFinalizeQueue = new Queue('challenge-finalize', {
      redis: {
        host: process.env.REDIS_HOST || 'localhost',
        port: parseInt(process.env.REDIS_PORT || '6379'),
      },
    });

    this.setupProcessor();
    this.initializeSchedulers();
  }

  private setupProcessor() {
    this.challengeFinalizeQueue.process(async (job) => {
      logger.info('Processing challenge finalizer job...');
      try {
        const results = await this.challengeService.finalizeDueChallenges();
        logger.info(`Challenge finalizer processed ${results.length} items`);
      } catch (err) {
        logger.error('Challenge finalizer failed', err);
        throw err; // let Bull handle retries
      }
    });
  }

  private initializeSchedulers() {
    // Repeat every day at 00:05
    this.challengeFinalizeQueue.add(
      {},
      {
        repeat: {
          cron: '5 0 * * *', // server time
          tz: process.env.TZ || 'UTC', // optional timezone
        },
        removeOnComplete: true, // clean up jobs after completion
        removeOnFail: false, // keep failed jobs for inspection
      }
    );

    logger.info('Challenge finalize scheduler initialized');
  }

  async shutdown() {
    await this.challengeFinalizeQueue.close();
    logger.info('Challenge finalize queue shut down');
  }
}
