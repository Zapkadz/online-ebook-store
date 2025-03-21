"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const paymentController_1 = require("../controllers/paymentController");
const authMiddleware_1 = require("../middleware/authMiddleware");
const router = express_1.default.Router();
// Public webhook endpoint (needs to be raw body for signature verification)
router.post('/webhook', express_1.default.raw({ type: 'application/json' }), paymentController_1.PaymentController.handleWebhook);
// Protected routes (require authentication)
router.use(authMiddleware_1.auth);
// Payment intent routes
router.post('/create-payment-intent', paymentController_1.PaymentController.createPaymentIntent);
// Customer routes
router.post('/customers', paymentController_1.PaymentController.createCustomer);
router.post('/customers/:customerId/payment-methods', paymentController_1.PaymentController.attachPaymentMethod);
router.get('/customers/:customerId/payment-methods', paymentController_1.PaymentController.listPaymentMethods);
// Refund routes
router.post('/refunds', paymentController_1.PaymentController.createRefund);
exports.default = router;
//# sourceMappingURL=paymentRoutes.js.map