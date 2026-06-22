import { Request, Response } from 'express';
import { paymentService } from '../services/payment.service';
import { AuthenticatedRequest } from '../middleware/auth.middleware';
import { Currency } from '@prisma/client';
import config from '../config/config';

export const paymentController = {
  // POST /api/payments/deposit/initiate - Initiate deposit
  async initiateDeposit(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      console.log('🔍 Deposit request received:', {
        body: req.body,
        user: req.user.id
      });

      const { amount, currency, gateway = 'flutterwave', description } = req.body;
      const user = req.user!;

      console.log('🔍 Parsed values:', {
        amount,
        currency,
        gateway,
        description,
        amountType: typeof amount,
        currencyType: typeof currency,
        gatewayType: typeof gateway
      });

      // Validation
      if (!amount || typeof amount !== 'number' || amount <= 0) {
        console.log('❌ Amount validation failed:', { amount, type: typeof amount });
        res.status(400).json({
          success: false,
          message: 'Invalid amount',
          error: 'INVALID_AMOUNT'
        });
        return;
      }

      if (!currency || !['NGN', 'USD', 'LMC'].includes(currency)) {
        console.log('❌ Currency validation failed:', { currency, type: typeof currency });
        res.status(400).json({
          success: false,
          message: 'Invalid currency',
          error: 'INVALID_CURRENCY'
        });
        return;
      }

      if (gateway !== 'flutterwave') {
        console.log('❌ Gateway validation failed:', { gateway, type: typeof gateway });
        res.status(400).json({
          success: false,
          message: 'Invalid payment gateway. Only Flutterwave is supported.',
          error: 'INVALID_GATEWAY'
        });
        return;
      }

      console.log('✅ All validations passed, calling payment service...');

      const request = {
        userId: user.id,
        amount,
        currency: currency as Currency,
        email: user.email,
        description
      };

      const result = await paymentService.initiateFlutterwaveDeposit(request);

      console.log('🔍 Payment service result:', result);

      if (!result.success) {
        console.log('❌ Payment service failed:', result);
        res.status(400).json({
          success: false,
          message: result.message,
          error: result.error
        });
        return;
      }

      console.log('✅ Payment initiated successfully');
      res.json({
        success: true,
        message: result.message,
        data: result.data
      });
    } catch (error: any) {
      console.error('💥 Initiate deposit error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to initiate deposit',
        error: error.message
      });
    }
  },

  // POST /api/payments/withdraw/initiate - Initiate withdrawal
  async initiateWithdrawal(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const { amount, currency, accountNumber, bankCode, accountName, description } = req.body;
      const user = req.user!;

      // Validation
      if (!amount || typeof amount !== 'number' || amount <= 0) {
        res.status(400).json({
          success: false,
          message: 'Invalid amount',
          error: 'INVALID_AMOUNT'
        });
        return;
      }

      if (!currency || !['LMC'].includes(currency)) {
        res.status(400).json({
          success: false,
          message: 'Only LMC withdrawals are supported',
          error: 'INVALID_CURRENCY'
        });
        return;
      }

      if (!accountNumber || !bankCode || !accountName) {
        res.status(400).json({
          success: false,
          message: 'Account details are required',
          error: 'MISSING_ACCOUNT_DETAILS'
        });
        return;
      }

      const request = {
        userId: user.id,
        amount,
        currency: currency as Currency,
        accountNumber,
        bankCode,
        accountName,
        description
      };

      const result = await paymentService.initiatePaystackWithdrawal(request);

      if (!result.success) {
        res.status(400).json({
          success: false,
          message: result.message,
          error: result.error
        });
        return;
      }

      res.json({
        success: true,
        message: result.message,
        data: result.data
      });
    } catch (error: any) {
      console.error('Initiate withdrawal error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to initiate withdrawal',
        error: error.message
      });
    }
  },

  // POST /api/payments/paystack/callback - Paystack payment callback
  async paystackCallback(req: Request, res: Response): Promise<void> {
    try {
      const { reference } = req.query;

      if (!reference || typeof reference !== 'string') {
        res.status(400).json({
          success: false,
          message: 'Invalid reference',
          error: 'INVALID_REFERENCE'
        });
        return;
      }

      const verification = await paymentService.verifyPaystackPayment(reference);

      if (!verification.success) {
        res.status(400).json({
          success: false,
          message: verification.message,
          error: verification.error
        });
        return;
      }

      // Process the successful payment
      const processed = await paymentService.processSuccessfulPayment(reference, verification.data);

      if (processed) {
        res.json({
          success: true,
          message: 'Payment processed successfully',
          data: verification.data
        });
      } else {
        res.status(500).json({
          success: false,
          message: 'Failed to process payment',
          error: 'PROCESSING_FAILED'
        });
      }
    } catch (error: any) {
      console.error('Paystack callback error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to process callback',
        error: error.message
      });
    }
  },

  // POST /api/payments/flutterwave/callback - Flutterwave payment callback
  async flutterwaveCallback(req: Request, res: Response): Promise<void> {
    try {
      const { transaction_id, status, tx_ref } = req.query;

      // Handle cancellation - when user cancels, Flutterwave doesn't send transaction_id
      if (!transaction_id || typeof transaction_id !== 'string') {
        console.log('Payment cancelled or invalid transaction_id:', { transaction_id, status, tx_ref });
        
        // Check if it was a verification payment by looking at tx_ref
        const isVerificationPayment = tx_ref && typeof tx_ref === 'string' && tx_ref.includes('VER-');
        
        const redirectUrl = isVerificationPayment
          ? `${config.FRONTEND_URL}/verification-badge?payment=cancelled&message=Payment was cancelled`
          : `${config.FRONTEND_URL}/profile?payment=cancelled&message=Payment was cancelled`;
        
        res.redirect(redirectUrl);
        return;
      }

      const verification = await paymentService.verifyFlutterwavePayment(transaction_id);

      if (!verification.success) {
        // Check if it's a verification payment for proper redirect
        const { default: prisma } = await import('../config/database');
        const transaction = await prisma.transaction.findFirst({
          where: { 
            OR: [
              { reference: verification.data?.reference },
              { reference: tx_ref as string }
            ]
          },
        });

        const metadata = transaction?.metadata as any;
        const isVerificationPayment = metadata?.type === 'verification_badge';

        const redirectUrl = isVerificationPayment
          ? `${config.FRONTEND_URL}/verification-badge?payment=error&message=${encodeURIComponent(verification.message)}`
          : `${config.FRONTEND_URL}/profile?payment=error&message=${encodeURIComponent(verification.message)}`;
        
        res.redirect(redirectUrl);
        return;
      }

      // Process the successful payment
      const processed = await paymentService.processSuccessfulPayment(verification.data!.reference, verification.data);

      if (processed) {
        // Check if this is a verification badge payment
        const { default: prisma } = await import('../config/database');
        const transaction = await prisma.transaction.findUnique({
          where: { reference: verification.data!.reference },
        });

        const metadata = transaction?.metadata as any;
        const isVerificationPayment = metadata?.type === 'verification_badge';

        if (isVerificationPayment) {
          try {
            // Process verification badge activation
            const { verificationService } = await import('../services/verification.service');
            await verificationService.processVerificationPayment(verification.data!.reference);

            console.log('✅ Verification badge activated for transaction:', verification.data!.reference);

            // Redirect to verification badge page with success
            const redirectUrl = `${config.FRONTEND_URL}/verification-badge?payment=success&message=Verification badge activated successfully!`;
            res.redirect(redirectUrl);
          } catch (activationError: any) {
            console.error('❌ Badge activation error:', activationError);
            const redirectUrl = `${config.FRONTEND_URL}/verification-badge?payment=error&message=${encodeURIComponent('Payment successful but badge activation failed. Contact support.')}`;
            res.redirect(redirectUrl);
          }
        } else {
          // Regular wallet deposit - redirect to profile instead of wallet
          const redirectUrl = `${config.FRONTEND_URL}/profile?payment=success&amount=${verification.data!.amount}&currency=${verification.data!.currency}`;
          res.redirect(redirectUrl);
        }
      } else {
        // Redirect with error status
        const redirectUrl = `${config.FRONTEND_URL}/profile?payment=error&message=Failed to process payment`;
        res.redirect(redirectUrl);
      }
    } catch (error: any) {
      console.error('Flutterwave callback error:', error);
      const redirectUrl = `${config.FRONTEND_URL}/profile?payment=error&message=${encodeURIComponent('Failed to process callback')}`;
      res.redirect(redirectUrl);
    }
  },

  // POST /api/payments/verify - Manual payment verification
  async verifyPayment(req: Request, res: Response): Promise<void> {
    try {
      const { reference, gateway = 'paystack' } = req.body;

      if (!reference || typeof reference !== 'string') {
        res.status(400).json({
          success: false,
          message: 'Reference is required',
          error: 'MISSING_REFERENCE'
        });
        return;
      }

      let verification;
      if (gateway === 'paystack') {
        verification = await paymentService.verifyPaystackPayment(reference);
      } else if (gateway === 'flutterwave') {
        verification = await paymentService.verifyFlutterwavePayment(reference);
      } else {
        res.status(400).json({
          success: false,
          message: 'Invalid gateway',
          error: 'INVALID_GATEWAY'
        });
        return;
      }

      if (!verification.success) {
        res.status(400).json({
          success: false,
          message: verification.message,
          error: verification.error
        });
        return;
      }

      // Process the successful payment
      const processed = await paymentService.processSuccessfulPayment(reference, verification.data);

      res.json({
        success: true,
        message: verification.message,
        data: {
          ...verification.data,
          processed
        }
      });
    } catch (error: any) {
      console.error('Verify payment error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to verify payment',
        error: error.message
      });
    }
  },

  // GET /api/payments/banks - Get available banks
  async getBanks(req: Request, res: Response): Promise<void> {
    try {
      const result = await paymentService.getFlutterwaveBanks();

      if (!result.success) {
        res.status(400).json({
          success: false,
          message: 'Failed to fetch banks',
          error: result.error
        });
        return;
      }

      res.json({
        success: true,
        data: result.data
      });
    } catch (error: any) {
      console.error('Get banks error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to fetch banks',
        error: error.message
      });
    }
  },

  // POST /api/payments/verify-account - Verify bank account
  async verifyBankAccount(req: Request, res: Response): Promise<void> {
    try {
      const { accountNumber, bankCode } = req.body;

      if (!accountNumber || !bankCode) {
        res.status(400).json({
          success: false,
          message: 'Account number and bank code are required',
          error: 'MISSING_ACCOUNT_DETAILS'
        });
        return;
      }

      const result = await paymentService.verifyBankAccount(accountNumber, bankCode);

      if (!result.success) {
        res.status(400).json({
          success: false,
          message: 'Account verification failed',
          error: result.error
        });
        return;
      }

      res.json({
        success: true,
        message: 'Account verified successfully',
        data: result.data
      });
    } catch (error: any) {
      console.error('Verify account error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to verify account',
        error: error.message
      });
    }
  }
};

export default paymentController;