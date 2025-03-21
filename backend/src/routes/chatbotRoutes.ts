import express from 'express';
import { ChatbotController } from '../controllers/chatbotController';
import { auth } from '../middleware/authMiddleware';

const router = express.Router();

// All chatbot routes require authentication
router.use(auth);

// Customer support routes
router.post('/support', ChatbotController.getCustomerSupport);

// Book recommendation routes
router.post('/recommendations', ChatbotController.getBookRecommendations);

// Book summary route
router.post('/summary', ChatbotController.getBookSummary);

// Review sentiment analysis route
router.post('/analyze-sentiment', ChatbotController.analyzeSentiment);

// Reading insights route
router.post('/reading-insights', ChatbotController.getReadingInsights);

export default router;