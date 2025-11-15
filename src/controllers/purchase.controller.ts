import { Request, Response } from 'express';
import { purchaseService } from '../services/purchase.service';

export const purchaseController = {
  // POST /api/purchases - Create a purchase (initiate)
  async initiate(req: Request, res: Response) {
    try {
      const buyerId = (req as any).user.id;
      const { listingId } = req.body;

      if (!listingId) {
        res.status(400).json({
          success: false,
          message: 'Listing ID is required',
        });
        return;
      }

      const result = await purchaseService.createPurchase(buyerId, listingId);

      if (result.success) {
        res.status(201).json(result);
      } else {
        const statusCode =
          result.error === 'LISTING_NOT_FOUND' ? 404 :
          result.error === 'INSUFFICIENT_BALANCE' ? 400 :
          result.error === 'CANNOT_BUY_OWN_LISTING' ? 400 : 400;
        res.status(statusCode).json(result);
      }
    } catch (error: any) {
      res.status(500).json({
        success: false,
        message: 'Failed to create purchase',
        error: error.message,
      });
    }
  },

  // POST /api/purchases/:purchaseId/deliver - Seller delivers account
  async deliver(req: Request, res: Response) {
    try {
      const sellerId = (req as any).user.id;
      const { purchaseId } = req.params;
      const { accountDetails } = req.body;

      if (!accountDetails) {
        res.status(400).json({
          success: false,
          message: 'Account details are required',
        });
        return;
      }

      const result = await purchaseService.deliverPurchase(purchaseId, sellerId, accountDetails);

      if (result.success) {
        res.json(result);
      } else {
        const statusCode =
          result.error === 'PURCHASE_NOT_FOUND' ? 404 :
          result.error === 'UNAUTHORIZED' ? 403 : 400;
        res.status(statusCode).json(result);
      }
    } catch (error: any) {
      res.status(500).json({
        success: false,
        message: 'Failed to deliver purchase',
        error: error.message,
      });
    }
  },

  // POST /api/purchases/:purchaseId/confirm - Buyer confirms receipt
  async confirm(req: Request, res: Response) {
    try {
      const buyerId = (req as any).user.id;
      const { purchaseId } = req.params;
      const { rating, review } = req.body;

      const result = await purchaseService.confirmPurchase(purchaseId, buyerId, rating, review);

      if (result.success) {
        res.json(result);
      } else {
        const statusCode =
          result.error === 'PURCHASE_NOT_FOUND' ? 404 :
          result.error === 'UNAUTHORIZED' ? 403 : 400;
        res.status(statusCode).json(result);
      }
    } catch (error: any) {
      res.status(500).json({
        success: false,
        message: 'Failed to confirm purchase',
        error: error.message,
      });
    }
  },

  // GET /api/purchases - Get user's purchases
  async getUserPurchases(req: Request, res: Response) {
    try {
      const userId = (req as any).user.id;
      const page = parseInt(req.query.page as string) || 1;
      const limit = parseInt(req.query.limit as string) || 20;

      const result = await purchaseService.getUserPurchases(userId, page, limit);

      if (result.success) {
        res.json(result);
      } else {
        res.status(400).json(result);
      }
    } catch (error: any) {
      res.status(500).json({
        success: false,
        message: 'Failed to get purchases',
        error: error.message,
      });
    }
  },

  // GET /api/purchases/sales - Get user's sales
  async getUserSales(req: Request, res: Response) {
    try {
      const userId = (req as any).user.id;
      const page = parseInt(req.query.page as string) || 1;
      const limit = parseInt(req.query.limit as string) || 20;

      const result = await purchaseService.getUserSales(userId, page, limit);

      if (result.success) {
        res.json(result);
      } else {
        res.status(400).json(result);
      }
    } catch (error: any) {
      res.status(500).json({
        success: false,
        message: 'Failed to get sales',
        error: error.message,
      });
    }
  },

  // GET /api/purchases/:purchaseId - Get purchase by ID
  async getPurchaseById(req: Request, res: Response) {
    try {
      const userId = (req as any).user.id;
      const { purchaseId } = req.params;

      const result = await purchaseService.getPurchaseById(purchaseId, userId);

      if (result.success) {
        res.json(result);
      } else {
        const statusCode =
          result.error === 'PURCHASE_NOT_FOUND' ? 404 :
          result.error === 'UNAUTHORIZED' ? 403 : 400;
        res.status(statusCode).json(result);
      }
    } catch (error: any) {
      res.status(500).json({
        success: false,
        message: 'Failed to get purchase',
        error: error.message,
      });
    }
  },
};

export default purchaseController;
