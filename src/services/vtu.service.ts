import { prisma } from '../config/database';
import { TransactionStatus, Currency } from '@prisma/client';
import { v4 as uuidv4 } from 'uuid';
import { walletService } from './wallet.service';
import { clubKonnectService } from './clubkonnect.service';

export interface VTUProvider {
  id: string;
  name: string;
  code: string;
  type: 'TELECOM';
  isActive: boolean;
}

export interface DataPlan {
  id: string;
  name: string;
  amount: number;
  validity: string;
  network: string;
}

export interface VTUTransactionRequest {
  userId: string;
  type: 'AIRTIME' | 'DATA';
  provider: string;
  recipient: string;
  amount: number;
  planId?: string;
}

export interface VTUTransactionResponse {
  success: boolean;
  reference: string;
  providerReference?: string;
  message: string;
  data?: any;
}

class VTUService {
  constructor() {
    console.log('[VTU] Service initialized with ClubKonnect provider');
  }

  // Helper method to check wallet balance
  private async checkWalletBalance(userId: string, amount: number): Promise<boolean> {
    try {
      const wallets = await walletService.getUserWallets(userId);
      const ngnWallet = wallets.find(w => w.currency === Currency.NGN);
      if (ngnWallet && ngnWallet.balance.toNumber() >= amount) {
        return true;
      }
      return false;
    } catch (error) {
      console.error('Error checking wallet balance:', error);
      return false;
    }
  }

  // Helper method to deduct wallet balance
  private async deductWalletBalance(userId: string, amount: number, reference: string): Promise<void> {
    try {
      const wallets = await walletService.getUserWallets(userId);
      const ngnWallet = wallets.find(w => w.currency === Currency.NGN);
      
      if (!ngnWallet) {
        throw new Error('NGN wallet not found');
      }
      
      if (ngnWallet.balance.toNumber() < amount) {
        throw new Error('Insufficient NGN balance');
      }
      
      await prisma.wallet.update({
        where: { id: ngnWallet.id },
        data: { balance: { decrement: amount } },
      });
      
      await prisma.transaction.create({
        data: {
          userId,
          walletId: ngnWallet.id,
          type: 'WITHDRAWAL',
          amount: amount,
          fee: 0,
          netAmount: amount,
          currency: Currency.NGN,
          reference: reference,
          description: `VTU service payment (NGN)`,
          status: TransactionStatus.COMPLETED,
        },
      });
    } catch (error) {
      console.error('Error deducting wallet balance:', error);
      throw error;
    }
  }

  // Get available networks/providers
  async getProviders(): Promise<VTUProvider[]> {
    return [
      { id: 'mtn', name: 'MTN', code: 'MTN', type: 'TELECOM', isActive: true },
      { id: 'glo', name: 'Globacom', code: 'GLO', type: 'TELECOM', isActive: true },
      { id: 'airtel', name: 'Airtel', code: 'AIRTEL', type: 'TELECOM', isActive: true },
      { id: '9mobile', name: '9mobile', code: '9MOBILE', type: 'TELECOM', isActive: true },
    ];
  }

  // Get data plans for a specific network
  async getDataPlans(network: string): Promise<DataPlan[]> {
    try {
      const plans = clubKonnectService.getDataPlans(network);
      return plans.map(plan => ({
        id: plan.id,
        name: plan.name,
        amount: plan.amount,
        validity: plan.validity,
        network: network.toUpperCase(),
      }));
    } catch (error) {
      console.error('Error fetching data plans:', error);
      return [];
    }
  }

  // Purchase airtime
  async purchaseAirtime(request: VTUTransactionRequest): Promise<VTUTransactionResponse> {
    const reference = `AIR_${Date.now()}_${uuidv4().slice(0, 8)}`;
    const totalAmount = request.amount + (request.amount * 0.02);
    
    try {
      if (request.amount < 100) {
        return {
          success: false,
          reference,
          message: 'Minimum airtime purchase is ₦100',
        };
      }

      const phoneRegex = /^0[789][01]\d{8}$/;
      if (!phoneRegex.test(request.recipient)) {
        return {
          success: false,
          reference,
          message: 'Invalid phone number format. Use format: 08012345678',
        };
      }

      const hasBalance = await this.checkWalletBalance(request.userId, totalAmount);
      if (!hasBalance) {
        return {
          success: false,
          reference,
          message: 'Insufficient wallet balance',
        };
      }

      const transaction = await prisma.vTUTransaction.create({
        data: {
          userId: request.userId,
          type: 'AIRTIME',
          provider: request.provider,
          recipient: request.recipient,
          amount: request.amount,
          fee: request.amount * 0.02,
          currency: Currency.NGN,
          reference,
          description: `Airtime purchase for ${request.recipient}`,
          status: TransactionStatus.PENDING,
          metadata: {
            network: request.provider,
            phoneNumber: request.recipient,
            provider: 'ClubKonnect',
          },
        },
      });

      await this.deductWalletBalance(request.userId, totalAmount, reference);

      try {
        console.log('[VTU] Using ClubKonnect for airtime purchase');
        console.log('[VTU] Network:', request.provider);
        console.log('[VTU] Phone:', request.recipient);
        console.log('[VTU] Amount:', request.amount);

        const response = await clubKonnectService.purchaseAirtime(
          request.provider,
          request.amount,
          request.recipient,
          reference
        );

        if (response.status === 'success') {
          await prisma.vTUTransaction.update({
            where: { id: transaction.id },
            data: {
              status: TransactionStatus.COMPLETED,
              providerReference: response.transactionid || reference,
              processedAt: new Date(),
              metadata: {
                network: request.provider,
                phoneNumber: request.recipient,
                provider: 'ClubKonnect',
                transactionId: response.transactionid,
              },
            },
          });

          return {
            success: true,
            reference,
            providerReference: response.transactionid,
            message: response.message || 'Airtime purchase successful',
          };
        } else {
          await prisma.vTUTransaction.update({
            where: { id: transaction.id },
            data: {
              status: TransactionStatus.FAILED,
            },
          });

          const wallets = await walletService.getUserWallets(request.userId);
          const ngnWallet = wallets.find(w => w.currency === Currency.NGN);
          if (ngnWallet) {
            await prisma.wallet.update({
              where: { id: ngnWallet.id },
              data: { balance: { increment: totalAmount } },
            });
          }

          return {
            success: false,
            reference,
            message: response.message || 'Airtime purchase failed',
          };
        }
      } catch (apiError: any) {
        console.error('❌ ClubKonnect API error for airtime purchase');
        console.error('Error message:', apiError.message);
        
        await prisma.vTUTransaction.update({
          where: { id: transaction.id },
          data: {
            status: TransactionStatus.FAILED,
          },
        });

        const wallets = await walletService.getUserWallets(request.userId);
        const ngnWallet = wallets.find(w => w.currency === Currency.NGN);
        if (ngnWallet) {
          await prisma.wallet.update({
            where: { id: ngnWallet.id },
            data: { balance: { increment: totalAmount } },
          });
        }

        return {
          success: false,
          reference,
          message: apiError.message || 'Service temporarily unavailable. Please try again later.',
        };
      }
    } catch (error) {
      console.error('Error purchasing airtime:', error);
      throw new Error('Failed to purchase airtime');
    }
  }

  // Purchase data
  async purchaseData(request: VTUTransactionRequest & { planId: string }): Promise<VTUTransactionResponse> {
    const reference = `DATA_${Date.now()}_${uuidv4().slice(0, 8)}`;
    const totalAmount = request.amount + (request.amount * 0.02);
    
    try {
      const phoneRegex = /^0[789][01]\d{8}$/;
      if (!phoneRegex.test(request.recipient)) {
        return {
          success: false,
          reference,
          message: 'Invalid phone number format. Use format: 08012345678',
        };
      }

      const hasBalance = await this.checkWalletBalance(request.userId, totalAmount);
      if (!hasBalance) {
        return {
          success: false,
          reference,
          message: 'Insufficient wallet balance',
        };
      }

      await this.deductWalletBalance(request.userId, totalAmount, reference);

      const transaction = await prisma.vTUTransaction.create({
        data: {
          userId: request.userId,
          type: 'DATA',
          provider: request.provider,
          recipient: request.recipient,
          amount: request.amount,
          fee: request.amount * 0.02,
          currency: Currency.NGN,
          reference,
          description: `Data purchase for ${request.recipient}`,
          status: TransactionStatus.PENDING,
          metadata: {
            network: request.provider,
            phoneNumber: request.recipient,
            planId: request.planId,
            provider: 'ClubKonnect',
          },
        },
      });

      try {
        console.log('[VTU] Using ClubKonnect for data purchase');
        console.log('[VTU] Network:', request.provider);
        console.log('[VTU] Phone:', request.recipient);
        console.log('[VTU] Plan:', request.planId);

        const response = await clubKonnectService.purchaseData(
          request.provider,
          request.planId,
          request.recipient,
          reference
        );

        if (response.status === 'success') {
          await prisma.vTUTransaction.update({
            where: { id: transaction.id },
            data: {
              status: TransactionStatus.COMPLETED,
              providerReference: response.transactionid || reference,
              processedAt: new Date(),
              metadata: {
                network: request.provider,
                phoneNumber: request.recipient,
                planId: request.planId,
                provider: 'ClubKonnect',
                transactionId: response.transactionid,
              },
            },
          });

          return {
            success: true,
            reference,
            providerReference: response.transactionid,
            message: response.message || 'Data purchase successful',
          };
        } else {
          await walletService.deposit(request.userId, totalAmount, Currency.NGN, `Refund for failed data purchase - ${reference}`);
          
          await prisma.vTUTransaction.update({
            where: { id: transaction.id },
            data: {
              status: TransactionStatus.FAILED,
            },
          });

          return {
            success: false,
            reference,
            message: response.message || 'Data purchase failed',
          };
        }
      } catch (apiError: any) {
        console.error('❌ ClubKonnect API error for data purchase');
        console.error('Error message:', apiError.message);
        
        await walletService.deposit(request.userId, totalAmount, Currency.NGN, `Refund for failed data purchase - ${reference}`);
        
        await prisma.vTUTransaction.update({
          where: { id: transaction.id },
          data: {
            status: TransactionStatus.FAILED,
          },
        });

        return {
          success: false,
          reference,
          message: apiError.message || 'Service temporarily unavailable. Please try again later.',
        };
      }
    } catch (error: any) {
      console.error('Error purchasing data:', error);
      throw new Error('Failed to purchase data');
    }
  }

  // Verify phone number
  async verifyPhoneNumber(phoneNumber: string, network: string): Promise<{ valid: boolean; customerName?: string }> {
    try {
      const isValid = /^0[789][01]\d{8}$/.test(phoneNumber);
      return {
        valid: isValid,
        customerName: isValid ? 'Customer' : undefined,
      };
    } catch (error) {
      console.error('Error verifying phone number:', error);
      return {
        valid: false,
        customerName: undefined,
      };
    }
  }
}

export const vtuService = new VTUService();
