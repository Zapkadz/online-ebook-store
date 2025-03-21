"use strict";
var _a;
Object.defineProperty(exports, "__esModule", { value: true });
exports.PaymentController = void 0;
const zod_1 = require("zod");
const stripeService_1 = require("../services/stripeService");
const logger_1 = require("../utils/logger");
const errorHandler_1 = require("../utils/errorHandler");
const bookModel_1 = require("../models/bookModel");
const paymentIntentSchema = zod_1.z.object({
    bookIds: zod_1.z.array(zod_1.z.number()),
    currency: zod_1.z.string().default('usd')
});
const webhookSchema = zod_1.z.object({
    type: zod_1.z.string(),
    data: zod_1.z.object({
        object: zod_1.z.record(zod_1.z.any())
    })
});
class PaymentController {
}
exports.PaymentController = PaymentController;
_a = PaymentController;
PaymentController.createPaymentIntent = (0, errorHandler_1.asyncHandler)(async (req, res) => {
    const validatedData = paymentIntentSchema.parse(req.body);
    const userId = req.user.userId;
    // Calculate total amount from book prices
    const books = await Promise.all(validatedData.bookIds.map(id => bookModel_1.BookModel.findById(id)));
    // Verify all books exist and are active
    if (books.some(book => !book || !book.is_active)) {
        return res.status(400).json({
            success: false,
            message: 'One or more books are unavailable'
        });
    }
    const totalAmount = books.reduce((sum, book) => sum + ((book === null || book === void 0 ? void 0 : book.sale_price) || book.price), 0);
    const paymentIntent = await stripeService_1.StripeService.createPaymentIntent(totalAmount, validatedData.currency);
    res.json({
        success: true,
        clientSecret: paymentIntent.client_secret,
        amount: totalAmount
    });
});
PaymentController.handleWebhook = (0, errorHandler_1.asyncHandler)(async (req, res) => {
    const signature = req.headers['stripe-signature'];
    if (!signature) {
        return res.status(400).json({
            success: false,
            message: 'Missing stripe signature'
        });
    }
    const event = stripeService_1.StripeService.constructWebhookEvent(req.body, signature);
    const validatedEvent = webhookSchema.parse(event);
    // Handle different webhook events
    switch (validatedEvent.type) {
        case 'payment_intent.succeeded':
            await handlePaymentSuccess(validatedEvent.data.object);
            break;
        case 'payment_intent.payment_failed':
            await handlePaymentFailure(validatedEvent.data.object);
            break;
        case 'customer.subscription.created':
            await handleSubscriptionCreated(validatedEvent.data.object);
            break;
        case 'customer.subscription.deleted':
            await handleSubscriptionCanceled(validatedEvent.data.object);
            break;
        default:
            logger_1.logger.info(`Unhandled webhook event: ${validatedEvent.type}`);
    }
    res.json({ received: true });
});
PaymentController.createCustomer = (0, errorHandler_1.asyncHandler)(async (req, res) => {
    const userId = req.user.userId;
    const { email, name } = req.body;
    const customer = await stripeService_1.StripeService.createCustomer(email, name, {
        userId: userId.toString()
    });
    res.json({
        success: true,
        customerId: customer.id
    });
});
PaymentController.attachPaymentMethod = (0, errorHandler_1.asyncHandler)(async (req, res) => {
    const { customerId, paymentMethodId } = req.body;
    const paymentMethod = await stripeService_1.StripeService.attachPaymentMethod(customerId, paymentMethodId);
    res.json({
        success: true,
        paymentMethod
    });
});
PaymentController.listPaymentMethods = (0, errorHandler_1.asyncHandler)(async (req, res) => {
    const { customerId } = req.params;
    const type = req.query.type || 'card';
    const paymentMethods = await stripeService_1.StripeService.listPaymentMethods(customerId, type);
    res.json({
        success: true,
        paymentMethods
    });
});
PaymentController.createRefund = (0, errorHandler_1.asyncHandler)(async (req, res) => {
    const { paymentIntentId, amount } = req.body;
    const refund = await stripeService_1.StripeService.createRefund(paymentIntentId, amount);
    res.json({
        success: true,
        refund
    });
});
// Webhook event handlers
async function handlePaymentSuccess(paymentIntent) {
    logger_1.logger.info(`Payment succeeded for payment intent: ${paymentIntent.id}`);
    // Implement order fulfillment logic here
}
async function handlePaymentFailure(paymentIntent) {
    logger_1.logger.error(`Payment failed for payment intent: ${paymentIntent.id}`);
    // Implement failure handling logic here
}
async function handleSubscriptionCreated(subscription) {
    logger_1.logger.info(`Subscription created: ${subscription.id}`);
    // Implement subscription activation logic here
}
async function handleSubscriptionCanceled(subscription) {
    logger_1.logger.info(`Subscription canceled: ${subscription.id}`);
    // Implement subscription deactivation logic here
}
//# sourceMappingURL=paymentController.js.map