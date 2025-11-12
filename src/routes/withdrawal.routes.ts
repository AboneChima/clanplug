import { Router, Request, Response } from 'express';
import { body, validationResult } from 'express-validator';
import { authenticate } from '../middleware/auth.middleware';
import { withdrawalService } from '../services/withdrawal.service';

const router = Router();

/**
 * Verify bank account details
 * POST /api/withdrawal/verify-account
 */
router.post('/verify-account', [
  body('accountNumber')
    .isLength({ min: 8, max: 15 })
    .withMessage('Account number must be between 8 and 15 digits')
    .isNumeric()
    .withMessage('Account number must contain only numbers'),
  body('bankCode')
    .notEmpty()
    .withMessage('Bank code is required'),
], async (req: Request, res: Response) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: errors.array()
      });
    }

    const { accountNumber, bankCode } = req.body;

    // Verify account with Flutterwave
    const accountDetails = await withdrawalService.verifyBankAccount(accountNumber, bankCode);
    
    if (!accountDetails) {
      return res.status(400).json({
        success: false,
        message: 'Unable to verify account details. Please check account number and bank code.'
      });
    }

    return res.json({
      success: true,
      message: 'Account verified successfully',
      data: {
        accountName: accountDetails.account_name,
        accountNumber: accountDetails.account_number,
        bankName: accountDetails.bank_name,
        bankCode: accountDetails.bank_code
      }
    });

  } catch (error: any) {
    console.error('Account verification error:', error);
    return res.status(500).json({
      success: false,
      message: error.message || 'Failed to verify account'
    });
  }
});

/**
 * Process withdrawal request with enhanced validation
 * POST /api/withdrawal/request
 */
router.post('/request', authenticate, [
  body('amount')
    .isFloat({ min: 100, max: 1000000 })
    .withMessage('Withdrawal amount must be between ₦100 and ₦1,000,000'),
  body('bankCode')
    .notEmpty()
    .withMessage('Bank code is required')
    .isLength({ min: 3, max: 6 })
    .withMessage('Invalid bank code format'),
  body('accountNumber')
    .isLength({ min: 8, max: 15 })
    .withMessage('Account number must be between 8 and 15 digits')
    .isNumeric()
    .withMessage('Account number must contain only numbers'),
  body('accountName')
    .notEmpty()
    .withMessage('Account name is required')
    .isLength({ min: 2, max: 100 })
    .withMessage('Account name must be between 2 and 100 characters'),
  body('bankName')
    .optional()
    .isLength({ max: 50 })
    .withMessage('Bank name must not exceed 50 characters'),
  body('narration')
    .optional()
    .isLength({ max: 100 })
    .withMessage('Narration must not exceed 100 characters'),
], async (req: Request, res: Response) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: errors.array()
      });
    }

    const { amount, bankCode, accountNumber, accountName, narration } = req.body;
    const userId = (req as any).user.id;

    // Process withdrawal with enhanced response
    const result = await withdrawalService.processWithdrawal({
      userId,
      amount: parseFloat(amount),
      bankCode,
      bankName: accountName.split(' - ')[1] || 'Bank', // Extract bank name from account name
      accountNumber,
      accountName,
      narration
    });

    return res.json({
      success: true,
      message: result.message,
      data: {
        reference: result.reference,
        status: result.status,
        estimatedTime: result.estimatedTime,
        amount: parseFloat(amount),
        accountName,
        submittedAt: new Date().toISOString()
      }
    });

  } catch (error: any) {
    console.error('Withdrawal processing error:', error);
    return res.status(400).json({
      success: false,
      message: error.message || 'Failed to process withdrawal'
    });
  }
});

/**
 * Get user withdrawal limits
 * GET /api/withdrawal/limits
 */
router.get('/limits', authenticate, async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user.id;

    const limits = await withdrawalService.getWithdrawalLimits(userId);

    return res.json({
      success: true,
      data: {
        daily: {
          limit: limits.dailyLimit,
          used: limits.dailyLimit - limits.remainingDaily,
          remaining: limits.remainingDaily
        },
        monthly: {
          limit: limits.monthlyLimit,
          used: limits.monthlyLimit - limits.remainingMonthly,
          remaining: limits.remainingMonthly
        },
        minimum: limits.minAmount,
        maximum: limits.maxAmount,
        fee: {
          percentage: 1.5,
          minimum: 50
        }
      }
    });

  } catch (error: any) {
    console.error('Error fetching withdrawal limits:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to fetch withdrawal limits'
    });
  }
});

router.get('/history', authenticate, async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user.id;
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 10;

    const result = await withdrawalService.getUserWithdrawals(userId, page, limit);

    return res.json({
      success: true,
      data: result
    });

  } catch (error: any) {
    console.error('Error fetching withdrawal history:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to fetch withdrawal history'
    });
  }
});

/**
 * Get withdrawal by reference
 * GET /api/withdrawal/:reference
 */
router.get('/:reference', authenticate, async (req: Request, res: Response) => {
  try {
    const { reference } = req.params;
    const userId = (req as any).user.id;

    const withdrawal = await withdrawalService.getWithdrawalByReference(reference);

    if (!withdrawal) {
      return res.status(404).json({
        success: false,
        message: 'Withdrawal not found'
      });
    }

    // Ensure user can only access their own withdrawals
    if (withdrawal.userId !== userId) {
      return res.status(403).json({
        success: false,
        message: 'Access denied'
      });
    }

    return res.json({
      success: true,
      data: withdrawal
    });

  } catch (error: any) {
    console.error('Error fetching withdrawal:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to fetch withdrawal details'
    });
  }
});

/**
 * Flutterwave webhook endpoint
 * POST /api/withdrawal/webhook
 */
router.post('/webhook', async (req: Request, res: Response) => {
  try {
    const signature = req.headers['verif-hash'] as string;
    
    if (!signature) {
      return res.status(400).json({
        success: false,
        message: 'Missing webhook signature'
      });
    }

    await withdrawalService.handleWebhook(req.body, signature);

    return res.json({
      success: true,
      message: 'Webhook processed successfully'
    });

  } catch (error: any) {
    console.error('Webhook processing error:', error);
    return res.status(400).json({
      success: false,
      message: error.message || 'Failed to process webhook'
    });
  }
});

export default router;