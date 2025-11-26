import { Router, Request, Response } from 'express';
import { authenticate, requireKYC } from '../middleware/auth.middleware';
import { asyncHandler } from '../middleware/errorHandler';
import config from '../config/config';
import { walletService } from '../services/wallet.service';

const router = Router();

// GET /api/wallets - Get user wallets
router.get('/', authenticate, asyncHandler(async (req: Request, res: Response) => {
  const wallets = await walletService.getUserWallets(req.user!.id);
  res.json({
    success: true,
    data: wallets,
    message: 'Wallets retrieved successfully'
  });
}));

// NOTE: Place dynamic ':currency' route after specific routes to avoid matching '/status', '/transactions', etc.
// GET /api/wallets/:currency - Get wallet by currency
// (kept unimplemented for now)

// GET /api/wallets/status - Wallet connection status
router.get('/status', authenticate, asyncHandler(async (req: Request, res: Response) => {
  const state = walletService.getConnectionStatus(req.user!.id);
  res.json({ success: true, data: state });
}));

// POST /api/wallets/connect - Connect wallet provider
router.post('/connect', authenticate, asyncHandler(async (req: Request, res: Response) => {
  const provider = (req.body?.provider as string) || 'metamask';
  const state = walletService.connect(req.user!.id, provider);
  res.json({ success: true, message: 'Wallet connected', data: state });
}));

// POST /api/wallets/disconnect - Disconnect wallet provider
router.post('/disconnect', authenticate, asyncHandler(async (req: Request, res: Response) => {
  walletService.disconnect(req.user!.id);
  res.json({ success: true, message: 'Wallet disconnected' });
}));

// POST /api/wallets/deposit - Initiate deposit (redirect to payment service)
router.post('/deposit', authenticate, requireKYC, asyncHandler(async (req: Request, res: Response) => {
  res.status(301).json({
    success: false,
    message: 'Deposit endpoint has moved. Please use /api/payments/deposit/initiate',
    code: 'MOVED_PERMANENTLY',
    redirectUrl: '/api/payments/deposit/initiate'
  });
}));

// POST /api/wallets/withdraw - LMC withdrawal to bank account
router.post('/withdraw', authenticate, requireKYC, asyncHandler(async (req: Request, res: Response) => {
  const { amount, bankName, accountNumber, accountName, remarks } = req.body || {};
  
  // Validate required fields
  if (!amount || Number(amount) <= 0) {
    res.status(400).json({ success: false, message: 'Valid amount is required', code: 'INVALID_AMOUNT' });
    return;
  }
  
  if (!bankName || typeof bankName !== 'string') {
    res.status(400).json({ success: false, message: 'Bank name is required', code: 'INVALID_BANK' });
    return;
  }
  
  if (!accountNumber || typeof accountNumber !== 'string') {
    res.status(400).json({ success: false, message: 'Account number is required', code: 'INVALID_ACCOUNT_NUMBER' });
    return;
  }
  
  if (!accountName || typeof accountName !== 'string') {
    res.status(400).json({ success: false, message: 'Account name is required', code: 'INVALID_ACCOUNT_NAME' });
    return;
  }

  try {
    const result = await walletService.processLMCWithdrawal(req.user!.id, {
      amount: Number(amount),
      bankName,
      accountNumber,
      accountName,
      remarks: remarks || ''
    });
    
    res.json({
      success: true,
      message: 'Withdrawal request submitted successfully. It will be processed by admin.',
      data: result
    });
  } catch (err: any) {
    const code = (err?.message as string) || 'INTERNAL_ERROR';
    const map: Record<string, { status: number; message: string }> = {
      INSUFFICIENT_BALANCE: { status: 400, message: 'Insufficient LMC balance' },
      USER_NOT_FOUND: { status: 404, message: 'User not found' },
      WALLET_NOT_FOUND: { status: 404, message: 'LMC wallet not found' },
    };
    const resp = map[code] ?? { status: 500, message: 'Withdrawal request failed' };
    res.status(resp.status).json({ success: false, message: resp.message, code });
  }
}));

// POST /api/wallets/transfer - Transfer between users (KYC not required for internal transfers)
router.post('/transfer', authenticate, asyncHandler(async (req: Request, res: Response) => {
  const { recipient, amount, currency, description } = req.body || {};
  
  if (!recipient || typeof recipient !== 'string') {
    res.status(400).json({ success: false, message: 'Recipient is required', code: 'INVALID_RECIPIENT' });
    return;
  }
  if (!amount || Number(amount) <= 0) {
    res.status(400).json({ success: false, message: 'Invalid amount', code: 'INVALID_AMOUNT' });
    return;
  }
  if (!currency || !['LMC', 'NGN', 'USD'].includes(String(currency))) {
    res.status(400).json({ success: false, message: 'Invalid currency. Supported: NGN, USD, LMC', code: 'INVALID_CURRENCY' });
    return;
  }

  try {
    const result = await walletService.transferToUser(req.user!.id, recipient, Number(amount), currency, description);
    res.json({
      success: true,
      message: 'Transfer completed',
      data: {
        fromWallet: { id: result.fromWallet.id, balance: result.fromWallet.balance },
        toWallet: { id: result.toWallet.id, balance: result.toWallet.balance },
        recipient: result.recipient,
        references: { sender: result.senderTx.reference, receiver: result.receiverTx.reference }
      }
    });
  } catch (err: any) {
    const code = (err?.message as string) || 'INTERNAL_ERROR';
    const map: Record<string, { status: number; message: string }> = {
      INVALID_AMOUNT: { status: 400, message: 'Invalid amount' },
      RECIPIENT_NOT_FOUND: { status: 404, message: 'Recipient not found' },
      CANNOT_TRANSFER_TO_SELF: { status: 400, message: 'Cannot transfer to self' },
      WALLET_NOT_FOUND: { status: 404, message: 'Sender wallet not found' },
      INSUFFICIENT_FUNDS: { status: 400, message: 'Insufficient funds' },
    };
    const resp = map[code] ?? { status: 500, message: 'Internal error' };
    res.status(resp.status).json({ success: false, message: resp.message, code });
  }
}));

// GET /api/wallets/transactions - Get transaction history
router.get('/transactions', authenticate, asyncHandler(async (req: Request, res: Response) => {
  const page = parseInt(req.query.page as string) || 1;
  const limit = parseInt(req.query.limit as string) || 20;
  const result = await walletService.getTransactions(req.user!.id, page, limit);
  res.json({ success: true, data: result.transactions, pagination: result.pagination });
}));

// GET /api/wallets/transactions/:transactionId - Get transaction details
router.get('/transactions/:transactionId', authenticate, asyncHandler(async (req: Request, res: Response) => {
  const tx = await walletService.getTransactionById(req.user!.id, req.params.transactionId);
  if (!tx) {
    res.status(404).json({ success: false, message: 'Transaction not found', code: 'NOT_FOUND' });
    return;
  }
  res.json({ success: true, data: tx });
}));

// POST /api/wallets/verify-payment - Verify payment callback
router.post('/verify-payment', asyncHandler(async (req: Request, res: Response) => {
  try {
    const result = await walletService.verifyPayment(req.body);
    res.json({
      success: result.success,
      message: result.message,
      data: result.transaction
    });
  } catch (err: any) {
    const code = (err?.message as string) || 'INTERNAL_ERROR';
    const map: Record<string, { status: number; message: string }> = {
      INVALID_REFERENCE: { status: 400, message: 'Invalid payment reference' },
      TRANSACTION_NOT_FOUND: { status: 404, message: 'Transaction not found' },
    };
    const resp = map[code] ?? { status: 500, message: 'Payment verification failed' };
    res.status(resp.status).json({ success: false, message: resp.message, code });
  }
}));

// GET /api/wallets/exchange-rate - Get current exchange rates
router.get('/exchange-rate', authenticate, asyncHandler(async (req: Request, res: Response) => {
  const rates = await walletService.getExchangeRates();
  res.json({ success: true, data: rates });
}));

// GET /api/wallets/balance - Get balances across supported currencies
router.get('/balance', authenticate, asyncHandler(async (req: Request, res: Response) => {
  const { balances, defaultCurrency } = await walletService.getBalances(req.user!.id);
  res.json({ success: true, data: balances, defaultCurrency });
}));

// GET /api/wallets/balances - Get balances across supported currencies (alias for frontend compatibility)
router.get('/balances', authenticate, asyncHandler(async (req: Request, res: Response) => {
  const { balances, defaultCurrency } = await walletService.getBalances(req.user!.id);
  res.json({ success: true, data: { balances }, defaultCurrency });
}));

// GET /api/wallets/addresses - Get user's wallet addresses
router.get('/addresses', authenticate, asyncHandler(async (req: Request, res: Response) => {
  try {
    const addresses = await walletService.getUserWalletAddresses(req.user!.id);
    res.json({ success: true, data: addresses });
  } catch (err: any) {
    const code = (err?.message as string) || 'INTERNAL_ERROR';
    const map: Record<string, { status: number; message: string }> = {
      USER_NOT_FOUND: { status: 404, message: 'User not found' },
    };
    const resp = map[code] ?? { status: 500, message: 'Failed to retrieve wallet addresses' };
    res.status(resp.status).json({ success: false, message: resp.message, code });
  }
}));

// POST /api/wallets/addresses/generate - Generate wallet addresses for user
router.post('/addresses/generate', authenticate, asyncHandler(async (req: Request, res: Response) => {
  try {
    const addresses = await walletService.generateWalletAddresses(req.user!.id);
    res.json({ 
      success: true, 
      data: addresses,
      message: 'Wallet addresses generated successfully'
    });
  } catch (err: any) {
    const code = (err?.message as string) || 'INTERNAL_ERROR';
    const map: Record<string, { status: number; message: string }> = {
      USER_NOT_FOUND: { status: 404, message: 'User not found' },
    };
    const resp = map[code] ?? { status: 500, message: 'Failed to generate wallet addresses' };
    res.status(resp.status).json({ success: false, message: resp.message, code });
  }
}));

// PUT /api/wallets/addresses - Update user's wallet addresses
router.put('/addresses', authenticate, asyncHandler(async (req: Request, res: Response) => {
  const { usdtAddress, ngnAddress } = req.body || {};
  
  try {
    const result = await walletService.updateWalletAddresses(req.user!.id, usdtAddress, ngnAddress);
    res.json({ success: true, message: result.message });
  } catch (err: any) {
    const code = (err?.message as string) || 'INTERNAL_ERROR';
    const map: Record<string, { status: number; message: string }> = {
      USER_NOT_FOUND: { status: 404, message: 'User not found' },
      NO_UPDATES_PROVIDED: { status: 400, message: 'No wallet address updates provided' },
    };
    const resp = map[code] ?? { status: 500, message: 'Failed to update wallet addresses' };
    res.status(resp.status).json({ success: false, message: resp.message, code });
  }
}));

export default router;