import { Request, Response } from 'express';
import { z } from 'zod';
import { OpenAIService } from '../services/openaiService';
import { logger } from '../utils/logger';
import { asyncHandler } from '../utils/errorHandler';

const querySchema = z.object({
  message: z.string().min(1),
  orderId: z.string().optional(),
  context: z.array(z.string()).optional()
});

const recommendationSchema = z.object({
  favoriteGenres: z.array(z.string()).optional(),
  recentlyRead: z.array(z.string()).optional(),
  interests: z.array(z.string()).optional()
});

const historySchema = z.object({
  readingHistory: z.array(z.object({
    title: z.string(),
    genre: z.string(),
    completionDate: z.string(),
    timeSpent: z.number()
  }))
});

export class ChatbotController {
  static getCustomerSupport = asyncHandler(async (req: Request, res: Response) => {
    const validatedData = querySchema.parse(req.body);
    
    const response = await OpenAIService.handleCustomerSupport(
      validatedData.message,
      {
        orderId: validatedData.orderId,
        previousMessages: validatedData.context
      }
    );

    res.json({
      success: true,
      message: response
    });
  });

  static getBookRecommendations = asyncHandler(async (req: Request, res: Response) => {
    const validatedData = recommendationSchema.parse(req.body);
    
    const recommendations = await OpenAIService.getBookRecommendations({
      favoriteGenres: validatedData.favoriteGenres,
      recentlyRead: validatedData.recentlyRead,
      interests: validatedData.interests
    });

    res.json({
      success: true,
      recommendations
    });
  });

  static getBookSummary = asyncHandler(async (req: Request, res: Response) => {
    const { title, author, genre, description } = req.body;
    
    const summary = await OpenAIService.generateBookSummary({
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

  static analyzeSentiment = asyncHandler(async (req: Request, res: Response) => {
    const { reviews } = req.body;
    
    if (!Array.isArray(reviews) || reviews.length === 0) {
      res.status(400).json({
        success: false,
        message: 'Reviews array is required'
      });
      return;
    }

    const analysis = await OpenAIService.analyzeSentiment(reviews);

    res.json({
      success: true,
      ...analysis
    });
  });

  static getReadingInsights = asyncHandler(async (req: Request, res: Response) => {
    const validatedData = historySchema.parse(req.body);
    
    const insights = await OpenAIService.generateReadingInsights(
      validatedData.readingHistory
    );

    res.json({
      success: true,
      insights
    });
  });

  // Error handling is managed by the asyncHandler wrapper
}