import express from 'express';
import { PaymentController } from '../controllers/paymentController';
import { auth } from '../middleware/authMiddleware';
import { asyncHandler } from '../utils/errorHandler';

const router = express.Router();

// Public webhook endpoint (needs to be raw body for signature verification)
router.post(
  '/webhook',
  express.raw({ type: 'application/json' }),
  PaymentController.handleWebhook
);

// Protected routes (require authentication)
router.use(auth);

// Payment intent routes
router.post('/create-payment-intent', PaymentController.createPaymentIntent);

// Customer routes
router.post('/customers', PaymentController.createCustomer);
router.post('/customers/:customerId/payment-methods', PaymentController.attachPaymentMethod);
router.get('/customers/:customerId/payment-methods', PaymentController.listPaymentMethods);

// Refund routes
router.post('/refunds', PaymentController.createRefund);

export default router;