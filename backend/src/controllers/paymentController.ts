import { Request, Response } from 'express';
import { z } from 'zod';
import Stripe from 'stripe';
import { StripeService } from '../services/stripeService';
import { logger } from '../utils/logger';
import { asyncHandler } from '../utils/errorHandler';
import { BookModel } from '../models/bookModel';

const paymentIntentSchema = z.object({
  bookIds: z.array(z.number()),
  currency: z.string().default('usd')
});

const webhookSchema = z.object({
  type: z.string(),
  data: z.object({
    object: z.record(z.any())
  })
});

// Webhook event object types
type StripeWebhookPaymentIntent = Record<string, any> & {
  id: string;
  status: string;
  amount: number;
  currency: string;
  customer?: string;
};

type StripeWebhookSubscription = Record<string, any> & {
  id: string;
  status: string;
  customer: string;
  current_period_end: number;
  items: {
    data: Array<{
      price: {
        id: string;
        product: string;
      };
    }>;
  };
};

export class PaymentController {
  static createPaymentIntent = asyncHandler(async (req: Request, res: Response) => {
    const validatedData = paymentIntentSchema.parse(req.body);
    const userId = (req as any).user.userId;

    // Calculate total amount from book prices
    const books = await Promise.all(
      validatedData.bookIds.map(id => BookModel.findById(id))
    );

    // Verify all books exist and are active
    if (books.some(book => !book || !book.is_active)) {
      return res.status(400).json({
        success: false,
        message: 'One or more books are unavailable'
      });
    }

    const totalAmount = books.reduce(
      (sum, book) => sum + (book?.sale_price || book!.price),
      0
    );

    const paymentIntent = await StripeService.createPaymentIntent(
      totalAmount,
      validatedData.currency
    );

    res.json({
      success: true,
      clientSecret: paymentIntent.client_secret,
      amount: totalAmount
    });
  });

  static handleWebhook = asyncHandler(async (req: Request, res: Response) => {
    const signature = req.headers['stripe-signature'];

    if (!signature) {
      return res.status(400).json({
        success: false,
        message: 'Missing stripe signature'
      });
    }

    const event = StripeService.constructWebhookEvent(
      req.body,
      signature as string
    );

    const validatedEvent = webhookSchema.parse(event);

    // Handle different webhook events
    switch (validatedEvent.type) {
      case 'payment_intent.succeeded':
        await handlePaymentSuccess(validatedEvent.data.object as StripeWebhookPaymentIntent);
        break;

      case 'payment_intent.payment_failed':
        await handlePaymentFailure(validatedEvent.data.object as StripeWebhookPaymentIntent);
        break;

      case 'customer.subscription.created':
        await handleSubscriptionCreated(validatedEvent.data.object as StripeWebhookSubscription);
        break;

      case 'customer.subscription.deleted':
        await handleSubscriptionCanceled(validatedEvent.data.object as StripeWebhookSubscription);
        break;

      default:
        logger.info(`Unhandled webhook event: ${validatedEvent.type}`);
    }

    res.json({ received: true });
  });

  static createCustomer = asyncHandler(async (req: Request, res: Response) => {
    const userId = (req as any).user.userId;
    const { email, name } = req.body;

    const customer = await StripeService.createCustomer(email, name, {
      userId: userId.toString()
    });

    res.json({
      success: true,
      customerId: customer.id
    });
  });

  static attachPaymentMethod = asyncHandler(async (req: Request, res: Response) => {
    const { customerId, paymentMethodId } = req.body;

    const paymentMethod = await StripeService.attachPaymentMethod(
      customerId,
      paymentMethodId
    );

    res.json({
      success: true,
      paymentMethod
    });
  });

  static listPaymentMethods = asyncHandler(async (req: Request, res: Response) => {
    const { customerId } = req.params;
    const type = (req.query.type as Stripe.PaymentMethodListParams['type']) || 'card';

    const paymentMethods = await StripeService.listPaymentMethods(customerId, type);

    res.json({
      success: true,
      paymentMethods
    });
  });

  static createRefund = asyncHandler(async (req: Request, res: Response) => {
    const { paymentIntentId, amount } = req.body;

    const refund = await StripeService.createRefund(paymentIntentId, amount);

    res.json({
      success: true,
      refund
    });
  });
}

// Webhook event handlers
async function handlePaymentSuccess(paymentIntent: StripeWebhookPaymentIntent) {
  logger.info(`Payment succeeded for payment intent: ${paymentIntent.id}`);
  // Implement order fulfillment logic here
}

async function handlePaymentFailure(paymentIntent: StripeWebhookPaymentIntent) {
  logger.error(`Payment failed for payment intent: ${paymentIntent.id}`);
  // Implement failure handling logic here
}

async function handleSubscriptionCreated(subscription: StripeWebhookSubscription) {
  logger.info(`Subscription created: ${subscription.id}`);
  // Implement subscription activation logic here
}

async function handleSubscriptionCanceled(subscription: StripeWebhookSubscription) {
  logger.info(`Subscription canceled: ${subscription.id}`);
  // Implement subscription deactivation logic here
}