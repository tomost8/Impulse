import Queue from 'bull';
import { Service } from 'typedi';
import { PrismaClient } from '@prisma/client';
import logger from '../config/logger';
import { ChallengeService } from './challengeService';
import { ChallengeStatus } from '../modules/common/types/enumTypes';

@Service()
export class ChallengeQueueService {
  public challengeFinalizeQueue: Queue.Queue;

  constructor(
    private prisma: PrismaClient,
    private challengeService: ChallengeService
  ) {
    this.challengeFinalizeQueue = new Queue('challenge-finalize', {
      redis: {
        host: process.env.REDIS_HOST || 'localhost',
        port: parseInt(process.env.REDIS_PORT || '6379'),
      },
    });
    this.setupProcessor();
  }

  private setupProcessor() {
    this.challengeFinalizeQueue.process(async (job) => {
      const { userChallengeId } = job.data;
      logger.info(`Finalizing challenge ${userChallengeId}`);
      const uc = await this.prisma.userChallenge.findUnique({
        where: { id: userChallengeId },
      });
      if (uc?.status === ChallengeStatus.ACTIVE) {
        await this.challengeService.finalizeChallengeAttempt(uc);
      }
    });
  }

  async shutdown() {
    await this.challengeFinalizeQueue.close();
    logger.info('Challenge finalize queue shut down');
  }
}