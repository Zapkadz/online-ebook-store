"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.StripeService = void 0;
const stripe_1 = __importDefault(require("stripe"));
const config_1 = __importDefault(require("../config/config"));
const logger_1 = require("../utils/logger");
const errorHandler_1 = require("../utils/errorHandler");
const stripe = new stripe_1.default(config_1.default.stripe.secretKey, {
    apiVersion: '2022-11-15'
});
class StripeService {
    static async createPaymentIntent(amount, currency = 'usd') {
        try {
            const paymentIntent = await stripe.paymentIntents.create({
                amount: Math.round(amount * 100), // Convert to cents
                currency,
                automatic_payment_methods: {
                    enabled: true
                }
            });
            return paymentIntent;
        }
        catch (error) {
            logger_1.logger.error('Stripe payment intent error:', error);
            throw new errorHandler_1.AppError(500, 'Failed to create payment intent');
        }
    }
    static async createCustomer(email, name, metadata) {
        try {
            const customer = await stripe.customers.create({
                email,
                name,
                metadata
            });
            return customer;
        }
        catch (error) {
            logger_1.logger.error('Stripe customer creation error:', error);
            throw new errorHandler_1.AppError(500, 'Failed to create customer');
        }
    }
    static async attachPaymentMethod(customerId, paymentMethodId) {
        try {
            const paymentMethod = await stripe.paymentMethods.attach(paymentMethodId, {
                customer: customerId
            });
            return paymentMethod;
        }
        catch (error) {
            logger_1.logger.error('Stripe payment method attachment error:', error);
            throw new errorHandler_1.AppError(500, 'Failed to attach payment method');
        }
    }
    static async createSubscription(customerId, priceId) {
        try {
            const subscription = await stripe.subscriptions.create({
                customer: customerId,
                items: [{ price: priceId }],
                payment_behavior: 'default_incomplete',
                expand: ['latest_invoice.payment_intent']
            });
            return subscription;
        }
        catch (error) {
            logger_1.logger.error('Stripe subscription creation error:', error);
            throw new errorHandler_1.AppError(500, 'Failed to create subscription');
        }
    }
    static async cancelSubscription(subscriptionId) {
        try {
            const subscription = await stripe.subscriptions.cancel(subscriptionId);
            return subscription;
        }
        catch (error) {
            logger_1.logger.error('Stripe subscription cancellation error:', error);
            throw new errorHandler_1.AppError(500, 'Failed to cancel subscription');
        }
    }
    static async createRefund(paymentIntentId, amount) {
        try {
            const refund = await stripe.refunds.create({
                payment_intent: paymentIntentId,
                amount: amount ? Math.round(amount * 100) : undefined // Convert to cents if amount provided
            });
            return refund;
        }
        catch (error) {
            logger_1.logger.error('Stripe refund creation error:', error);
            throw new errorHandler_1.AppError(500, 'Failed to create refund');
        }
    }
    static async retrievePaymentIntent(paymentIntentId) {
        try {
            const paymentIntent = await stripe.paymentIntents.retrieve(paymentIntentId);
            return paymentIntent;
        }
        catch (error) {
            logger_1.logger.error('Stripe payment intent retrieval error:', error);
            throw new errorHandler_1.AppError(500, 'Failed to retrieve payment intent');
        }
    }
    static constructWebhookEvent(payload, signature) {
        try {
            return stripe.webhooks.constructEvent(payload, signature, config_1.default.stripe.webhookSecret);
        }
        catch (error) {
            logger_1.logger.error('Stripe webhook construction error:', error);
            throw new errorHandler_1.AppError(400, 'Invalid webhook payload');
        }
    }
    static async listPaymentMethods(customerId, type = 'card') {
        try {
            const paymentMethods = await stripe.customers.listPaymentMethods(customerId, { type: type });
            return paymentMethods.data;
        }
        catch (error) {
            logger_1.logger.error('Stripe payment methods listing error:', error);
            throw new errorHandler_1.AppError(500, 'Failed to list payment methods');
        }
    }
    static formatAmount(amount) {
        return (amount / 100).toFixed(2);
    }
}
exports.StripeService = StripeService;
//# sourceMappingURL=stripeService.js.map