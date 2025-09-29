// src/services/referralService.ts
import { Service } from 'typedi';
import { PrismaClient } from '@prisma/client';
import { PointsService } from './pointService';
import logger from '../config/logger';

@Service()
export class ReferralService {
  constructor(
    private prisma: PrismaClient,
    private pointsService: PointsService
  ) {}

  async completeReferralForUser(userId: number): Promise<void> {
    // Check if the user was referred and the referral is still pending
    const referral = await this.prisma.referral.findFirst({
      where: {
        referee_id: userId,
        status: 'pending'
      }
    });

    if (!referral) {
      // No pending referral for this user, so do nothing.
      return;
    }

    // 1. Mark the referral as complete
    await this.prisma.referral.update({
      where: { id: referral.id },
      data: {
        status: 'completed',
        completed_at: new Date()
      }
    });

    const referralBonus = 1500;

    // 2. Award points to the referee (the new user)
    await this.pointsService.update(referral.referee_id, { points_added: referralBonus });

    // 3. Award points to the referrer
    await this.pointsService.update(referral.referrer_id, { points_added: referralBonus });
    
    logger.info('Referral completed successfully', { referralId: referral.id });
  }
}
