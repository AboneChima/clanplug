import { prisma } from '../config/database';
import config from '../config/config';
import { Currency, TransactionStatus, TransactionType } from '@prisma/client';
import { v4 as uuidv4 } from 'uuid';
import { notificationService } from './notification.service';

type WalletConnectionState = { connected: boolean; provider?: string; address?: string };

class WalletService {
  private connections = new Map<string, WalletConnectionState>();

  // Connection status - for non-crypto app, always return active status
  getConnectionStatus(userId: string): WalletConnectionState {
    // For a non-crypto app, wallet is always "connected" (active)
    return { connected: true, provider: 'internal', address: 'internal_wallet' };
  }

  connect(userId: string, provider: string = 'internal') {
    // For internal wallet system, always return active status
    const state: WalletConnectionState = { connected: true, provider: 'internal', address: 'internal_wallet' };
    this.connections.set(userId, state);
    return state;
  }

  disconnect(userId: string) {
    // For internal wallet system, keep it connected but mark as inactive if needed
    const state: WalletConnectionState = { connected: true, provider: 'internal', address: 'internal_wallet' };
    this.connections.set(userId, state);
    return state;
  }

  // Get user wallets with full details
  async getUserWallets(userId: string) {
    const wallets = await prisma.wallet.findMany({
      where: { userId, isActive: true },
      select: {
        id: true,
        currency: true,
        balance: true,
        totalDeposits: true,
        totalWithdrawals: true,
        createdAt: true,
        updatedAt: true,
      },
      orderBy: { currency: 'asc' },
    });

    // Ensure all supported currencies have wallets (create if missing)
    const existingCurrencies = wallets.map(w => w.currency);
    const missingCurrencies = config.SUPPORTED_CURRENCIES.filter(
      cur => !existingCurrencies.includes(cur as Currency)
    );

    for (const currency of missingCurrencies) {
      const newWallet = await prisma.wallet.create({
        data: {
          userId,
          currency: currency as Currency,
          balance: 0,
          totalDeposits: 0,
          totalWithdrawals: 0,
        },
        select: {
          id: true,
          currency: true,
          balance: true,
          totalDeposits: true,
          totalWithdrawals: true,
          createdAt: true,
          updatedAt: true,
        },
      });
      wallets.push(newWallet);
    }

    return wallets.sort((a, b) => a.currency.localeCompare(b.currency));
  }

  // Balances: aggregate from DB wallets, fill missing supported currencies with 0
  async getBalances(userId: string): Promise<{ balances: Record<string, number>; defaultCurrency: string }> {
    const wallets = await prisma.wallet.findMany({
      where: { userId, isActive: true },
      select: { currency: true, balance: true },
    });

    const balances: Record<string, number> = {};
    for (const cur of config.SUPPORTED_CURRENCIES) {
      const wallet = wallets.find(w => w.currency === (cur as Currency));
      balances[cur] = wallet ? Number(wallet.balance) : 0;
    }

    return { balances, defaultCurrency: config.DEFAULT_CURRENCY };
  }

  // Transactions: list recent transactions for user
  async getTransactions(userId: string, page: number = 1, limit: number = 20) {
    const skip = (page - 1) * limit;
    const [items, total] = await Promise.all([
      prisma.transaction.findMany({
        where: { userId },
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
      }),
      prisma.transaction.count({ where: { userId } }),
    ]);

    // Process transactions to add sender/recipient names for transfers
    const processedTransactions = await Promise.all(
      items.map(async (tx) => {
        if (tx.type === 'TRANSFER' && tx.metadata) {
          const metadata = tx.metadata as any;
          
          if (metadata.direction === 'credit' && metadata.senderId) {
            // For incoming transfers, get sender name
            const sender = await prisma.user.findUnique({
              where: { id: metadata.senderId },
              select: { firstName: true, lastName: true, username: true, email: true }
            });
            
            if (sender) {
              const senderName = sender.firstName && sender.lastName 
                ? `${sender.firstName} ${sender.lastName}`
                : sender.username || sender.email || 'Unknown';
              
              metadata.senderName = senderName;
            }
          } else if (metadata.direction === 'debit' && metadata.recipient) {
            // For outgoing transfers, get recipient name
            const recipient = metadata.recipient;
            const recipientName = recipient.firstName && recipient.lastName 
              ? `${recipient.firstName} ${recipient.lastName}`
              : recipient.username || recipient.email || 'Unknown';
            
            metadata.recipientName = recipientName;
          }
          
          return { ...tx, metadata };
        }
        return tx;
      })
    );

    return {
      transactions: processedTransactions,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
        hasNext: page * limit < total,
        hasPrev: page > 1,
      },
    };
  }

  async getTransactionById(userId: string, transactionId: string) {
    const tx = await prisma.transaction.findFirst({
      where: { id: transactionId, userId },
    });
    return tx;
  }

  // Simple mock exchange rates for now
  async getExchangeRates() {
    return { USD_NGN: 1500, NGN_USD: 1 / 1500 };
  }

  // Deposit funds into user's wallet
  async deposit(userId: string, amount: number, currency: Currency, description?: string) {
    if (!amount || amount <= 0) {
      throw new Error('INVALID_AMOUNT');
    }

    // Calculate 0.5% deposit fee
    const feePercentage = 0.005; // 0.5% fee
    const fee = amount * feePercentage;
    const netAmount = amount - fee; // User receives amount minus fee

    const reference = `DEP-${uuidv4()}`;

    const result = await prisma.$transaction(async (tx) => {
      const wallet = await tx.wallet.upsert({
        where: { userId_currency: { userId, currency } },
        update: {
          balance: { increment: netAmount },
          totalDeposits: { increment: netAmount },
        },
        create: {
          userId,
          currency,
          balance: netAmount,
          totalDeposits: netAmount,
        },
      });

      const transaction = await tx.transaction.create({
        data: {
          userId,
          walletId: wallet.id,
          type: TransactionType.DEPOSIT,
          status: TransactionStatus.COMPLETED,
          amount,
          fee: fee,
          netAmount: netAmount,
          currency,
          reference,
          description: description || 'Wallet deposit',
        },
      });

      return { wallet, transaction };
    });

    return result;
  }

  // Transfer funds to another user (by email, username, or wallet address)
  async transferToUser(fromUserId: string, recipient: string, amount: number, currency: Currency, description?: string) {
    if (!amount || amount <= 0) {
      throw new Error('INVALID_AMOUNT');
    }

    // Check if recipient is a wallet address
    const isUsdtAddress = (recipient.startsWith('0x') || recipient.startsWith('T')) && recipient.length >= 34;
    const isNgnAddress = /^[0-9]{10}$/.test(recipient); // 10-digit Nigerian account number
    
    let toUser;
    
    try {
      if (isUsdtAddress) {
        // Find user by USDT wallet address
        toUser = await prisma.user.findFirst({
          where: { usdtWalletAddress: recipient },
          select: { id: true, username: true, email: true, firstName: true, lastName: true },
        });
      } else if (isNgnAddress) {
        // Find user by NGN wallet address
        toUser = await prisma.user.findFirst({
          where: { ngnWalletAddress: recipient },
          select: { id: true, username: true, email: true, firstName: true, lastName: true },
        });
      } else {
        // Find user by email or username
        toUser = await prisma.user.findFirst({
          where: {
            OR: [
              { email: recipient.toLowerCase() },
              { username: recipient }
            ],
          },
          select: { id: true, username: true, email: true, firstName: true, lastName: true },
        });
      }
    } catch (error) {
      console.error('Error finding recipient:', error);
      throw new Error('RECIPIENT_NOT_FOUND');
    }

    if (!toUser) {
      throw new Error('RECIPIENT_NOT_FOUND');
    }

    if (toUser.id === fromUserId) {
      throw new Error('CANNOT_TRANSFER_TO_SELF');
    }

    const baseReference = `TRF-${uuidv4()}`;
    const senderReference = `${baseReference}-OUT`;
    const receiverReference = `${baseReference}-IN`;

    // Get sender details for transaction descriptions
    const sender = await prisma.user.findUnique({
      where: { id: fromUserId },
      select: { username: true, email: true, firstName: true, lastName: true }
    });

    const senderDisplayName = sender?.firstName && sender?.lastName 
      ? `${sender.firstName} ${sender.lastName}`
      : sender?.username || sender?.email || 'Someone';

    const result = await prisma.$transaction(async (tx) => {
      // Ensure sender wallet exists and has sufficient balance
      const fromWallet = await tx.wallet.findUnique({
        where: { userId_currency: { userId: fromUserId, currency } },
      });

      if (!fromWallet) {
        throw new Error('WALLET_NOT_FOUND');
      }

      if (Number(fromWallet.balance) < amount) {
        throw new Error('INSUFFICIENT_FUNDS');
      }

      // Decrement sender balance
      const updatedFromWallet = await tx.wallet.update({
        where: { userId_currency: { userId: fromUserId, currency } },
        data: { balance: { decrement: amount } },
      });

      // Upsert recipient wallet and increment balance
      const toWallet = await tx.wallet.upsert({
        where: { userId_currency: { userId: toUser.id, currency } },
        update: { balance: { increment: amount } },
        create: { userId: toUser.id, currency, balance: amount },
      });

      // Record transactions for both parties
      const senderTx = await tx.transaction.create({
        data: {
          userId: fromUserId,
          walletId: updatedFromWallet.id,
          type: TransactionType.TRANSFER,
          status: TransactionStatus.COMPLETED,
          amount,
          fee: 0,
          netAmount: amount,
          currency,
          reference: senderReference,
          description: description || `Transfer sent to ${toUser.username || toUser.email}`,
          metadata: { 
            recipient: toUser,
            direction: 'debit',
            transferType: 'outgoing'
          },
        },
      });

      const receiverTx = await tx.transaction.create({
        data: {
          userId: toUser.id,
          walletId: toWallet.id,
          type: TransactionType.TRANSFER,
          status: TransactionStatus.COMPLETED,
          amount,
          fee: 0,
          netAmount: amount,
          currency,
          reference: receiverReference,
          description: description || `Transfer received from ${senderDisplayName}`,
          metadata: { 
            senderId: fromUserId,
            direction: 'credit',
            transferType: 'incoming'
          },
        },
      });

      return { fromWallet: updatedFromWallet, toWallet, senderTx, receiverTx, recipient: toUser };
    });

    // Send notifications to both users after successful transfer
    try {
      const recipientDisplayName = toUser.username || toUser.email;

      // Format amount with proper currency symbol
      const formattedAmount = `${currency} ${amount.toLocaleString()}`;

      // Notification for sender (DEBIT - showing outgoing transfer with minus sign)
      await notificationService.createNotification({
        userId: fromUserId,
        type: 'TRANSACTION',
        title: 'Transfer Sent',
        message: `- ${formattedAmount} sent to ${recipientDisplayName}`,
        data: {
          type: 'transfer_sent',
          amount: -amount, // Negative for debit
          currency,
          recipient: recipientDisplayName,
          reference: result.senderTx.reference,
          transactionId: result.senderTx.id,
          direction: 'debit'
        }
      });

      // Notification for receiver (CREDIT - showing incoming transfer with plus sign)
      await notificationService.createNotification({
        userId: toUser.id,
        type: 'TRANSACTION',
        title: 'Money Received',
        message: `+ ${formattedAmount} received from ${senderDisplayName}`,
        data: {
          type: 'transfer_received',
          amount: amount, // Positive for credit
          currency,
          sender: senderDisplayName,
          reference: result.receiverTx.reference,
          transactionId: result.receiverTx.id,
          direction: 'credit'
        }
      });
    } catch (notificationError) {
      // Log notification error but don't fail the transfer
      console.error('Failed to send transfer notifications:', notificationError);
    }

    return result;
  }

  // Payment verification webhook handler
  async verifyPayment(payload: any) {
    // This is a webhook handler for payment providers (Paystack, Flutterwave, etc.)
    const { reference, status, amount, currency, metadata } = payload;

    if (!reference) {
      throw new Error('INVALID_REFERENCE');
    }

    // Find the transaction by reference
    const transaction = await prisma.transaction.findFirst({
      where: { reference },
      include: { wallet: true },
    });

    if (!transaction) {
      throw new Error('TRANSACTION_NOT_FOUND');
    }

    // If already processed, return success
    if (transaction.status === TransactionStatus.COMPLETED) {
      return { success: true, message: 'Payment already verified', transaction };
    }

    // Verify payment status from provider
    if (status === 'success' || status === 'completed') {
      // Update transaction status and wallet balance
      const result = await prisma.$transaction(async (tx) => {
        // Update transaction status
        const updatedTransaction = await tx.transaction.update({
          where: { id: transaction.id },
          data: {
            status: TransactionStatus.COMPLETED,
            metadata: {
              ...(transaction.metadata as Record<string, any> || {}),
              verificationPayload: payload
            },
          },
        });

        // Update wallet balance if it's a deposit
        if (transaction.type === TransactionType.DEPOSIT) {
          await tx.wallet.update({
            where: { id: transaction.walletId },
            data: {
              balance: { increment: Number(transaction.amount) },
              totalDeposits: { increment: Number(transaction.amount) },
            },
          });
        }

        return updatedTransaction;
      });

      return { success: true, message: 'Payment verified successfully', transaction: result };
    } else {
      // Payment failed
      await prisma.transaction.update({
        where: { id: transaction.id },
        data: {
          status: TransactionStatus.FAILED,
          metadata: {
            ...(transaction.metadata as Record<string, any> || {}),
            verificationPayload: payload
          },
        },
      });

      return { success: false, message: 'Payment verification failed', transaction };
    }
  }

  // Generate wallet addresses for a user
  async generateWalletAddresses(userId: string) {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { id: true, username: true, usdtWalletAddress: true, ngnWalletAddress: true }
    });

    if (!user) {
      throw new Error('USER_NOT_FOUND');
    }

    const updates: any = {};

    // Generate USDT address if not exists (mock format for demo)
    if (!user.usdtWalletAddress) {
      updates.usdtWalletAddress = `0x${Math.random().toString(16).substr(2, 40)}`;
    }

    // Generate NGN address if not exists (mock 10-digit account number)
    if (!user.ngnWalletAddress) {
      updates.ngnWalletAddress = Math.floor(1000000000 + Math.random() * 9000000000).toString();
    }

    if (Object.keys(updates).length > 0) {
      await prisma.user.update({
        where: { id: userId },
        data: updates
      });
    }

    return {
      usdtAddress: user.usdtWalletAddress || updates.usdtWalletAddress,
      ngnAddress: user.ngnWalletAddress || updates.ngnWalletAddress
    };
  }

  // Get user's wallet addresses
  async getUserWalletAddresses(userId: string) {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { usdtWalletAddress: true, ngnWalletAddress: true }
    });

    if (!user) {
      throw new Error('USER_NOT_FOUND');
    }

    return {
      usdtAddress: user.usdtWalletAddress,
      ngnAddress: user.ngnWalletAddress
    };
  }

  // Update user's wallet addresses
  async updateWalletAddresses(userId: string, usdtAddress?: string, ngnAddress?: string) {
    const updates: any = {};
    
    if (usdtAddress !== undefined) {
      updates.usdtWalletAddress = usdtAddress;
    }
    
    if (ngnAddress !== undefined) {
      updates.ngnWalletAddress = ngnAddress;
    }

    if (Object.keys(updates).length === 0) {
      throw new Error('NO_UPDATES_PROVIDED');
    }

    await prisma.user.update({
      where: { id: userId },
      data: updates
    });

    return { success: true, message: 'Wallet addresses updated successfully' };
  }

  // Verify and update crypto deposit
  async verifyAndUpdateDeposit(paymentId: string, updateData: {
    status: TransactionStatus;
    actualAmount?: number;
    actualCurrency?: string;
    paymentHash?: string;
    networkFee?: number;
    notes?: string;
    gatewayResponse?: any;
  }) {
    const result = await prisma.$transaction(async (tx) => {
      // Find the transaction
      const transaction = await tx.transaction.findFirst({
        where: { 
          reference: paymentId,
          type: 'DEPOSIT'
        },
        include: { user: true }
      });

      if (!transaction) {
        throw new Error('Transaction not found');
      }

      // Prepare metadata with additional info
      const metadata = {
        ...(transaction.metadata as any || {}),
        paymentHash: updateData.paymentHash,
        networkFee: updateData.networkFee,
        actualCurrency: updateData.actualCurrency,
        notes: updateData.notes
      };

      // Update transaction status
      const updatedTransaction = await tx.transaction.update({
        where: { id: transaction.id },
        data: {
          status: updateData.status,
          amount: updateData.actualAmount ? updateData.actualAmount : transaction.amount,
          metadata: metadata,
          processedAt: updateData.status === 'COMPLETED' ? new Date() : null
        }
      });

      // If payment is successful, credit the user's wallet
      if (updateData.status === 'COMPLETED' && updateData.actualAmount) {
        const currency = (updateData.actualCurrency === 'usd' || updateData.actualCurrency === 'usdt') ? 'USD' : 'NGN';
        
        // Find or create wallet
        let wallet = await tx.wallet.findFirst({
          where: {
            userId: transaction.userId,
            currency: currency as Currency
          }
        });

        if (!wallet) {
          wallet = await tx.wallet.create({
            data: {
              userId: transaction.userId,
              currency: currency as Currency,
              balance: 0
            }
          });
        }

        // Credit the wallet
        await tx.wallet.update({
          where: { id: wallet.id },
          data: {
            balance: {
              increment: updateData.actualAmount
            }
          }
        });
      }

      return updatedTransaction;
    });

    return result;
  }

  // Process LMC withdrawal to bank account
  async processLMCWithdrawal(userId: string, withdrawalData: {
    amount: number;
    bankName: string;
    accountNumber: string;
    accountName: string;
    remarks: string;
  }) {
    const { amount, bankName, accountNumber, accountName, remarks } = withdrawalData;

    // Validate amount
    if (amount <= 0) {
      throw new Error('INVALID_AMOUNT');
    }

    const result = await prisma.$transaction(async (tx) => {
      // Check if user exists
      const user = await tx.user.findUnique({
        where: { id: userId },
        select: { id: true, email: true, firstName: true, lastName: true }
      });

      if (!user) {
        throw new Error('USER_NOT_FOUND');
      }

      // Find LMC wallet
      const lmcWallet = await tx.wallet.findFirst({
        where: {
          userId,
          currency: 'LMC',
          isActive: true
        }
      });

      if (!lmcWallet) {
        throw new Error('WALLET_NOT_FOUND');
      }

      // Calculate 0.5% fee and total deduction
      const feePercentage = 0.005; // 0.5% fee
      const fee = amount * feePercentage;
      const totalDeduction = amount + fee; // Deduct amount + fee from wallet

      // Check sufficient balance (requested amount + fee)
      if (lmcWallet.balance.toNumber() < totalDeduction) {
        throw new Error('INSUFFICIENT_BALANCE');
      }

      // Deduct requested amount from wallet
      const updatedWallet = await tx.wallet.update({
        where: { id: lmcWallet.id },
        data: {
          balance: {
            decrement: totalDeduction
          },
          totalWithdrawals: {
            increment: amount
          }
        }
      });

      // Create withdrawal transaction with PENDING status
      const transaction = await tx.transaction.create({
        data: {
          userId,
          walletId: lmcWallet.id,
          amount,
          fee: fee, // 0.5% fee
          netAmount: amount - fee, // User receives amount minus fee
          currency: 'LMC',
          type: 'WITHDRAWAL',
          status: 'PENDING',
          reference: `LMC_WD_${Date.now()}_${userId.slice(-6)}`,
          description: `LMC withdrawal to ${bankName} - ${accountNumber}`,
          metadata: {
            withdrawalType: 'bank_transfer',
            bankDetails: {
              bankName,
              accountNumber,
              accountName
            },
            remarks,
            feePercentage: 3,
            feeType: 'PERCENTAGE',
            totalDeducted: totalDeduction,
            submittedAt: new Date().toISOString(),
            requiresAdminApproval: true
          }
        }
      });

      // Send notification to user
      await notificationService.createNotification({
        userId,
        title: 'Withdrawal Request Submitted',
        message: `Your LMC withdrawal request for ₦${amount.toLocaleString()} has been submitted and is pending admin approval.`,
        type: 'TRANSACTION',
        data: {
          transactionId: transaction.id,
          amount,
          currency: 'LMC'
        }
      });

      return {
        transaction,
        newBalance: updatedWallet.balance.toNumber()
      };
    });

    return result;
  }
}

export const walletService = new WalletService();