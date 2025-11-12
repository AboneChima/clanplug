import { Router, Request, Response } from 'express';
import { authenticate, AuthenticatedRequest } from '../middleware/auth.middleware';
import { validateRequest } from '../middleware/validation';
import { asyncHandler } from '../middleware/errorHandler';
import { body, query, param } from 'express-validator';
import { nowPaymentsService } from '../services/nowpayments.service';
import { walletService } from '../services/wallet.service';
import { prisma } from '../config/database';

const router = Router();

// Validation middleware
const cryptoDepositValidation = [
  body('amount')
    .isNumeric()
    .custom((value) => {
      if (value <= 0) {
        throw new Error('Amount must be greater than 0');
      }
      return true;
    })
    .withMessage('Valid amount is required'),
  body('currency')
    .isIn(['NGN', 'USDT'])
    .withMessage('Currency must be NGN or USDT'),
  body('payCurrency')
    .isString()
    .trim()
    .isLength({ min: 2, max: 10 })
    .withMessage('Pay currency is required (e.g., BTC, ETH, USDT)'),
  body('description')
    .optional()
    .isString()
    .trim()
    .isLength({ max: 255 })
    .withMessage('Description must be a string with max 255 characters')
];

const paymentStatusValidation = [
  param('paymentId')
    .isString()
    .trim()
    .isLength({ min: 1 })
    .withMessage('Payment ID is required')
];

// Get available cryptocurrencies
router.get(
  '/currencies',
  asyncHandler(async (req: Request, res: Response) => {
    try {
      const currencies = await nowPaymentsService.getAvailableCurrencies();
      
      // Transform currency data to match frontend expectations
      const transformedCurrencies = currencies.map(currency => ({
        ...currency,
        currency: currency.code // Add 'currency' field for frontend compatibility
      }));
      
      res.json({
        success: true,
        data: transformedCurrencies
      });
    } catch (error) {
      console.error('Error fetching crypto currencies:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to fetch available cryptocurrencies'
      });
    }
  })
);

// Get minimum payment amount for a currency
router.get(
  '/minimum-amount/:currency',
  [
    param('currency')
      .isString()
      .trim()
      .isLength({ min: 2, max: 10 })
      .withMessage('Currency is required')
  ],
  validateRequest,
  asyncHandler(async (req: Request, res: Response) => {
    try {
      const { currency } = req.params;
      const minAmount = await nowPaymentsService.getMinimumAmount(currency.toUpperCase());
      
      res.json({
        success: true,
        data: {
          currency: currency.toUpperCase(),
          minAmount
        }
      });
    } catch (error) {
      console.error('Error fetching minimum amount:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to fetch minimum payment amount'
      });
    }
  })
);

// Get payment estimate
router.post(
  '/estimate',
  authenticate,
  [
    body('amount')
      .isNumeric()
      .custom((value) => {
        if (value <= 0) {
          throw new Error('Amount must be greater than 0');
        }
        return true;
      })
      .withMessage('Valid amount is required'),
    body('currency_from')
      .isString()
      .trim()
      .withMessage('Source currency is required'),
    body('currency_to')
      .isString()
      .trim()
      .withMessage('Target currency is required')
  ],
  validateRequest,
  asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    try {
      const { amount, currency_from, currency_to } = req.body;
      
      const estimate = await nowPaymentsService.getEstimate(
        parseFloat(amount),
        currency_from.toUpperCase(),
        currency_to.toUpperCase()
      );
      
      res.json({
        success: true,
        data: estimate
      });
    } catch (error) {
      console.error('Error getting payment estimate:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to get payment estimate'
      });
    }
  })
);

// Initiate crypto deposit
router.post(
  '/deposit/initiate',
  authenticate,
  cryptoDepositValidation,
  validateRequest,
  asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    try {
      const { amount, currency, payCurrency, description } = req.body;
      const userId = req.user!.id;
      
      // Create payment with NowPayments
      const payment = await nowPaymentsService.createPayment({
        price_amount: parseFloat(amount),
        price_currency: currency,
        pay_currency: payCurrency.toUpperCase(),
        order_id: `deposit_${userId}_${Date.now()}`,
        order_description: description || `Wallet deposit - ${amount} ${currency}`,
        ipn_callback_url: `${process.env.APP_URL}/api/webhooks/nowpayments`,
        success_url: `${process.env.FRONTEND_URL}/wallet?payment=success`,
        cancel_url: `${process.env.FRONTEND_URL}/wallet?payment=cancelled`
      });
      
      // Find or create wallet for the user
      let wallet = await prisma.wallet.findFirst({
        where: {
          userId,
          currency: currency as any
        }
      });

      if (!wallet) {
        wallet = await prisma.wallet.create({
          data: {
            userId,
            currency: currency as any,
            balance: 0
          }
        });
      }

      // Create pending transaction record
      await prisma.transaction.create({
        data: {
          userId,
          walletId: wallet.id,
          amount: parseFloat(amount),
          fee: 0,
          netAmount: parseFloat(amount),
          currency: currency as any,
          type: 'DEPOSIT' as any,
          status: 'PENDING' as any,
          reference: payment.payment_id,
          description: `Crypto deposit - ${currency.toUpperCase()}`,
          metadata: {
            gateway: 'nowpayments',
            payCurrency: payCurrency.toUpperCase(),
            payAmount: payment.pay_amount,
            payAddress: payment.pay_address,
            paymentId: payment.payment_id
          }
        }
      });
      
      res.json({
        success: true,
        data: {
          paymentId: payment.payment_id,
          payAddress: payment.pay_address,
          payAmount: payment.pay_amount,
          payCurrency: payment.pay_currency,
          priceAmount: payment.price_amount,
          priceCurrency: payment.price_currency,
          paymentUrl: payment.payment_url,
          expiresAt: payment.created_at ? new Date(Date.parse(payment.created_at) + (30 * 60 * 1000)) : null // 30 minutes from creation
        }
      });
    } catch (error) {
      console.error('Error initiating crypto deposit:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to initiate crypto deposit'
      });
    }
  })
);

// Get payment status
router.get(
  '/payment/:paymentId/status',
  authenticate,
  paymentStatusValidation,
  validateRequest,
  asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    try {
      const { paymentId } = req.params;
      
      const status = await nowPaymentsService.getPaymentStatus(paymentId);
      
      res.json({
        success: true,
        data: status
      });
    } catch (error) {
      console.error('Error fetching payment status:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to fetch payment status'
      });
    }
  })
);

// Manual payment verification (for testing)
router.post(
  '/verify/:paymentId',
  authenticate,
  paymentStatusValidation,
  validateRequest,
  asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    try {
      const { paymentId } = req.params;
      const userId = req.user!.id;
      
      // Get payment status from NowPayments
      const paymentStatus = await nowPaymentsService.getPaymentStatus(paymentId);
      
      if (paymentStatus.payment_status === 'finished') {
        // Update transaction and wallet balance
        await walletService.verifyAndUpdateDeposit(paymentId, {
          status: 'COMPLETED',
          actualAmount: paymentStatus.price_amount,
          gatewayResponse: paymentStatus
        });
        
        res.json({
          success: true,
          message: 'Payment verified and wallet updated successfully',
          data: paymentStatus
        });
      } else {
        res.json({
          success: false,
          message: `Payment not completed. Status: ${paymentStatus.payment_status}`,
          data: paymentStatus
        });
      }
    } catch (error) {
      console.error('Error verifying crypto payment:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to verify crypto payment'
      });
    }
  })
);

// Test route
router.get('/test', (req, res) => {
  res.json({ success: true, message: 'Crypto payment routes are working!' });
});

export default router;