import { Request, Response } from 'express';
import * as crypto from 'crypto';
import config from '../config/config';
import { paymentService } from '../services/payment.service';
import { nowPaymentsService } from '../services/nowpayments.service';
import { walletService } from '../services/wallet.service';
import { TransactionStatus } from '@prisma/client';



export const webhookController = {
  // POST /api/webhooks/paystack - Paystack webhook handler
  async paystackWebhook(req: Request, res: Response): Promise<void> {
    try {
      const hash = crypto
        .createHmac('sha512', config.PAYSTACK_SECRET_KEY!)
        .update(JSON.stringify(req.body))
        .digest('hex');

      const signature = req.headers['x-paystack-signature'] as string;

      if (hash !== signature) {
        console.error('Invalid Paystack webhook signature');
        res.status(400).json({
          success: false,
          message: 'Invalid signature'
        });
        return;
      }

      const { event, data } = req.body;

      switch (event) {
        case 'charge.success':
          await handlePaystackChargeSuccess(data);
          break;
        case 'transfer.success':
          await handlePaystackTransferSuccess(data);
          break;
        case 'transfer.failed':
          await handlePaystackTransferFailed(data);
          break;
        case 'transfer.reversed':
          await handlePaystackTransferReversed(data);
          break;
        default:
          console.log(`Unhandled Paystack event: ${event}`);
      }

      res.status(200).json({
        success: true,
        message: 'Webhook processed successfully'
      });
    } catch (error: any) {
      console.error('Paystack webhook error:', error);
      res.status(500).json({
        success: false,
        message: 'Webhook processing failed',
        error: error.message
      });
    }
  },

  // POST /api/webhooks/flutterwave - Flutterwave webhook handler
  async flutterwaveWebhook(req: Request, res: Response): Promise<void> {
    try {
      const secretHash = config.FLUTTERWAVE_WEBHOOK_SECRET;
      const signature = req.headers['verif-hash'] as string;

      if (!secretHash || signature !== secretHash) {
        console.error('Invalid Flutterwave webhook signature');
        res.status(400).json({
          success: false,
          message: 'Invalid signature'
        });
        return;
      }

      const { event, data } = req.body;

      switch (event) {
        case 'charge.completed':
          await handleFlutterwaveChargeCompleted(data);
          break;
        case 'transfer.completed':
          await handleFlutterwaveTransferCompleted(data);
          break;
        case 'transfer.failed':
          await handleFlutterwaveTransferFailed(data);
          break;
        default:
          console.log(`Unhandled Flutterwave event: ${event}`);
      }

      res.status(200).json({
        success: true,
        message: 'Webhook processed successfully'
      });
    } catch (error: any) {
      console.error('Flutterwave webhook error:', error);
      res.status(500).json({
        success: false,
        message: 'Webhook processing failed',
        error: error.message
      });
    }
  },

  // POST /api/webhooks/nowpayments - NowPayments webhook handler
  async nowpaymentsWebhook(req: Request, res: Response): Promise<void> {
    try {
      const signature = req.headers['x-nowpayments-sig'] as string;
      const body = req.body;

      // Verify webhook signature
      if (!nowPaymentsService.verifyWebhookSignature(body, signature)) {
        console.error('Invalid NowPayments webhook signature');
        res.status(400).json({
          success: false,
          message: 'Invalid signature'
        });
        return;
      }

      const { payment_id, payment_status, pay_amount, price_amount, price_currency, pay_currency, order_id } = body;

      console.log(`NowPayments webhook received: ${payment_id} - ${payment_status}`);

      switch (payment_status) {
        case 'finished':
          await handleNowPaymentsFinished(body);
          break;
        case 'partially_paid':
          await handleNowPaymentsPartiallyPaid(body);
          break;
        case 'failed':
          await handleNowPaymentsFailed(body);
          break;
        case 'refunded':
          await handleNowPaymentsRefunded(body);
          break;
        case 'expired':
          await handleNowPaymentsExpired(body);
          break;
        default:
          console.log(`Unhandled NowPayments status: ${payment_status}`);
      }

      res.status(200).json({
        success: true,
        message: 'Webhook processed successfully'
      });
    } catch (error: any) {
      console.error('NowPayments webhook error:', error);
      res.status(500).json({
        success: false,
        message: 'Webhook processing failed',
        error: error.message
      });
    }
  }
};

// Paystack event handlers
async function handlePaystackChargeSuccess(data: any): Promise<void> {
  try {
    const { reference, status, amount, currency, paid_at, channel, fees } = data;
    
    if (status === 'success') {
      const verificationData = {
        reference,
        amount: amount / 100, // Convert from kobo
        currency,
        status,
        paidAt: new Date(paid_at),
        channel,
        fees: fees / 100,
        customer: {
          email: data.customer.email,
          customerCode: data.customer.customer_code
        }
      };

      const processed = await paymentService.processSuccessfulPayment(reference, verificationData);
      
      if (processed) {
        console.log(`Paystack payment processed successfully: ${reference}`);
      } else {
        console.error(`Failed to process Paystack payment: ${reference}`);
      }
    }
  } catch (error) {
    console.error('Handle Paystack charge success error:', error);
  }
}

async function handlePaystackTransferSuccess(data: any): Promise<void> {
  try {
    const { reference, status, amount, currency, transferred_at } = data;
    
    if (status === 'success') {
      // Update withdrawal transaction status
      await paymentService.processSuccessfulWithdrawal(reference, {
        reference,
        amount: amount / 100,
        currency,
        status,
        transferredAt: new Date(transferred_at)
      });
      
      console.log(`Paystack withdrawal processed successfully: ${reference}`);
    }
  } catch (error) {
    console.error('Handle Paystack transfer success error:', error);
  }
}

async function handlePaystackTransferFailed(data: any): Promise<void> {
  try {
    const { reference, status, failure_reason } = data;
    
    // Update withdrawal transaction status to failed
    await paymentService.processFailedWithdrawal(reference, {
      reference,
      status,
      failureReason: failure_reason
    });
    
    console.log(`Paystack withdrawal failed: ${reference} - ${failure_reason}`);
  } catch (error) {
    console.error('Handle Paystack transfer failed error:', error);
  }
}

async function handlePaystackTransferReversed(data: any): Promise<void> {
  try {
    const { reference, status, reversal_reason } = data;
    
    // Update withdrawal transaction status to reversed
    await paymentService.processReversedWithdrawal(reference, {
      reference,
      status,
      reversalReason: reversal_reason
    });
    
    console.log(`Paystack withdrawal reversed: ${reference} - ${reversal_reason}`);
  } catch (error) {
    console.error('Handle Paystack transfer reversed error:', error);
  }
}

// Flutterwave event handlers
async function handleFlutterwaveChargeCompleted(data: any): Promise<void> {
  try {
    const { tx_ref, status, amount, currency, created_at, payment_type, processor_response } = data;
    
    if (status === 'successful') {
      const verificationData = {
        reference: tx_ref,
        amount,
        currency,
        status,
        paidAt: new Date(created_at),
        channel: payment_type,
        fees: data.app_fee || 0,
        customer: {
          email: data.customer.email
        }
      };

      const processed = await paymentService.processSuccessfulPayment(tx_ref, verificationData);
      
      if (processed) {
        console.log(`Flutterwave payment processed successfully: ${tx_ref}`);
      } else {
        console.error(`Failed to process Flutterwave payment: ${tx_ref}`);
      }
    }
  } catch (error) {
    console.error('Handle Flutterwave charge completed error:', error);
  }
}

async function handleFlutterwaveTransferCompleted(data: any): Promise<void> {
  try {
    const { reference, status, amount, currency, created_at } = data;
    
    if (status === 'SUCCESSFUL') {
      // Update withdrawal transaction status
      await paymentService.processSuccessfulWithdrawal(reference, {
        reference,
        amount,
        currency,
        status,
        transferredAt: new Date(created_at)
      });
      
      console.log(`Flutterwave withdrawal processed successfully: ${reference}`);
    }
  } catch (error) {
    console.error('Handle Flutterwave transfer completed error:', error);
  }
}

async function handleFlutterwaveTransferFailed(data: any): Promise<void> {
  try {
    const { reference, status, complete_message } = data;
    
    // Update withdrawal transaction status to failed
    await paymentService.processFailedWithdrawal(reference, {
      reference,
      status,
      failureReason: complete_message
    });
    
    console.log(`Flutterwave withdrawal failed: ${reference} - ${complete_message}`);
  } catch (error) {
    console.error('Handle Flutterwave transfer failed error:', error);
  }
}

// NowPayments event handlers
async function handleNowPaymentsFinished(data: any): Promise<void> {
  try {
    const { payment_id, price_amount, price_currency, pay_amount, pay_currency, order_id } = data;
    
    // Update transaction status and wallet balance
    await walletService.verifyAndUpdateDeposit(payment_id, {
      status: 'COMPLETED',
      actualAmount: parseFloat(price_amount),
      gatewayResponse: data
    });
    
    console.log(`NowPayments deposit completed successfully: ${payment_id}`);
  } catch (error) {
    console.error('Handle NowPayments finished error:', error);
  }
}

async function handleNowPaymentsPartiallyPaid(data: any): Promise<void> {
  try {
    const { payment_id, pay_amount, price_amount } = data;
    
    console.log(`NowPayments payment partially paid: ${payment_id} - ${pay_amount}/${price_amount}`);
    // You might want to handle partial payments differently based on your business logic
  } catch (error) {
    console.error('Handle NowPayments partially paid error:', error);
  }
}

async function handleNowPaymentsFailed(data: any): Promise<void> {
  try {
    const { payment_id, payment_status } = data;
    
    // Update transaction status to failed
    await walletService.verifyAndUpdateDeposit(payment_id, {
      status: 'FAILED',
      gatewayResponse: data
    });
    
    console.log(`NowPayments payment failed: ${payment_id}`);
  } catch (error) {
    console.error('Handle NowPayments failed error:', error);
  }
}

async function handleNowPaymentsRefunded(data: any): Promise<void> {
  try {
    const { payment_id, payment_status } = data;
    
    // Update transaction status to refunded
    await walletService.verifyAndUpdateDeposit(payment_id, {
      status: TransactionStatus.FAILED,
      gatewayResponse: data
    });
    
    console.log(`NowPayments payment refunded: ${payment_id}`);
  } catch (error) {
    console.error('Handle NowPayments refunded error:', error);
  }
}

async function handleNowPaymentsExpired(data: any): Promise<void> {
  try {
    const { payment_id, payment_status } = data;
    
    // Update transaction status to expired
    await walletService.verifyAndUpdateDeposit(payment_id, {
      status: TransactionStatus.FAILED,
      gatewayResponse: data
    });
    
    console.log(`NowPayments payment expired: ${payment_id}`);
  } catch (error) {
    console.error('Handle NowPayments expired error:', error);
  }
}

export default webhookController;