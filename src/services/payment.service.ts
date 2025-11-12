import axios from 'axios';
import config from '../config/config';
import { prisma } from '../config/database';
import { Currency, TransactionStatus, TransactionType } from '@prisma/client';
import { v4 as uuidv4 } from 'uuid';

export interface PaymentInitiationRequest {
  userId: string;
  amount: number;
  currency: Currency;
  email: string;
  description?: string;
  metadata?: Record<string, any>;
}

export interface PaymentInitiationResponse {
  success: boolean;
  message: string;
  data?: {
    reference: string;
    authorizationUrl: string;
    accessCode?: string;
  };
  error?: string;
}

export interface PaymentVerificationResponse {
  success: boolean;
  message: string;
  data?: {
    reference: string;
    amount: number;
    currency: string;
    status: string;
    paidAt: Date;
    channel: string;
    fees: number;
    customer: {
      email: string;
      customerCode?: string;
    };
  };
  error?: string;
}

export interface WithdrawalRequest {
  userId: string;
  amount: number;
  currency: Currency;
  accountNumber: string;
  bankCode: string;
  accountName: string;
  description?: string;
}

export interface WithdrawalResponse {
  success: boolean;
  message: string;
  data?: {
    reference: string;
    transferCode?: string;
    status: string;
  };
  error?: string;
}

class PaymentService {
  private paystackBaseUrl = 'https://api.paystack.co';
  private flutterwaveBaseUrl: string;

  constructor() {
    // Always use production API URL - Flutterwave recommends this even for test keys
    // The sandbox API has limited functionality and authentication issues
    this.flutterwaveBaseUrl = 'https://api.flutterwave.com/v3';
  }

  // Paystack Integration
  async initiatePaystackDeposit(request: PaymentInitiationRequest): Promise<PaymentInitiationResponse> {
    try {
      if (!config.PAYSTACK_SECRET_KEY) {
        return {
          success: false,
          message: 'Paystack not configured',
          error: 'PAYSTACK_NOT_CONFIGURED'
        };
      }

      // Check for existing pending transactions to prevent duplicates
      const existingPendingTransaction = await prisma.transaction.findFirst({
        where: {
          userId: request.userId,
          type: TransactionType.DEPOSIT,
          status: TransactionStatus.PENDING,
          amount: request.amount,
          currency: request.currency,
          createdAt: {
            gte: new Date(Date.now() - 10 * 60 * 1000) // Within last 10 minutes
          }
        }
      });

      if (existingPendingTransaction) {
        return {
          success: false,
          message: 'You have a pending deposit transaction. Please complete or wait for it to expire before creating a new one.',
          error: 'DUPLICATE_PENDING_TRANSACTION'
        };
      }

      const reference = `PAY-${uuidv4()}`;
      const amountInKobo = Math.round(request.amount * 100); // Convert to kobo

      const response = await axios.post(
        `${this.paystackBaseUrl}/transaction/initialize`,
        {
          email: request.email,
          amount: amountInKobo,
          currency: request.currency,
          reference,
          callback_url: `${config.APP_URL}/api/payments/paystack/callback`,
          metadata: {
            userId: request.userId,
            ...request.metadata
          }
        },
        {
          headers: {
            Authorization: `Bearer ${config.PAYSTACK_SECRET_KEY}`,
            'Content-Type': 'application/json'
          }
        }
      );

      if (response.data.status) {
        // Get or create user's wallet
        const wallet = await prisma.wallet.upsert({
          where: { 
            userId_currency: { 
              userId: request.userId, 
              currency: request.currency 
            } 
          },
          update: {},
          create: {
            userId: request.userId,
            currency: request.currency,
            balance: 0,
            totalDeposits: 0,
            totalWithdrawals: 0
          }
        });

        // Create pending transaction record
        await prisma.transaction.create({
          data: {
            userId: request.userId,
            walletId: wallet.id,
            type: TransactionType.DEPOSIT,
            status: TransactionStatus.PENDING,
            amount: request.amount,
            fee: 0,
            netAmount: request.amount,
            currency: request.currency,
            reference,
            description: request.description || 'Wallet deposit via Paystack',
            metadata: {
              gateway: 'paystack',
              accessCode: response.data.data.access_code
            }
          }
        });

        return {
          success: true,
          message: 'Payment initiated successfully',
          data: {
            reference,
            authorizationUrl: response.data.data.authorization_url,
            accessCode: response.data.data.access_code
          }
        };
      }

      return {
        success: false,
        message: response.data.message || 'Failed to initiate payment',
        error: 'PAYSTACK_ERROR'
      };
    } catch (error: any) {
      console.error('Paystack deposit initiation error:', error);
      return {
        success: false,
        message: 'Failed to initiate payment',
        error: error.response?.data?.message || 'INTERNAL_ERROR'
      };
    }
  }

  async verifyPaystackPayment(reference: string): Promise<PaymentVerificationResponse> {
    try {
      if (!config.PAYSTACK_SECRET_KEY) {
        return {
          success: false,
          message: 'Paystack not configured',
          error: 'PAYSTACK_NOT_CONFIGURED'
        };
      }

      const response = await axios.get(
        `${this.paystackBaseUrl}/transaction/verify/${reference}`,
        {
          headers: {
            Authorization: `Bearer ${config.PAYSTACK_SECRET_KEY}`
          }
        }
      );

      if (response.data.status && response.data.data.status === 'success') {
        const data = response.data.data;
        
        return {
          success: true,
          message: 'Payment verified successfully',
          data: {
            reference: data.reference,
            amount: data.amount / 100, // Convert from kobo
            currency: data.currency,
            status: data.status,
            paidAt: new Date(data.paid_at),
            channel: data.channel,
            fees: data.fees / 100,
            customer: {
              email: data.customer.email,
              customerCode: data.customer.customer_code
            }
          }
        };
      }

      return {
        success: false,
        message: 'Payment verification failed',
        error: 'PAYMENT_FAILED'
      };
    } catch (error: any) {
      console.error('Paystack verification error:', error);
      return {
        success: false,
        message: 'Failed to verify payment',
        error: error.response?.data?.message || 'INTERNAL_ERROR'
      };
    }
  }

  async initiatePaystackWithdrawal(request: WithdrawalRequest): Promise<WithdrawalResponse> {
    try {
      if (!config.PAYSTACK_SECRET_KEY) {
        return {
          success: false,
          message: 'Paystack not configured',
          error: 'PAYSTACK_NOT_CONFIGURED'
        };
      }

      // Check for existing pending withdrawals to prevent duplicates
      const existingPendingWithdrawal = await prisma.transaction.findFirst({
        where: {
          userId: request.userId,
          type: TransactionType.WITHDRAWAL,
          status: TransactionStatus.PENDING,
          amount: request.amount,
          currency: request.currency,
          createdAt: {
            gte: new Date(Date.now() - 10 * 60 * 1000) // Within last 10 minutes
          }
        }
      });

      if (existingPendingWithdrawal) {
        return {
          success: false,
          message: 'You have a pending withdrawal transaction. Please wait for it to complete before creating a new one.',
          error: 'DUPLICATE_PENDING_WITHDRAWAL'
        };
      }

      const reference = `WTH-${uuidv4()}`;
      const amountInKobo = Math.round(request.amount * 100);

      // Create transfer recipient first
      const recipientResponse = await axios.post(
        `${this.paystackBaseUrl}/transferrecipient`,
        {
          type: 'nuban',
          name: request.accountName,
          account_number: request.accountNumber,
          bank_code: request.bankCode,
          currency: request.currency
        },
        {
          headers: {
            Authorization: `Bearer ${config.PAYSTACK_SECRET_KEY}`,
            'Content-Type': 'application/json'
          }
        }
      );

      if (!recipientResponse.data.status) {
        return {
          success: false,
          message: 'Failed to create transfer recipient',
          error: 'RECIPIENT_CREATION_FAILED'
        };
      }

      // Initiate transfer
      const transferResponse = await axios.post(
        `${this.paystackBaseUrl}/transfer`,
        {
          source: 'balance',
          amount: amountInKobo,
          recipient: recipientResponse.data.data.recipient_code,
          reason: request.description || 'Wallet withdrawal',
          reference
        },
        {
          headers: {
            Authorization: `Bearer ${config.PAYSTACK_SECRET_KEY}`,
            'Content-Type': 'application/json'
          }
        }
      );

      if (transferResponse.data.status) {
        // Get or create user's wallet
        const wallet = await prisma.wallet.upsert({
          where: { 
            userId_currency: { 
              userId: request.userId, 
              currency: request.currency 
            } 
          },
          update: {},
          create: {
            userId: request.userId,
            currency: request.currency,
            balance: 0,
            totalDeposits: 0,
            totalWithdrawals: 0
          }
        });

        // Create withdrawal transaction record
        await prisma.transaction.create({
          data: {
            userId: request.userId,
            walletId: wallet.id,
            type: TransactionType.WITHDRAWAL,
            status: TransactionStatus.PENDING,
            amount: request.amount,
            fee: 0,
            netAmount: request.amount,
            currency: request.currency,
            reference,
            description: request.description || 'Wallet withdrawal via Paystack',
            metadata: {
              gateway: 'paystack',
              transferCode: transferResponse.data.data.transfer_code,
              recipientCode: recipientResponse.data.data.recipient_code,
              accountNumber: request.accountNumber,
              bankCode: request.bankCode,
              accountName: request.accountName
            }
          }
        });

        return {
          success: true,
          message: 'Withdrawal initiated successfully',
          data: {
            reference,
            transferCode: transferResponse.data.data.transfer_code,
            status: transferResponse.data.data.status
          }
        };
      }

      return {
        success: false,
        message: transferResponse.data.message || 'Failed to initiate withdrawal',
        error: 'TRANSFER_FAILED'
      };
    } catch (error: any) {
      console.error('Paystack withdrawal error:', error);
      return {
        success: false,
        message: 'Failed to initiate withdrawal',
        error: error.response?.data?.message || 'INTERNAL_ERROR'
      };
    }
  }

  // Flutterwave Integration
  async initiateFlutterwaveDeposit(request: PaymentInitiationRequest): Promise<PaymentInitiationResponse> {
    try {
      if (!config.FLUTTERWAVE_SECRET_KEY) {
        return {
          success: false,
          message: 'Flutterwave payment gateway is not configured. Please contact support.',
          error: 'FLUTTERWAVE_NOT_CONFIGURED'
        };
      }

      // Validate that we have a proper API key (not placeholder)
      if (config.FLUTTERWAVE_SECRET_KEY === 'your_flutterwave_secret_key_here' || 
          config.FLUTTERWAVE_SECRET_KEY.length < 10) {
        return {
          success: false,
          message: 'Flutterwave API credentials are invalid. Please contact support.',
          error: 'FLUTTERWAVE_INVALID_CREDENTIALS'
        };
      }

      // Check for existing pending transactions to prevent duplicates
      const existingPendingTransaction = await prisma.transaction.findFirst({
        where: {
          userId: request.userId,
          type: TransactionType.DEPOSIT,
          status: TransactionStatus.PENDING,
          amount: request.amount,
          currency: request.currency,
          createdAt: {
            gte: new Date(Date.now() - 10 * 60 * 1000) // Within last 10 minutes
          }
        }
      });

      if (existingPendingTransaction) {
        return {
          success: false,
          message: 'You have a pending deposit transaction. Please complete or wait for it to expire before creating a new one.',
          error: 'DUPLICATE_PENDING_TRANSACTION'
        };
      }

      const reference = `FLW-${uuidv4()}`;

      const response = await axios.post(
        `${this.flutterwaveBaseUrl}/payments`,
        {
          tx_ref: reference,
          amount: request.amount,
          currency: request.currency,
          redirect_url: `${config.APP_URL}/api/payments/flutterwave/callback`,
          customer: {
            email: request.email
          },
          customizations: {
            title: 'Lordmoon Wallet Deposit',
            description: request.description || 'Wallet deposit'
          },
          meta: {
            userId: request.userId,
            ...request.metadata
          },
          payment_options: "card,banktransfer,ussd",
          payment_plan: null
        },
        {
          headers: {
            Authorization: `Bearer ${config.FLUTTERWAVE_SECRET_KEY}`,
            'Content-Type': 'application/json'
          }
        }
      );

      if (response.data.status === 'success') {
        // Get or create user's wallet
        const userWallet = await prisma.wallet.upsert({
          where: { 
            userId_currency: { 
              userId: request.userId, 
              currency: request.currency 
            } 
          },
          update: {},
          create: {
            userId: request.userId,
            currency: request.currency,
            balance: 0,
            totalDeposits: 0,
            totalWithdrawals: 0
          }
        });

        // Create pending transaction record
        await prisma.transaction.create({
          data: {
            userId: request.userId,
            walletId: userWallet.id,
            type: TransactionType.DEPOSIT,
            status: TransactionStatus.PENDING,
            amount: request.amount,
            fee: 0,
            netAmount: request.amount,
            currency: request.currency,
            reference,
            description: request.description || 'Wallet deposit via Flutterwave',
            metadata: {
              gateway: 'flutterwave'
            }
          }
        });

        return {
          success: true,
          message: 'Payment initiated successfully',
          data: {
            reference,
            authorizationUrl: response.data.data.link
          }
        };
      }

      return {
        success: false,
        message: response.data.message || 'Failed to initiate payment with Flutterwave',
        error: 'FLUTTERWAVE_API_ERROR'
      };
    } catch (error: any) {
      console.error('Flutterwave deposit initiation error:', error);
      
      // Handle specific error cases
      if (error.code === 'ENOTFOUND' || error.code === 'ECONNREFUSED') {
        return {
          success: false,
          message: 'Unable to connect to Flutterwave service. Please try again later.',
          error: 'FLUTTERWAVE_CONNECTION_ERROR'
        };
      }
      
      if (error.response?.status === 401) {
        return {
          success: false,
          message: 'Flutterwave authentication failed. This could be due to: 1) Invalid API keys, 2) Unverified Flutterwave account, 3) IP address not whitelisted, or 4) Account restrictions. Please verify your account in the Flutterwave dashboard and ensure your IP is whitelisted.',
          error: 'FLUTTERWAVE_AUTH_ERROR'
        };
      }
      
      if (error.response?.status === 400) {
        return {
          success: false,
          message: error.response.data?.message || 'Invalid payment request. Please check your details.',
          error: 'FLUTTERWAVE_VALIDATION_ERROR'
        };
      }
      
      return {
        success: false,
        message: 'Payment initiation failed. Please try again later.',
        error: error.response?.data?.message || 'INTERNAL_ERROR'
      };
    }
  }

  async verifyFlutterwavePayment(transactionId: string): Promise<PaymentVerificationResponse> {
    try {
      if (!config.FLUTTERWAVE_SECRET_KEY) {
        return {
          success: false,
          message: 'Flutterwave not configured',
          error: 'FLUTTERWAVE_NOT_CONFIGURED'
        };
      }

      // Use production API endpoint for verification even with test keys
      // The sandbox API doesn't support the verification endpoint structure
      const verificationUrl = `https://api.flutterwave.com/v3/transactions/${transactionId}/verify`;

      const response = await axios.get(
        verificationUrl,
        {
          headers: {
            Authorization: `Bearer ${config.FLUTTERWAVE_SECRET_KEY}`
          }
        }
      );

      if (response.data.status === 'success' && response.data.data.status === 'successful') {
        const data = response.data.data;
        
        return {
          success: true,
          message: 'Payment verified successfully',
          data: {
            reference: data.tx_ref,
            amount: data.amount,
            currency: data.currency,
            status: data.status,
            paidAt: new Date(data.created_at),
            channel: data.payment_type,
            fees: data.app_fee,
            customer: {
              email: data.customer.email
            }
          }
        };
      }

      return {
        success: false,
        message: 'Payment verification failed',
        error: 'PAYMENT_FAILED'
      };
    } catch (error: any) {
      console.error('Flutterwave verification error:', error);
      return {
        success: false,
        message: 'Failed to verify payment',
        error: error.response?.data?.message || 'INTERNAL_ERROR'
      };
    }
  }

  // Process successful payment and update wallet
  async processSuccessfulPayment(reference: string, verificationData: any): Promise<boolean> {
    try {
      const transaction = await prisma.transaction.findFirst({
        where: { reference, status: TransactionStatus.PENDING },
        include: { user: true }
      });

      if (!transaction) {
        console.error('Transaction not found for reference:', reference);
        return false;
      }

      await prisma.$transaction(async (tx) => {
        // Update transaction status
        await tx.transaction.update({
          where: { id: transaction.id },
          data: {
            status: TransactionStatus.COMPLETED,
            metadata: {
              ...(transaction.metadata as Record<string, any> || {}),
              verificationData
            }
          }
        });

        // Credit the wallet in the SAME currency as the deposit
        await tx.wallet.upsert({
          where: {
            userId_currency: {
              userId: transaction.userId,
              currency: transaction.currency
            }
          },
          update: {
            balance: { increment: transaction.amount },
            totalDeposits: { increment: transaction.amount }
          },
          create: {
            userId: transaction.userId,
            currency: transaction.currency,
            balance: transaction.amount,
            totalDeposits: transaction.amount
          }
        });
      });

      return true;
    } catch (error) {
      console.error('Process successful payment error:', error);
      return false;
    }
  }

  // Get available banks for withdrawals
  async getPaystackBanks(): Promise<{ success: boolean; data?: any[]; error?: string }> {
    try {
      if (!config.PAYSTACK_SECRET_KEY) {
        return {
          success: false,
          error: 'PAYSTACK_NOT_CONFIGURED'
        };
      }

      const response = await axios.get(
        `${this.paystackBaseUrl}/bank`,
        {
          headers: {
            Authorization: `Bearer ${config.PAYSTACK_SECRET_KEY}`
          }
        }
      );

      if (response.data.status) {
        return {
          success: true,
          data: response.data.data
        };
      }

      return {
        success: false,
        error: 'FAILED_TO_FETCH_BANKS'
      };
    } catch (error: any) {
      console.error('Get banks error:', error);
      return {
        success: false,
        error: error.response?.data?.message || 'INTERNAL_ERROR'
      };
    }
  }

  // Get available banks from Flutterwave for withdrawals
  async getFlutterwaveBanks(): Promise<{ success: boolean; data?: any[]; error?: string }> {
    try {
      if (!config.FLUTTERWAVE_SECRET_KEY) {
        return {
          success: false,
          error: 'FLUTTERWAVE_NOT_CONFIGURED'
        };
      }

      const response = await axios.get(
        `${this.flutterwaveBaseUrl}/banks/NG`,
        {
          headers: {
            Authorization: `Bearer ${config.FLUTTERWAVE_SECRET_KEY}`,
            'Content-Type': 'application/json'
          }
        }
      );

      if (response.data.status === 'success') {
        let banks = response.data.data;
        
        // Remove duplicate bank codes by keeping the first occurrence
        // This prevents React key errors in the frontend
        const seenCodes = new Set();
        banks = banks.filter((bank: any) => {
          if (seenCodes.has(bank.code)) {
            console.log(`Removing duplicate bank code ${bank.code}: ${bank.name} (ID: ${bank.id})`);
            return false;
          }
          seenCodes.add(bank.code);
          return true;
        });
        
        console.log(`Filtered ${response.data.data.length} banks to ${banks.length} unique banks`);
        
        return {
          success: true,
          data: banks
        };
      }

      return {
        success: false,
        error: 'FAILED_TO_FETCH_BANKS'
      };
    } catch (error: any) {
      console.error('Get Flutterwave banks error:', error);
      return {
        success: false,
        error: error.response?.data?.message || 'INTERNAL_ERROR'
      };
    }
  }

  // Verify bank account
  async verifyBankAccount(accountNumber: string, bankCode: string): Promise<{ success: boolean; data?: any; error?: string }> {
    try {
      if (!config.PAYSTACK_SECRET_KEY) {
        return {
          success: false,
          error: 'PAYSTACK_NOT_CONFIGURED'
        };
      }

      const response = await axios.get(
        `${this.paystackBaseUrl}/bank/resolve?account_number=${accountNumber}&bank_code=${bankCode}`,
        {
          headers: {
            Authorization: `Bearer ${config.PAYSTACK_SECRET_KEY}`
          }
        }
      );

      if (response.data.status) {
        return {
          success: true,
          data: {
            accountNumber: response.data.data.account_number,
            accountName: response.data.data.account_name,
            bankId: response.data.data.bank_id
          }
        };
      }

      return {
        success: false,
        error: 'ACCOUNT_VERIFICATION_FAILED'
      };
    } catch (error: any) {
      console.error('Verify bank account error:', error);
      return {
        success: false,
        error: error.response?.data?.message || 'INTERNAL_ERROR'
      };
    }
  }

  // Process successful withdrawal
  async processSuccessfulWithdrawal(reference: string, verificationData: any): Promise<boolean> {
    try {
      const transaction = await prisma.transaction.findFirst({
        where: { reference, status: TransactionStatus.PENDING },
        include: { user: true }
      });

      if (!transaction) {
        console.error('Withdrawal transaction not found for reference:', reference);
        return false;
      }

      await prisma.transaction.update({
        where: { id: transaction.id },
        data: {
          status: TransactionStatus.COMPLETED,
          metadata: {
            ...(transaction.metadata as Record<string, any> || {}),
            verificationData
          }
        }
      });

      console.log(`Withdrawal completed successfully: ${reference}`);
      return true;
    } catch (error) {
      console.error('Process successful withdrawal error:', error);
      return false;
    }
  }

  // Process failed withdrawal
  async processFailedWithdrawal(reference: string, failureData: any): Promise<boolean> {
    try {
      const transaction = await prisma.transaction.findFirst({
        where: { reference, status: TransactionStatus.PENDING },
        include: { user: true }
      });

      if (!transaction) {
        console.error('Withdrawal transaction not found for reference:', reference);
        return false;
      }

      await prisma.$transaction(async (tx) => {
        // Update transaction status to failed
        await tx.transaction.update({
          where: { id: transaction.id },
          data: {
            status: TransactionStatus.FAILED,
            metadata: {
              ...(transaction.metadata as Record<string, any> || {}),
              failureData
            }
          }
        });

        // Refund the amount back to user's wallet
        await tx.wallet.upsert({
          where: {
            userId_currency: {
              userId: transaction.userId,
              currency: transaction.currency
            }
          },
          update: {
            balance: { increment: transaction.amount }
          },
          create: {
            userId: transaction.userId,
            currency: transaction.currency,
            balance: transaction.amount
          }
        });
      });

      console.log(`Withdrawal failed and refunded: ${reference}`);
      return true;
    } catch (error) {
      console.error('Process failed withdrawal error:', error);
      return false;
    }
  }

  // Process reversed withdrawal
  async processReversedWithdrawal(reference: string, reversalData: any): Promise<boolean> {
    try {
      const transaction = await prisma.transaction.findFirst({
        where: { reference },
        include: { user: true }
      });

      if (!transaction) {
        console.error('Withdrawal transaction not found for reference:', reference);
        return false;
      }

      await prisma.$transaction(async (tx) => {
        // Update transaction status to reversed
        await tx.transaction.update({
          where: { id: transaction.id },
          data: {
            status: TransactionStatus.FAILED,
            metadata: {
              ...(transaction.metadata as Record<string, any> || {}),
              reversalData,
              reversed: true
            }
          }
        });

        // Refund the amount back to user's wallet if not already refunded
        if (transaction.status === TransactionStatus.COMPLETED) {
          await tx.wallet.upsert({
            where: {
              userId_currency: {
                userId: transaction.userId,
                currency: transaction.currency
              }
            },
            update: {
              balance: { increment: transaction.amount }
            },
            create: {
              userId: transaction.userId,
              currency: transaction.currency,
              balance: transaction.amount
            }
          });
        }
      });

      console.log(`Withdrawal reversed and refunded: ${reference}`);
      return true;
    } catch (error) {
      console.error('Process reversed withdrawal error:', error);
      return false;
    }
  }
}

export const paymentService = new PaymentService();