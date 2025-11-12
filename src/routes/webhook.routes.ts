import { Router } from 'express';
import { webhookController } from '../controllers/webhook.controller';
import * as express from 'express';

const router = Router();

// Middleware to parse raw body for webhook signature verification
const rawBodyParser = express.raw({ type: 'application/json' });

// Paystack webhook endpoint
router.post('/paystack', rawBodyParser, webhookController.paystackWebhook);

// Flutterwave webhook endpoint
router.post('/flutterwave', rawBodyParser, webhookController.flutterwaveWebhook);

// NowPayments webhook endpoint
router.post('/nowpayments', rawBodyParser, webhookController.nowpaymentsWebhook);

export default router;