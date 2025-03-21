import Stripe from 'stripe';
import config from '../config/config';
import { logger } from '../utils/logger';
import { AppError } from '../utils/errorHandler';

const stripe = new Stripe(config.stripe.secretKey, {
  apiVersion: '2022-11-15'
});

export class StripeService {
  static async createPaymentIntent(amount: number, currency: string = 'usd'): Promise<Stripe.PaymentIntent> {
    try {
      const paymentIntent = await stripe.paymentIntents.create({
        amount: Math.round(amount * 100), // Convert to cents
        currency,
        automatic_payment_methods: {
          enabled: true
        }
      });

      return paymentIntent;
    } catch (error) {
      logger.error('Stripe payment intent error:', error);
      throw new AppError(500, 'Failed to create payment intent');
    }
  }

  static async createCustomer(
    email: string,
    name?: string,
    metadata?: Record<string, string>
  ): Promise<Stripe.Customer> {
    try {
      const customer = await stripe.customers.create({
        email,
        name,
        metadata
      });

      return customer;
    } catch (error) {
      logger.error('Stripe customer creation error:', error);
      throw new AppError(500, 'Failed to create customer');
    }
  }

  static async attachPaymentMethod(
    customerId: string,
    paymentMethodId: string
  ): Promise<Stripe.PaymentMethod> {
    try {
      const paymentMethod = await stripe.paymentMethods.attach(paymentMethodId, {
        customer: customerId
      });

      return paymentMethod;
    } catch (error) {
      logger.error('Stripe payment method attachment error:', error);
      throw new AppError(500, 'Failed to attach payment method');
    }
  }

  static async createSubscription(
    customerId: string,
    priceId: string
  ): Promise<Stripe.Subscription> {
    try {
      const subscription = await stripe.subscriptions.create({
        customer: customerId,
        items: [{ price: priceId }],
        payment_behavior: 'default_incomplete',
        expand: ['latest_invoice.payment_intent']
      });

      return subscription;
    } catch (error) {
      logger.error('Stripe subscription creation error:', error);
      throw new AppError(500, 'Failed to create subscription');
    }
  }

  static async cancelSubscription(
    subscriptionId: string
  ): Promise<Stripe.Subscription> {
    try {
      const subscription = await stripe.subscriptions.cancel(subscriptionId);
      return subscription;
    } catch (error) {
      logger.error('Stripe subscription cancellation error:', error);
      throw new AppError(500, 'Failed to cancel subscription');
    }
  }

  static async createRefund(
    paymentIntentId: string,
    amount?: number
  ): Promise<Stripe.Refund> {
    try {
      const refund = await stripe.refunds.create({
        payment_intent: paymentIntentId,
        amount: amount ? Math.round(amount * 100) : undefined // Convert to cents if amount provided
      });

      return refund;
    } catch (error) {
      logger.error('Stripe refund creation error:', error);
      throw new AppError(500, 'Failed to create refund');
    }
  }

  static async retrievePaymentIntent(paymentIntentId: string): Promise<Stripe.PaymentIntent> {
    try {
      const paymentIntent = await stripe.paymentIntents.retrieve(paymentIntentId);
      return paymentIntent;
    } catch (error) {
      logger.error('Stripe payment intent retrieval error:', error);
      throw new AppError(500, 'Failed to retrieve payment intent');
    }
  }

  static constructWebhookEvent(
    payload: Buffer,
    signature: string
  ): Stripe.Event {
    try {
      return stripe.webhooks.constructEvent(
        payload,
        signature,
        config.stripe.webhookSecret
      );
    } catch (error) {
      logger.error('Stripe webhook construction error:', error);
      throw new AppError(400, 'Invalid webhook payload');
    }
  }

  static async listPaymentMethods(
    customerId: string,
    type: Stripe.PaymentMethodListParams.Type = 'card'
  ): Promise<Stripe.PaymentMethod[]> {
    try {
      const paymentMethods = await stripe.customers.listPaymentMethods(
        customerId,
        { type: type as Stripe.PaymentMethodListParams.Type }
      );
      return paymentMethods.data;
    } catch (error) {
      logger.error('Stripe payment methods listing error:', error);
      throw new AppError(500, 'Failed to list payment methods');
    }
  }

  static formatAmount(amount: number): string {
    return (amount / 100).toFixed(2);
  }
}