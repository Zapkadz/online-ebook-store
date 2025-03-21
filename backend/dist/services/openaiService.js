"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.OpenAIService = void 0;
const openai_1 = require("openai");
const config_1 = __importDefault(require("../config/config"));
const logger_1 = require("../utils/logger");
const errorHandler_1 = require("../utils/errorHandler");
const configuration = new openai_1.Configuration({
    apiKey: config_1.default.openai.apiKey
});
const openai = new openai_1.OpenAIApi(configuration);
class OpenAIService {
    static async createCompletion(prompt, maxTokens = 150) {
        try {
            const response = await openai.createCompletion({
                model: 'gpt-3.5-turbo-instruct',
                prompt,
                max_tokens: maxTokens,
                temperature: 0.7,
                top_p: 1,
                frequency_penalty: 0,
                presence_penalty: 0
            });
            if (!response.data.choices[0].text) {
                throw new errorHandler_1.AppError(500, 'No response from OpenAI');
            }
            return response.data.choices[0].text.trim();
        }
        catch (error) {
            logger_1.logger.error('OpenAI API error:', error);
            throw new errorHandler_1.AppError(500, 'Failed to get AI response');
        }
    }
    static async getBookRecommendations(userPreferences) {
        var _a, _b, _c;
        const prompt = `Given a user's preferences:
      Favorite Genres: ${((_a = userPreferences.favoriteGenres) === null || _a === void 0 ? void 0 : _a.join(', ')) || 'Not specified'}
      Recently Read: ${((_b = userPreferences.recentlyRead) === null || _b === void 0 ? void 0 : _b.join(', ')) || 'Not specified'}
      Interests: ${((_c = userPreferences.interests) === null || _c === void 0 ? void 0 : _c.join(', ')) || 'Not specified'}

      Provide personalized book recommendations with brief explanations.`;
        return this.createCompletion(prompt, 200);
    }
    static async handleCustomerSupport(query, context) {
        var _a;
        const contextStr = context
            ? `\nContext:
         Order ID: ${context.orderId || 'Not specified'}
         Previous conversation: ${((_a = context.previousMessages) === null || _a === void 0 ? void 0 : _a.join('\n')) || 'None'}`
            : '';
        const prompt = `As a helpful e-book store assistant, respond to the following query:
      "${query}"
      ${contextStr}
      
      Provide a helpful, professional response.`;
        return this.createCompletion(prompt);
    }
    static async generateBookSummary(bookDetails) {
        const prompt = `Generate a concise summary for the following book:
      Title: ${bookDetails.title}
      Author: ${bookDetails.author}
      Genre: ${bookDetails.genre}
      Description: ${bookDetails.description}

      Provide a compelling summary that highlights key aspects of the book.`;
        return this.createCompletion(prompt, 150);
    }
    static async analyzeSentiment(reviews) {
        const prompt = `Analyze the sentiment of these book reviews:
      ${reviews.join('\n')}

      Provide:
      1. Overall sentiment (positive, negative, or mixed)
      2. Brief analysis of key themes and patterns`;
        const response = await this.createCompletion(prompt);
        const [sentiment, ...analysisLines] = response.split('\n');
        return {
            overallSentiment: sentiment,
            analysis: analysisLines.join('\n').trim()
        };
    }
    static async generateReadingInsights(readingHistory) {
        const prompt = `Based on this reading history:
      ${readingHistory.map(book => `- ${book.title} (${book.genre}): Completed ${book.completionDate}, Time spent: ${book.timeSpent} minutes`).join('\n')}

      Provide insights about reading patterns and suggestions for improvement.`;
        return this.createCompletion(prompt, 200);
    }
}
exports.OpenAIService = OpenAIService;
//# sourceMappingURL=openaiService.js.map