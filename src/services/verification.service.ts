import { prisma } from '../config/database';

const VERIFICATION_COST = 2000; // ₦2,000
const VERIFICATION_DURATION_DAYS = 30;

export const verificationService = {
  // Get verification status
  async getVerificationStatus(userId: string) {
    let badge = await prisma.verificationBadge.findUnique({
      where: { userId },
    });

    // Create if doesn't exist
    if (!badge) {
      badge = await prisma.verificationBadge.create({
        data: {
          userId,
          status: 'none',
        },
      });
    }

    // Check if expired
    if (badge.status === 'active' && badge.expiresAt && new Date() > badge.expiresAt) {
      badge = await prisma.verificationBadge.update({
        where: { userId },
        data: { status: 'expired' },
      });
    }

    // Calculate days remaining
    let daysRemaining = 0;
    if (badge.status === 'active' && badge.expiresAt) {
      const diff = badge.expiresAt.getTime() - new Date().getTime();
      daysRemaining = Math.ceil(diff / (1000 * 60 * 60 * 24));
    }

    return {
      status: badge.status,
      purchasedAt: badge.purchasedAt,
      expiresAt: badge.expiresAt,
      daysRemaining,
      cost: VERIFICATION_COST,
    };
  },

  // Purchase verification
  async purchaseVerification(userId: string) {
    // Check if already active
    const existing = await prisma.verificationBadge.findUnique({
      where: { userId },
    });

    if (existing?.status === 'active' && existing.expiresAt && new Date() < existing.expiresAt) {
      throw new Error('Verification badge is already active');
    }

    // Get NGN wallet
    const wallet = await prisma.wallet.findFirst({
      where: { userId, currency: 'NGN' },
    });

    if (!wallet) {
      throw new Error('NGN wallet not found');
    }

    if (wallet.balance.toNumber() < VERIFICATION_COST) {
      throw new Error('Insufficient balance. Please deposit funds to your NGN wallet.');
    }

    // Deduct from wallet
    await prisma.wallet.update({
      where: { id: wallet.id },
      data: { balance: { decrement: VERIFICATION_COST } },
    });

    // Create transaction record
    await prisma.transaction.create({
      data: {
        userId,
        walletId: wallet.id,
        type: 'DEPOSIT',
        status: 'COMPLETED',
        amount: VERIFICATION_COST,
        fee: 0,
        netAmount: VERIFICATION_COST,
        currency: 'NGN',
        reference: `VER-${Date.now()}`,
        description: 'Verification Badge Purchase',
        processedAt: new Date(),
      },
    });

    // Activate badge
    const now = new Date();
    const expiresAt = new Date(now.getTime() + VERIFICATION_DURATION_DAYS * 24 * 60 * 60 * 1000);

    const badge = await prisma.verificationBadge.upsert({
      where: { userId },
      create: {
        userId,
        status: 'active',
        purchasedAt: now,
        expiresAt,
      },
      update: {
        status: 'active',
        purchasedAt: now,
        expiresAt,
      },
    });

    return {
      success: true,
      badge,
      message: 'Verification badge activated successfully!',
    };
  },

  // Renew verification
  async renewVerification(userId: string) {
    return this.purchaseVerification(userId);
  },

  // Check if user can post media
  async canPostMedia(userId: string): Promise<boolean> {
    const badge = await prisma.verificationBadge.findUnique({
      where: { userId },
    });

    if (!badge || badge.status !== 'active') {
      return false;
    }

    if (badge.expiresAt && new Date() > badge.expiresAt) {
      // Auto-expire
      await prisma.verificationBadge.update({
        where: { userId },
        data: { status: 'expired' },
      });
      return false;
    }

    return true;
  },
};
