import prisma from '../config/database';
import { paymentService } from './payment.service';

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

    // Check if expired - support both 'verified' and 'active' status
    if ((badge.status === 'verified' || badge.status === 'active') && badge.expiresAt && new Date() > badge.expiresAt) {
      badge = await prisma.verificationBadge.update({
        where: { userId },
        data: { status: 'expired' },
      });
    }

    // Calculate days remaining
    let daysRemaining = 0;
    if ((badge.status === 'verified' || badge.status === 'active') && badge.expiresAt) {
      const diff = badge.expiresAt.getTime() - new Date().getTime();
      daysRemaining = Math.ceil(diff / (1000 * 60 * 60 * 24));
    }

    // Normalize status to 'active' for frontend
    const normalizedStatus = (badge.status === 'verified' || badge.status === 'active') ? 'active' : badge.status;

    return {
      status: normalizedStatus,
      purchasedAt: badge.purchasedAt,
      expiresAt: badge.expiresAt,
      daysRemaining,
      cost: VERIFICATION_COST,
    };
  },

  // Purchase verification - Create Flutterwave payment link
  async purchaseVerification(userId: string) {
    // Check if already active
    const existing = await prisma.verificationBadge.findUnique({
      where: { userId },
    });

    if (existing?.status === 'verified' && existing.expiresAt && new Date() < existing.expiresAt) {
      throw new Error('Verification badge is already active');
    }

    // Get user details
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { email: true, username: true, firstName: true, lastName: true },
    });

    if (!user || !user.email) {
      throw new Error('User email not found');
    }

    // Create Flutterwave payment link
    const paymentResult = await paymentService.initiateFlutterwaveDeposit({
      userId,
      amount: VERIFICATION_COST,
      currency: 'NGN',
      email: user.email,
      description: '✅ Verification Badge Purchase (30 days)',
      metadata: {
        type: 'verification_badge',
        userId,
        username: user.username,
        duration: VERIFICATION_DURATION_DAYS,
      },
    });

    if (!paymentResult.success || !paymentResult.data?.authorizationUrl) {
      throw new Error(paymentResult.message || 'Failed to create payment link');
    }

    return {
      success: true,
      paymentUrl: paymentResult.data.authorizationUrl,
      reference: paymentResult.data.reference,
      amount: VERIFICATION_COST,
      message: 'Complete payment to activate verification badge',
    };
  },

  // Process verification payment after Flutterwave callback
  async processVerificationPayment(reference: string) {
    try {
      console.log('🔄 Processing verification payment for reference:', reference);

      // Get transaction
      const transaction = await prisma.transaction.findUnique({
        where: { reference },
        include: { user: true },
      });

      if (!transaction) {
        console.error('❌ Transaction not found:', reference);
        throw new Error('Transaction not found');
      }

      console.log('✅ Transaction found:', {
        id: transaction.id,
        userId: transaction.userId,
        status: transaction.status,
        amount: transaction.amount,
      });

      if (transaction.status !== 'COMPLETED') {
        console.error('❌ Payment not completed. Status:', transaction.status);
        throw new Error('Payment not completed');
      }

      // Check if it's a verification badge payment
      const metadata = transaction.metadata as any;
      if (metadata?.type !== 'verification_badge') {
        console.error('❌ Not a verification badge payment. Type:', metadata?.type);
        throw new Error('Not a verification badge payment');
      }

      console.log('✅ Verified as verification badge payment');

      // Activate badge
      const now = new Date();
      const expiresAt = new Date(now.getTime() + VERIFICATION_DURATION_DAYS * 24 * 60 * 60 * 1000);

      console.log('🔄 Creating/updating verification badge:', {
        userId: transaction.userId,
        expiresAt: expiresAt.toISOString(),
      });

      const badge = await prisma.verificationBadge.upsert({
        where: { userId: transaction.userId },
        create: {
          userId: transaction.userId,
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

      console.log('✅ Verification badge created/updated:', {
        id: badge.id,
        userId: badge.userId,
        status: badge.status,
        expiresAt: badge.expiresAt,
      });

      // Send notification
      await prisma.notification.create({
        data: {
          userId: transaction.userId,
          type: 'SYSTEM',
          title: '✅ Verification Badge Activated!',
          message: `Your verification badge is now active for 30 days! You can now post videos on social feed and enjoy all premium features.`,
        },
      });

      console.log('✅ Notification sent to user:', transaction.userId);
      console.log(`🎉 Verification badge successfully activated for user ${transaction.userId}`);

      return {
        success: true,
        badge,
        message: 'Verification badge activated successfully!',
      };
    } catch (error: any) {
      console.error('❌ Process verification payment error:', error);
      console.error('Error details:', {
        message: error.message,
        stack: error.stack,
      });
      throw error;
    }
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

    // Support both 'active' and 'verified' status
    if (!badge || (badge.status !== 'active' && badge.status !== 'verified')) {
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

  // Manual verification by email (admin function)
  async manualVerifyUser(email: string) {
    const user = await prisma.user.findUnique({
      where: { email },
    });

    if (!user) {
      throw new Error('User not found');
    }

    const now = new Date();
    const expiresAt = new Date(now.getTime() + VERIFICATION_DURATION_DAYS * 24 * 60 * 60 * 1000);

    const badge = await prisma.verificationBadge.upsert({
      where: { userId: user.id },
      create: {
        userId: user.id,
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
      user: {
        id: user.id,
        email: user.email,
        username: user.username,
      },
      badge,
      message: `User ${email} verified until ${expiresAt.toLocaleDateString()}`,
    };
  },
};
