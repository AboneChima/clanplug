import { Request, Response } from 'express';
import { prisma } from '../config/database';
import { flutterwaveService } from '../services/flutterwave.service';
import { notificationService } from '../services/notification.service';
import { v4 as uuidv4 } from 'uuid';

// Instant withdrawal threshold
const INSTANT_WITHDRAWAL_LIMIT = 50000; // ₦50,000

export class WithdrawalController {
  /**
   * Request withdrawal - Instant for small amounts, manual for large
   */
  async requestWithdrawal(req: Request, res: Response) {
    try {
      const userId = req.user!.id;
      const { amount, bankCode, bankName, accountNumber, accountName, narration } = req.body;

      // Validation
      if (!amount || amount <= 0) {
        return res.status(400).json({
          success: false,
          message: 'Invalid amount'
        });
      }

      if (!bankCode || !accountNumber || !accountName) {
        return res.status(400).json({
          success: false,
          message: 'Bank details are required'
        });
      }

      // Calculate fees
      const feePercentage = 0.005; // 0.5%
      const fee = amount * feePercentage;
      const netAmount = amount - fee;
      const totalDeduction = amount;

      // Check if user has sufficient balance
      const wallet = await prisma.wallet.findUnique({
        where: {
          userId_currency: {
            userId,
            currency: 'NGN'
          }
        }
      });

      if (!wallet || wallet.balance.toNumber() < totalDeduction) {
        return res.status(400).json({
          success: false,
          message: 'Insufficient balance'
        });
      }

      const reference = `WD-${Date.now()}-${uuidv4().slice(0, 8)}`;

      // Determine if instant or manual
      const isInstant = amount < INSTANT_WITHDRAWAL_LIMIT;

      if (isInstant) {
        // Try instant withdrawal via Flutterwave
        try {
          // Check if Flutterwave can process
          const canProcess = await flutterwaveService.canProcessInstantTransfer(netAmount);
          
          if (!canProcess.canProcess) {
            console.log('Cannot process instant transfer:', canProcess.reason);
            // Fall back to manual processing
            return await this.processManualWithdrawal(req, res, {
              userId,
              amount,
              fee,
              netAmount,
              totalDeduction,
              bankCode,
              bankName,
              accountNumber,
              accountName,
              narration,
              reference,
              wallet
            });
          }

          // Process instant transfer
          const result = await this.processInstantWithdrawal({
            userId,
            amount,
            fee,
            netAmount,
            totalDeduction,
            bankCode,
            bankName,
            accountNumber,
            accountName,
            narration,
            reference,
            wallet
          });

          return res.json(result);
        } catch (error: any) {
          console.error('Instant withdrawal failed, falling back to manual:', error.message);
          // Fall back to manual processing
          return await this.processManualWithdrawal(req, res, {
            userId,
            amount,
            fee,
            netAmount,
            totalDeduction,
            bankCode,
            bankName,
            accountNumber,
            accountName,
            narration,
            reference,
            wallet
          });
        }
      } else {
        // Manual processing for large amounts
        return await this.processManualWithdrawal(req, res, {
          userId,
          amount,
          fee,
          netAmount,
          totalDeduction,
          bankCode,
          bankName,
          accountNumber,
          accountName,
          narration,
          reference,
          wallet
        });
      }
    } catch (error: any) {
      console.error('Withdrawal request error:', error);
      return res.status(500).json({
        success: false,
        message: 'Failed to process withdrawal request'
      });
    }
  }

  /**
   * Process instant withdrawal via Flutterwave
   */
  private async processInstantWithdrawal(data: any) {
    const {
      userId,
      amount,
      fee,
      netAmount,
      totalDeduction,
      bankCode,
      bankName,
      accountNumber,
      accountName,
      narration,
      reference,
      wallet
    } = data;

    return await prisma.$transaction(async (tx) => {
      // Deduct from wallet
      await tx.wallet.update({
        where: { id: wallet.id },
        data: {
          balance: { decrement: totalDeduction },
          totalWithdrawals: { increment: amount }
        }
      });

      // Create transaction record
      const transaction = await tx.transaction.create({
        data: {
          userId,
          walletId: wallet.id,
          amount,
          fee,
          netAmount,
          currency: 'NGN',
          type: 'WITHDRAWAL',
          status: 'PROCESSING',
          reference,
          description: `Instant withdrawal to ${bankName} - ${accountNumber}`,
          metadata: {
            withdrawalType: 'instant',
            bankDetails: {
              bankName,
              bankCode,
              accountNumber,
              accountName
            },
            narration,
            processedAt: new Date().toISOString()
          }
        }
      });

      // Initiate Flutterwave transfer
      try {
        const transferResult = await flutterwaveService.initiateTransfer({
          accountBank: bankCode,
          accountNumber,
          amount: netAmount,
          narration: narration || 'Wallet Withdrawal',
          currency: 'NGN',
          reference,
          beneficiaryName: accountName
        });

        // Update transaction with transfer details
        await tx.transaction.update({
          where: { id: transaction.id },
          data: {
            status: transferResult.status === 'SUCCESSFUL' ? 'COMPLETED' : 'PROCESSING',
            metadata: {
              ...(transaction.metadata as any),
              flutterwaveTransferId: transferResult.id,
              flutterwaveStatus: transferResult.status,
              flutterwaveResponse: transferResult
            }
          }
        });

        // Send notification
        await notificationService.createNotification({
          userId,
          type: 'TRANSACTION',
          title: 'Withdrawal Processing',
          message: `Your withdrawal of ₦${netAmount.toLocaleString()} is being processed. Funds will arrive in 10-30 minutes.`,
          data: {
            type: 'withdrawal',
            amount: netAmount,
            currency: 'NGN',
            reference,
            transactionId: transaction.id,
            estimatedTime: '10-30 minutes'
          }
        });

        return {
          success: true,
          message: 'Withdrawal initiated successfully',
          data: {
            reference,
            status: 'PROCESSING',
            estimatedTime: '10-30 minutes',
            amount: netAmount,
            accountName,
            submittedAt: new Date().toISOString(),
            isInstant: true
          }
        };
      } catch (transferError: any) {
        // Refund if transfer fails
        await tx.wallet.update({
          where: { id: wallet.id },
          data: {
            balance: { increment: totalDeduction },
            totalWithdrawals: { decrement: amount }
          }
        });

        await tx.transaction.update({
          where: { id: transaction.id },
          data: {
            status: 'FAILED',
            metadata: {
              ...(transaction.metadata as any),
              failureReason: transferError.message
            }
          }
        });

        throw transferError;
      }
    });
  }

  /**
   * Process manual withdrawal (requires admin approval)
   */
  private async processManualWithdrawal(req: Request, res: Response, data: any) {
    const {
      userId,
      amount,
      fee,
      netAmount,
      totalDeduction,
      bankCode,
      bankName,
      accountNumber,
      accountName,
      narration,
      reference,
      wallet
    } = data;

    const result = await prisma.$transaction(async (tx) => {
      // Deduct from wallet
      await tx.wallet.update({
        where: { id: wallet.id },
        data: {
          balance: { decrement: totalDeduction },
          totalWithdrawals: { increment: amount }
        }
      });

      // Create transaction record
      const transaction = await tx.transaction.create({
        data: {
          userId,
          walletId: wallet.id,
          amount,
          fee,
          netAmount,
          currency: 'NGN',
          type: 'WITHDRAWAL',
          status: 'PENDING',
          reference,
          description: `Withdrawal to ${bankName} - ${accountNumber}`,
          metadata: {
            withdrawalType: 'manual',
            bankDetails: {
              bankName,
              bankCode,
              accountNumber,
              accountName
            },
            narration,
            requiresAdminApproval: true,
            submittedAt: new Date().toISOString()
          }
        }
      });

      return transaction;
    });

    // Send notification
    await notificationService.createNotification({
      userId,
      type: 'TRANSACTION',
      title: 'Withdrawal Request Submitted',
      message: `Your withdrawal of ₦${netAmount.toLocaleString()} is pending admin approval. This usually takes 10 minutes to 24 hours.`,
      data: {
        type: 'withdrawal',
        amount: netAmount,
        currency: 'NGN',
        reference,
        transactionId: result.id
      }
    });

    return res.json({
      success: true,
      message: 'Withdrawal request submitted for approval',
      data: {
        reference,
        status: 'PENDING',
        estimatedTime: '10 minutes - 24 hours',
        amount: netAmount,
        accountName,
        submittedAt: new Date().toISOString(),
        isInstant: false,
        requiresApproval: true
      }
    });
  }

  /**
   * Get withdrawal limits
   */
  async getWithdrawalLimits(req: Request, res: Response) {
    try {
      const userId = req.user!.id;
      const now = new Date();
      const startOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate());
      const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

      // Get today's withdrawals
      const dailyWithdrawals = await prisma.transaction.aggregate({
        where: {
          userId,
          type: 'WITHDRAWAL',
          status: { in: ['COMPLETED', 'PROCESSING', 'PENDING'] },
          createdAt: { gte: startOfDay }
        },
        _sum: { amount: true }
      });

      // Get this month's withdrawals
      const monthlyWithdrawals = await prisma.transaction.aggregate({
        where: {
          userId,
          type: 'WITHDRAWAL',
          status: { in: ['COMPLETED', 'PROCESSING', 'PENDING'] },
          createdAt: { gte: startOfMonth }
        },
        _sum: { amount: true }
      });

      const dailyLimit = 500000; // ₦500,000
      const monthlyLimit = 2000000; // ₦2,000,000
      const dailyUsed = Number(dailyWithdrawals._sum.amount || 0);
      const monthlyUsed = Number(monthlyWithdrawals._sum.amount || 0);

      return res.json({
        success: true,
        data: {
          daily: {
            limit: dailyLimit,
            used: dailyUsed,
            remaining: Math.max(0, dailyLimit - dailyUsed)
          },
          monthly: {
            limit: monthlyLimit,
            used: monthlyUsed,
            remaining: Math.max(0, monthlyLimit - monthlyUsed)
          },
          minimum: 100,
          maximum: 500000,
          instantLimit: INSTANT_WITHDRAWAL_LIMIT,
          fee: {
            percentage: 0.5,
            minimum: 0
          }
        }
      });
    } catch (error) {
      console.error('Get withdrawal limits error:', error);
      return res.status(500).json({
        success: false,
        message: 'Failed to get withdrawal limits'
      });
    }
  }
}

export const withdrawalController = new WithdrawalController();
