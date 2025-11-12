import { Request, Response } from 'express';
import { vtuService } from '../services/vtu.service';
import { prisma } from '../config/database';

export class VTUController {
  // Get available VTU services
  async getServices(req: Request, res: Response): Promise<void> {
    try {
      const services = [
        {
          id: 'airtime',
          name: 'Airtime Top-up',
          description: 'Purchase airtime for all Nigerian networks',
          icon: '📱',
          fee: '2%',
        },
        {
          id: 'data',
          name: 'Data Bundles',
          description: 'Purchase data plans for all networks',
          icon: '📶',
          fee: '2%',
        },
      ];

      res.json({
        success: true,
        message: 'VTU services retrieved successfully',
        data: services,
      });
    } catch (error) {
      console.error('Error fetching VTU services:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to fetch VTU services',
      });
    }
  }

  // Get available networks/providers
  async getProviders(req: Request, res: Response): Promise<void> {
    try {
      const providers = await vtuService.getProviders();

      res.json({
        success: true,
        message: 'Providers retrieved successfully',
        data: providers,
      });
    } catch (error) {
      console.error('Error fetching providers:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to fetch providers',
      });
    }
  }

  // Get data plans for a network
  async getDataPlans(req: Request, res: Response): Promise<void> {
    try {
      const { network } = req.params;

      if (!network) {
        res.status(400).json({
          success: false,
          message: 'Network parameter is required',
        });
        return;
      }

      const dataPlans = await vtuService.getDataPlans(network);

      res.json({
        success: true,
        message: 'Data plans retrieved successfully',
        data: dataPlans,
      });
    } catch (error) {
      console.error('Error fetching data plans:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to fetch data plans',
      });
    }
  }

  // Purchase airtime
  async purchaseAirtime(req: Request, res: Response): Promise<void> {
    try {
      const { network, phoneNumber, amount } = req.body;
      const userId = req.user!.id;

      console.log('[Controller] Airtime purchase request received:', {
        network,
        phoneNumber,
        amount,
        userId,
      });

      const result = await vtuService.purchaseAirtime({
        userId,
        type: 'AIRTIME',
        provider: network,
        recipient: phoneNumber,
        amount: parseFloat(amount),
      });

      console.log('[Controller] Service result:', {
        success: result.success,
        message: result.message,
        reference: result.reference,
      });

      if (result.success) {
        res.status(201).json({
          success: true,
          message: result.message,
          data: {
            reference: result.reference,
            providerReference: result.providerReference,
          },
        });
      } else {
        console.log('[Controller] Returning 400 error to client:', result.message);
        res.status(400).json({
          success: false,
          message: result.message,
          data: {
            reference: result.reference,
          },
        });
      }
    } catch (error) {
      console.error('Error purchasing airtime:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to purchase airtime',
      });
    }
  }

  // Purchase data
  async purchaseData(req: Request, res: Response): Promise<void> {
    try {
      const { network, phoneNumber, planId, amount } = req.body;
      const userId = req.user!.id;

      const result = await vtuService.purchaseData({
        userId,
        type: 'DATA',
        provider: network,
        recipient: phoneNumber,
        amount: parseFloat(amount),
        planId,
      });

      if (result.success) {
        res.status(201).json({
          success: true,
          message: result.message,
          data: {
            reference: result.reference,
            providerReference: result.providerReference,
          },
        });
      } else {
        res.status(400).json({
          success: false,
          message: result.message,
          data: {
            reference: result.reference,
          },
        });
      }
    } catch (error) {
      console.error('Error purchasing data:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to purchase data',
      });
    }
  }



  // Get user transactions
  async getUserTransactions(req: Request, res: Response): Promise<void> {
    try {
      const userId = req.user!.id;
      const page = parseInt(req.query.page as string) || 1;
      const limit = parseInt(req.query.limit as string) || 20;

      // Get transactions directly from database
      const skip = (page - 1) * limit;
      const [transactions, total] = await Promise.all([
        prisma.vTUTransaction.findMany({
          where: { userId },
          orderBy: { createdAt: 'desc' },
          skip,
          take: limit,
        }),
        prisma.vTUTransaction.count({
          where: { userId },
        }),
      ]);

      res.json({
        success: true,
        message: 'VTU transactions retrieved successfully',
        data: transactions,
        pagination: {
          page,
          limit,
          total,
          totalPages: Math.ceil(total / limit),
          hasNext: page * limit < total,
          hasPrev: page > 1,
        },
      });
    } catch (error) {
      console.error('Error fetching transactions:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to fetch transactions',
      });
    }
  }

  // Get transaction by ID
  async getTransactionById(req: Request, res: Response): Promise<void> {
    try {
      const { transactionId } = req.params;
      const userId = req.user!.id;

      const transaction = await prisma.vTUTransaction.findFirst({
        where: {
          id: transactionId,
          userId,
        },
      });

      if (!transaction) {
        res.status(404).json({
          success: false,
          message: 'Transaction not found',
        });
        return;
      }

      res.json({
        success: true,
        message: 'Transaction retrieved successfully',
        data: transaction,
      });
    } catch (error) {
      console.error('Error fetching transaction:', error);
      res.status(404).json({
        success: false,
        message: 'Transaction not found',
      });
    }
  }

  // Verify phone number
  async verifyPhoneNumber(req: Request, res: Response): Promise<void> {
    try {
      const { phoneNumber, network } = req.body;

      const result = await vtuService.verifyPhoneNumber(phoneNumber, network);

      res.json({
        success: true,
        message: result.valid ? 'Phone number verified' : 'Invalid phone number',
        data: result,
      });
    } catch (error) {
      console.error('Error verifying phone number:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to verify phone number',
      });
    }
  }

}

export const vtuController = new VTUController();
