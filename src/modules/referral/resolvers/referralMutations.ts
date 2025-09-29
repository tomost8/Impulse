import { Resolver, Mutation, Ctx, UseMiddleware } from 'type-graphql';
import { Service } from 'typedi';
import prisma from '../../../config/prisma'; // adjust import path
import { authMiddleware } from '../../../middleware/authMiddleware';

function generateReferralCode(length: number = 8): string {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789"; 
  // Removed confusing characters: I, O, 0, 1
  let code = "";

  for (let i = 0; i < length; i++) {
    const randomIndex = Math.floor(Math.random() * chars.length);
    code += chars[randomIndex];
  }

  return code;
}

@Service()
@Resolver()
export class ReferralMutations {
  // Return referral link for the current user (create code if missing)
  @Mutation(() => String)
  @UseMiddleware(authMiddleware)
  async generateReferralLink(@Ctx() ctx: any): Promise<string> {
    const uid = ctx.user.uid;
    console.log('User UID:', uid);
    const user = await prisma.user.findUnique({ where: { firebase_uid: uid } });
    if (!user) throw new Error('User not found');

    let code = user.referral_code;
    if (!code) {
      code = generateReferralCode(); // Generate a new code
      await prisma.user.update({ where: { firebase_uid: uid }, data: { referral_code: code } });
    }
    console.log('💫 Referral code:', code);
    // public link
    return code;
  }
}
