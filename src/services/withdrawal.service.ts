import axios from 'axios';
import crypto from 'crypto';
import { PrismaClient } from '@prisma/client';
import config from '../config/config';
import { notificationService } from './notification.service';

const prisma = new PrismaClient();

export interface BankAccount {
  account_number: string;
  account_name: string;
  bank_code: string;
  bank_name: string;
}

export interface WithdrawalRequest {
  userId: string;
  amount: number; // Amount in NGN
  bankCode: string;
  bankName: string;
  accountNumber: string;
  accountName: string;
  narration?: string;
}

export interface FlutterwaveAccountResponse {
  status: string;
  message: string;
  data: {
    account_number: string;
    account_name: string;
    bank_id: number;
  };
}

export interface FlutterwaveTransferResponse {
  status: string;
  message: string;
  data: {
    id: number;
    account_number: string;
    bank_code: string;
    full_name: string;
    created_at: string;
    currency: string;
    debit_currency: string;
    amount: number;
    fee: number;
    status: string;
    reference: string;
    meta: any;
    narration: string;
    complete_message: string;
    requires_approval: number;
    is_approved: number;
    bank_name: string;
  };
}

export interface WithdrawalLimits {
  minAmount: number;
  maxAmount: number;
  dailyLimit: number;
  monthlyLimit: number;
  remainingDaily: number;
  remainingMonthly: number;
}

export interface WithdrawalValidationResult {
  isValid: boolean;
  errors: string[];
  warnings: string[];
}

export class WithdrawalService {
  private readonly baseURL = config.FLUTTERWAVE_BASE_URL;
  private readonly secretKey = config.FLUTTERWAVE_SECRET_KEY;
  private readonly webhookSecret = config.FLUTTERWAVE_WEBHOOK_SECRET;

  /**
   * Get withdrawal limits for a user
   */
  async getWithdrawalLimits(userId: string): Promise<WithdrawalLimits> {
    const now = new Date();
    const startOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

    // Get user's withdrawal transactions for today and this month
    const [dailyWithdrawals, monthlyWithdrawals] = await Promise.all([
      prisma.transaction.aggregate({
        where: {
          userId,
          type: 'WITHDRAWAL',
          status: { in: ['COMPLETED', 'PROCESSING'] }, // Include PROCESSING status for automatic withdrawals
          createdAt: { gte: startOfDay },
        },
        _sum: { amount: true },
      }),
      prisma.transaction.aggregate({
        where: {
          userId,
          type: 'WITHDRAWAL',
          status: { in: ['COMPLETED', 'PROCESSING'] }, // Include PROCESSING status for automatic withdrawals
          createdAt: { gte: startOfMonth },
        },
        _sum: { amount: true },
      }),
    ]);

    const dailyWithdrawn = dailyWithdrawals._sum.amount?.toNumber() || 0;
    const monthlyWithdrawn = monthlyWithdrawals._sum.amount?.toNumber() || 0;

    return {
      minAmount: config.MIN_WITHDRAWAL_AMOUNT || 100,
      maxAmount: config.MAX_WITHDRAWAL_AMOUNT || 1000000,
      dailyLimit: config.DAILY_WITHDRAWAL_LIMIT || 500000,
      monthlyLimit: config.MONTHLY_WITHDRAWAL_LIMIT || 5000000,
      remainingDaily: Math.max(0, (config.DAILY_WITHDRAWAL_LIMIT || 500000) - dailyWithdrawn),
      remainingMonthly: Math.max(0, (config.MONTHLY_WITHDRAWAL_LIMIT || 5000000) - monthlyWithdrawn),
    };
  }

  /**
   * Validate withdrawal request
   */
  async validateWithdrawal(userId: string, amount: number): Promise<WithdrawalValidationResult> {
    const errors: string[] = [];
    const warnings: string[] = [];

    // Get user's NGN wallet
    const wallet = await prisma.wallet.findFirst({
      where: { userId, currency: 'NGN' },
    });

    if (!wallet) {
      errors.push('NGN wallet not found. Please contact support.');
      return { isValid: false, errors, warnings };
    }

    // Calculate 0.5% fee - fee is deducted from the withdrawal amount
    const feePercentage = 0.005; // 0.5% fee
    const fee = amount * feePercentage;
    const totalAmountNeeded = amount; // Only need the withdrawal amount in wallet

    // Check balance (must cover withdrawal amount)
    if (wallet.balance.toNumber() < totalAmountNeeded) {
      errors.push(`Insufficient balance. Available: ₦${wallet.balance.toNumber()}, Required: ₦${totalAmountNeeded}`);
    }

    // Get withdrawal limits
    const limits = await this.getWithdrawalLimits(userId);

    // Check minimum amount
    if (amount < limits.minAmount) {
      errors.push(`Minimum withdrawal amount is ₦${limits.minAmount}`);
    }

    // Check maximum amount
    if (amount > limits.maxAmount) {
      errors.push(`Maximum withdrawal amount is ₦${limits.maxAmount}`);
    }

    // Check daily limit
    if (amount > limits.remainingDaily) {
      errors.push(`Daily withdrawal limit exceeded. Remaining: ₦${limits.remainingDaily}`);
    }

    // Check monthly limit
    if (amount > limits.remainingMonthly) {
      errors.push(`Monthly withdrawal limit exceeded. Remaining: ₦${limits.remainingMonthly}`);
    }

    // Add warnings for large amounts
    if (amount > 100000) {
      warnings.push('Large withdrawal amounts may take longer to process');
    }

    return {
      isValid: errors.length === 0,
      errors,
      warnings,
    };
  }

  /**
   * Verify bank account details using Flutterwave Account Resolve API
   */
  async verifyBankAccount(accountNumber: string, bankCode: string): Promise<BankAccount | null> {
    try {
      const response = await axios.post<FlutterwaveAccountResponse>(
        `${this.baseURL}/accounts/resolve`,
        {
          account_number: accountNumber,
          account_bank: bankCode,
        },
        {
          headers: {
            Authorization: `Bearer ${this.secretKey}`,
            'Content-Type': 'application/json',
          },
          timeout: 10000, // 10 second timeout
        }
      );

      if (response.data.status === 'success' && response.data.data) {
        return {
          account_number: response.data.data.account_number,
          account_name: response.data.data.account_name,
          bank_code: bankCode,
          bank_name: '', // Will be populated from bank service
        };
      }

      return null;
    } catch (error: any) {
      console.error('Bank account verification failed:', error.response?.data || error.message);
      
      if (error.code === 'ECONNABORTED') {
        throw new Error('Bank verification timed out. Please try again.');
      }
      
      if (error.response?.status === 400) {
        throw new Error('Invalid account number or bank code.');
      }
      
      if (error.response?.status === 429) {
        throw new Error('Too many verification requests. Please wait a moment and try again.');
      }
      
      throw new Error('Failed to verify bank account. Please check account details and try again.');
    }
  }

  /**
   * Process withdrawal request with enhanced validation and instant transfer support
   */
  async processWithdrawal(withdrawalRequest: WithdrawalRequest): Promise<{
    reference: string;
    status: string;
    message: string;
    estimatedTime?: string;
  }> {
    const { userId, amount, bankCode, bankName, accountNumber, accountName, narration } = withdrawalRequest;

    // Validate withdrawal request
    const validation = await this.validateWithdrawal(userId, amount);
    if (!validation.isValid) {
      throw new Error(validation.errors.join(', '));
    }

    // Calculate 0.5% fee and amounts
    const feePercentage = 0.005; // 0.5% fee
    const fee = amount * feePercentage;
    const totalDeduction = amount; // Total to deduct from wallet (only the requested amount)
    const netAmount = amount - fee; // Amount to send to bank (after fee deduction)

    // Amount is already in NGN, no conversion needed
    const nairaAmount = netAmount;

    // Generate unique reference
    const reference = `WD_${Date.now()}_${userId.slice(-6)}`;

    try {
      // Start database transaction
      const result = await prisma.$transaction(async (tx) => {
        // Get and lock user's NGN wallet
        const wallet = await tx.wallet.findFirst({
          where: {
            userId,
            currency: 'NGN',
          },
        });

        if (!wallet || wallet.balance.toNumber() < totalDeduction) {
          throw new Error('Insufficient NGN wallet balance');
        }

        // Deduct requested amount from wallet
        await tx.wallet.update({
          where: { id: wallet.id },
          data: {
            balance: { decrement: totalDeduction },
            totalWithdrawals: { increment: amount },
          },
        });

        // Create withdrawal transaction record
        const transaction = await tx.transaction.create({
          data: {
            userId,
            walletId: wallet.id,
            type: 'WITHDRAWAL',
            status: 'PROCESSING', // Changed from 'PENDING' to 'PROCESSING' for automatic processing
            amount: amount, // Amount user requested to withdraw
            fee: fee, // 0.5% fee
            netAmount: netAmount, // Amount sent to bank (after fee deduction)
            currency: 'NGN',
            reference,
            description: `Withdrawal to ${accountName} - ${bankName}`,
            metadata: {
              bankCode,
              bankName,
              accountNumber,
              accountName,
              nairaAmount,
              feePercentage: feePercentage,
              feeType: 'PERCENTAGE',
              totalDeducted: totalDeduction,
              requestedAt: new Date().toISOString(),
              autoProcessed: true, // Flag to indicate this was automatically processed
            },
          },
        });

        return { transaction, wallet };
      });

      // Send notification to user
      await notificationService.createNotification({
        userId,
        type: 'TRANSACTION',
        title: 'Withdrawal Processing',
        message: `Your withdrawal request of ₦${amount} to ${bankName} is being processed automatically. You will receive the funds shortly.`,
        data: { reference, amount, bankName },
      });

      // Initiate Flutterwave transfer
      const transferResult = await this.initiateFlutterwaveTransfer({
        accountNumber,
        bankCode,
        bankName,
        amount: nairaAmount, // Send the full requested amount in NGN
        reference,
        narration: narration || `Lordmoon Wallet Withdrawal - ${accountName}`,
      });

      return {
        reference,
        status: transferResult.status,
        message: transferResult.message,
        estimatedTime: transferResult.estimatedTime,
      };
    } catch (error: any) {
      console.error('Withdrawal processing failed:', error);
      
      // If the error occurred after wallet deduction, we need to refund
      const existingTransaction = await prisma.transaction.findUnique({
        where: { reference },
      });
      
      if (existingTransaction) {
        await this.handleFailedWithdrawal(reference, error.message);
      }
      
      throw new Error(error.message || 'Failed to process withdrawal');
    }
  }

  /**
   * Initiate bank transfer via Flutterwave with instant transfer support
   */
  private async initiateFlutterwaveTransfer(transferData: {
    accountNumber: string;
    bankCode: string;
    bankName: string;
    amount: number;
    reference: string;
    narration: string;
  }): Promise<{
    status: string;
    message: string;
    estimatedTime?: string;
  }> {
    try {
      const payload = {
        account_bank: transferData.bankCode,
        account_number: transferData.accountNumber,
        amount: transferData.amount,
        narration: transferData.narration,
        currency: 'NGN',
        reference: transferData.reference,
        callback_url: config.WITHDRAWAL_WEBHOOK_URL,
        debit_currency: 'NGN',
        // Enable instant transfer for supported banks
        meta: [
          {
            name: 'sender_name',
            value: 'Lordmoon Platform',
          },
          {
            name: 'recipient_name',
            value: transferData.accountNumber,
          },
          {
            name: 'bank_name',
            value: transferData.bankName,
          },
        ],
      };

      console.log('Initiating Flutterwave transfer:', {
        reference: transferData.reference,
        amount: transferData.amount,
        bank: transferData.bankName,
        account: transferData.accountNumber,
      });

      const response = await axios.post<FlutterwaveTransferResponse>(
        `${this.baseURL}/transfers`,
        payload,
        {
          headers: {
            Authorization: `Bearer ${this.secretKey}`,
            'Content-Type': 'application/json',
          },
          timeout: 30000, // 30 second timeout for transfers
        }
      );

      if (response.data.status !== 'success') {
        throw new Error(response.data.message || 'Transfer initiation failed');
      }

      const transferData_response = response.data.data;
      
      // Update transaction with Flutterwave response
      await prisma.transaction.update({
        where: { reference: transferData.reference },
        data: {
          status: transferData_response.status === 'SUCCESSFUL' ? 'COMPLETED' : 'PROCESSING',
          gatewayResponse: JSON.parse(JSON.stringify(response.data)),
          processedAt: new Date(),
          metadata: {
            ...transferData,
            flutterwaveId: transferData_response.id,
            flutterwaveStatus: transferData_response.status,
            requiresApproval: transferData_response.requires_approval,
            isApproved: transferData_response.is_approved,
          },
        },
      });

      // Determine status and estimated time
      let status = 'processing';
      let message = 'Transfer initiated successfully';
      let estimatedTime = '5-10 minutes';

      if (transferData_response.status === 'SUCCESSFUL') {
        status = 'completed';
        message = 'Transfer completed successfully';
        estimatedTime = 'Instant';
        
        // Send success notification
        const transaction = await prisma.transaction.findUnique({
          where: { reference: transferData.reference },
          include: { user: true },
        });
        
        if (transaction) {
          await notificationService.createNotification({
            userId: transaction.userId,
            type: 'TRANSACTION',
            title: 'Withdrawal Completed',
            message: `Your withdrawal of ₦${transaction.amount} to ${transferData.bankName} has been completed successfully.`,
            data: { reference: transferData.reference, amount: transaction.amount, bankName: transferData.bankName },
          });
        }
      } else if (transferData_response.requires_approval === 1) {
        message = 'Transfer requires approval and will be processed shortly';
        estimatedTime = '10-30 minutes';
      }

      console.log('Flutterwave transfer initiated successfully:', {
        reference: transferData.reference,
        flutterwaveId: transferData_response.id,
        status: transferData_response.status,
        requiresApproval: transferData_response.requires_approval,
      });

      return { status, message, estimatedTime };
    } catch (error: any) {
      console.error('Flutterwave transfer failed:', error.response?.data || error.message);
      
      let errorMessage = 'Transfer initiation failed';
      
      if (error.code === 'ECONNABORTED') {
        errorMessage = 'Transfer request timed out. Please try again.';
      } else if (error.response?.status === 400) {
        errorMessage = error.response.data?.message || 'Invalid transfer details';
      } else if (error.response?.status === 401) {
        errorMessage = 'Payment gateway authentication failed';
      } else if (error.response?.status === 429) {
        errorMessage = 'Too many transfer requests. Please wait a moment and try again.';
      } else if (error.response?.status >= 500) {
        errorMessage = 'Payment gateway is temporarily unavailable. Please try again later.';
      }
      
      // Update transaction status to failed and refund user
      await this.handleFailedWithdrawal(transferData.reference, errorMessage);
      throw new Error(`${errorMessage} Amount has been refunded to your wallet.`);
    }
  }

  /**
   * Handle failed withdrawal by refunding the user
   */
  private async handleFailedWithdrawal(reference: string, reason: string): Promise<void> {
    try {
      await prisma.$transaction(async (tx) => {
        const transaction = await tx.transaction.findUnique({
          where: { reference },
          include: { wallet: true },
        });

        if (!transaction) return;

        // Refund the amount to user's wallet
        await tx.wallet.update({
          where: { id: transaction.walletId },
          data: {
            balance: { increment: transaction.amount },
            totalWithdrawals: { decrement: transaction.amount },
          },
        });

        // Update transaction status
        await tx.transaction.update({
          where: { reference },
          data: {
            status: 'FAILED',
            failureReason: reason,
          },
        });
      });
    } catch (error) {
      console.error('Failed to handle withdrawal failure:', error);
    }
  }

  /**
   * Handle Flutterwave webhook for withdrawal status updates with enhanced tracking
   */
  async handleWebhook(payload: any, signature: string): Promise<void> {
    // Verify webhook signature
    if (!this.verifyWebhookSignature(payload, signature)) {
      throw new Error('Invalid webhook signature');
    }

    const { event, data } = payload;

    console.log('Received Flutterwave webhook:', { event, reference: data?.reference });

    switch (event) {
      case 'transfer.completed':
        await this.handleTransferCompleted(data);
        break;
      case 'transfer.failed':
        await this.handleTransferFailed(data);
        break;
      case 'transfer.reversed':
        await this.handleTransferReversed(data);
        break;
      default:
        console.log('Unhandled webhook event:', event);
    }
  }

  /**
   * Verify Flutterwave webhook signature
   */
  private verifyWebhookSignature(payload: any, signature: string): boolean {
    const hash = crypto
      .createHmac('sha256', this.webhookSecret)
      .update(JSON.stringify(payload))
      .digest('hex');

    return hash === signature;
  }

  /**
   * Handle completed transfer webhook with notifications
   */
  private async handleTransferCompleted(data: any): Promise<void> {
    const { reference, status, amount, complete_message, bank_name, account_number } = data;

    try {
      const transaction = await prisma.transaction.findUnique({
        where: { reference },
        include: { user: true },
      });

      if (!transaction) {
        console.error('Transaction not found for reference:', reference);
        return;
      }

      if (status === 'SUCCESSFUL') {
        await prisma.transaction.update({
          where: { reference },
          data: {
            status: 'COMPLETED',
            gatewayResponse: data,
            processedAt: new Date(),
            metadata: {
              ...(transaction.metadata as object || {}),
              completedStatus: status,
              completeMessage: complete_message,
              completedAt: new Date().toISOString(),
            },
          },
        });

        // Send success notification
        await notificationService.createNotification({
          userId: transaction.userId,
          type: 'TRANSACTION',
          title: 'Withdrawal Completed',
          message: `Your withdrawal of ₦${transaction.amount} to ${bank_name || 'your bank account'} has been completed successfully.`,
          data: { 
            reference, 
            amount: transaction.amount, 
            ngnAmount: amount,
            bankName: bank_name,
            accountNumber: account_number,
            status: 'completed'
          },
        });

        console.log('Withdrawal completed successfully:', {
          reference,
          userId: transaction.userId,
          amount: transaction.amount,
          ngnAmount: amount,
        });
      } else {
        // Handle failed transfer
        await this.handleFailedWithdrawal(reference, complete_message || 'Transfer failed');
        console.log('Withdrawal failed:', reference, complete_message);
      }
    } catch (error) {
      console.error('Error handling transfer completion:', error);
    }
  }

  /**
   * Handle failed transfer webhook
   */
  private async handleTransferFailed(data: any): Promise<void> {
    const { reference, complete_message } = data;
    
    console.log('Transfer failed webhook received:', { reference, message: complete_message });
    
    await this.handleFailedWithdrawal(reference, complete_message || 'Transfer failed');
  }

  /**
   * Handle reversed transfer webhook
   */
  private async handleTransferReversed(data: any): Promise<void> {
    const { reference, complete_message } = data;
    
    console.log('Transfer reversed webhook received:', { reference, message: complete_message });
    
    await this.handleFailedWithdrawal(reference, complete_message || 'Transfer was reversed');
  }

  /**
   * Get withdrawal transaction by reference
   */
  async getWithdrawalByReference(reference: string) {
    return await prisma.transaction.findUnique({
      where: { reference },
      include: {
        user: {
          select: {
            id: true,
            email: true,
            firstName: true,
            lastName: true,
          },
        },
      },
    });
  }

  /**
   * Get user's withdrawal history
   */
  async getUserWithdrawals(userId: string, page = 1, limit = 10) {
    const skip = (page - 1) * limit;

    const [withdrawals, total] = await Promise.all([
      prisma.transaction.findMany({
        where: {
          userId,
          type: 'WITHDRAWAL',
        },
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
      }),
      prisma.transaction.count({
        where: {
          userId,
          type: 'WITHDRAWAL',
        },
      }),
    ]);

    return {
      withdrawals,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }
}

export const withdrawalService = new WithdrawalService();