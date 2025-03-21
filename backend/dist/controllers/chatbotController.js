"use strict";
var _a;
Object.defineProperty(exports, "__esModule", { value: true });
exports.ChatbotController = void 0;
const zod_1 = require("zod");
const openaiService_1 = require("../services/openaiService");
const errorHandler_1 = require("../utils/errorHandler");
const querySchema = zod_1.z.object({
    message: zod_1.z.string().min(1),
    orderId: zod_1.z.string().optional(),
    context: zod_1.z.array(zod_1.z.string()).optional()
});
const recommendationSchema = zod_1.z.object({
    favoriteGenres: zod_1.z.array(zod_1.z.string()).optional(),
    recentlyRead: zod_1.z.array(zod_1.z.string()).optional(),
    interests: zod_1.z.array(zod_1.z.string()).optional()
});
const historySchema = zod_1.z.object({
    readingHistory: zod_1.z.array(zod_1.z.object({
        title: zod_1.z.string(),
        genre: zod_1.z.string(),
        completionDate: zod_1.z.string(),
        timeSpent: zod_1.z.number()
    }))
});
class ChatbotController {
}
exports.ChatbotController = ChatbotController;
_a = ChatbotController;
ChatbotController.getCustomerSupport = (0, errorHandler_1.asyncHandler)(async (req, res) => {
    const validatedData = querySchema.parse(req.body);
    const response = await openaiService_1.OpenAIService.handleCustomerSupport(validatedData.message, {
        orderId: validatedData.orderId,
        previousMessages: validatedData.context
    });
    res.json({
        success: true,
        message: response
    });
});
ChatbotController.getBookRecommendations = (0, errorHandler_1.asyncHandler)(async (req, res) => {
    const validatedData = recommendationSchema.parse(req.body);
    const recommendations = await openaiService_1.OpenAIService.getBookRecommendations({
        favoriteGenres: validatedData.favoriteGenres,
        recentlyRead: validatedData.recentlyRead,
        interests: validatedData.interests
    });
    res.json({
        success: true,
        recommendations
    });
});
ChatbotController.getBookSummary = (0, errorHandler_1.asyncHandler)(async (req, res) => {
    const { title, author, genre, description } = req.body;
    const summary = await openaiService_1.OpenAIService.generateBookSummary({
        title,
        author,
        genre,
        description
    });
    res.json({
        success: true,
        summary
    });
});
ChatbotController.analyzeSentiment = (0, errorHandler_1.asyncHandler)(async (req, res) => {
    const { reviews } = req.body;
    if (!Array.isArray(reviews) || reviews.length === 0) {
        res.status(400).json({
            success: false,
            message: 'Reviews array is required'
        });
        return;
    }
    const analysis = await openaiService_1.OpenAIService.analyzeSentiment(reviews);
    res.json({
        success: true,
        ...analysis
    });
});
ChatbotController.getReadingInsights = (0, errorHandler_1.asyncHandler)(async (req, res) => {
    const validatedData = historySchema.parse(req.body);
    const insights = await openaiService_1.OpenAIService.generateReadingInsights(validatedData.readingHistory);
    res.json({
        success: true,
        insights
    });
});
//# sourceMappingURL=chatbotController.js.map