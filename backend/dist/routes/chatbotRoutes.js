"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const chatbotController_1 = require("../controllers/chatbotController");
const authMiddleware_1 = require("../middleware/authMiddleware");
const router = express_1.default.Router();
// All chatbot routes require authentication
router.use(authMiddleware_1.auth);
// Customer support routes
router.post('/support', chatbotController_1.ChatbotController.getCustomerSupport);
// Book recommendation routes
router.post('/recommendations', chatbotController_1.ChatbotController.getBookRecommendations);
// Book summary route
router.post('/summary', chatbotController_1.ChatbotController.getBookSummary);
// Review sentiment analysis route
router.post('/analyze-sentiment', chatbotController_1.ChatbotController.analyzeSentiment);
// Reading insights route
router.post('/reading-insights', chatbotController_1.ChatbotController.getReadingInsights);
exports.default = router;
//# sourceMappingURL=chatbotRoutes.js.map