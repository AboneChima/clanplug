import { Request, Response } from 'express';
import { purchaseService } from '../services/purchase.service';

class PurchaseController {
  // POST /api/purchases
  async initiate(req: Request, res: Response) {
    try {
      const buyerId = req.user?.id;
      const { listingId } = req.body || {};

      if (!buyerId) {
        return res.status(401).json({ success: false, message: 'Authentication required' });
      }
      if (!listingId) {
        return res.status(400).json({ success: false, message: 'listingId is required' });
      }

      const result = await purchaseService.initiatePurchase({ listingId, buyerId });
      return res.status(201).json({ success: true, message: 'Purchase initiated', data: result.purchase });
    } catch (error: any) {
      return res.status(400).json({ success: false, message: error.message || 'Failed to initiate purchase' });
    }
  }

  // POST /api/purchases/:purchaseId/deliver
  async deliver(req: Request, res: Response) {
    try {
      const sellerId = req.user?.id;
      const { purchaseId } = req.params;
      const { accountDetails } = req.body || {};

      if (!sellerId) {
        return res.status(401).json({ success: false, message: 'Authentication required' });
      }
      if (!purchaseId) {
        return res.status(400).json({ success: false, message: 'purchaseId is required' });
      }
      if (!accountDetails || !accountDetails.username || !accountDetails.password) {
        return res.status(400).json({ success: false, message: 'accountDetails.username and accountDetails.password are required' });
      }

      const result = await purchaseService.deliverAccount({ purchaseId, sellerId, accountDetails });
      return res.json({ success: true, message: 'Account delivered', data: result.purchase });
    } catch (error: any) {
      return res.status(400).json({ success: false, message: error.message || 'Failed to deliver account' });
    }
  }

  // POST /api/purchases/:purchaseId/confirm
  async confirm(req: Request, res: Response) {
    try {
      const buyerId = req.user?.id;
      const { purchaseId } = req.params;

      if (!buyerId) {
        return res.status(401).json({ success: false, message: 'Authentication required' });
      }
      if (!purchaseId) {
        return res.status(400).json({ success: false, message: 'purchaseId is required' });
      }

      const result = await purchaseService.confirmDelivery(purchaseId, buyerId);
      return res.json({ success: true, message: 'Purchase completed', data: result.purchase });
    } catch (error: any) {
      return res.status(400).json({ success: false, message: error.message || 'Failed to confirm delivery' });
    }
  }
}

export const purchaseController = new PurchaseController();