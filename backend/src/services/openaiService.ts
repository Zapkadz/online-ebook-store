import { Configuration, OpenAIApi } from 'openai';
import config from '../config/config';
import { logger } from '../utils/logger';
import { AppError } from '../utils/errorHandler';

const configuration = new Configuration({
  apiKey: config.openai.apiKey
});

const openai = new OpenAIApi(configuration);

export class OpenAIService {
  private static async createCompletion(prompt: string, maxTokens: number = 150): Promise<string> {
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
        throw new AppError(500, 'No response from OpenAI');
      }

      return response.data.choices[0].text.trim();
    } catch (error) {
      logger.error('OpenAI API error:', error);
      throw new AppError(500, 'Failed to get AI response');
    }
  }

  public static async getBookRecommendations(
    userPreferences: {
      favoriteGenres?: string[];
      recentlyRead?: string[];
      interests?: string[];
    }
  ): Promise<string> {
    const prompt = `Given a user's preferences:
      Favorite Genres: ${userPreferences.favoriteGenres?.join(', ') || 'Not specified'}
      Recently Read: ${userPreferences.recentlyRead?.join(', ') || 'Not specified'}
      Interests: ${userPreferences.interests?.join(', ') || 'Not specified'}

      Provide personalized book recommendations with brief explanations.`;

    return this.createCompletion(prompt, 200);
  }

  public static async handleCustomerSupport(
    query: string,
    context?: {
      orderId?: string;
      previousMessages?: string[];
    }
  ): Promise<string> {
    const contextStr = context
      ? `\nContext:
         Order ID: ${context.orderId || 'Not specified'}
         Previous conversation: ${context.previousMessages?.join('\n') || 'None'}`
      : '';

    const prompt = `As a helpful e-book store assistant, respond to the following query:
      "${query}"
      ${contextStr}
      
      Provide a helpful, professional response.`;

    return this.createCompletion(prompt);
  }

  public static async generateBookSummary(
    bookDetails: {
      title: string;
      author: string;
      genre: string;
      description: string;
    }
  ): Promise<string> {
    const prompt = `Generate a concise summary for the following book:
      Title: ${bookDetails.title}
      Author: ${bookDetails.author}
      Genre: ${bookDetails.genre}
      Description: ${bookDetails.description}

      Provide a compelling summary that highlights key aspects of the book.`;

    return this.createCompletion(prompt, 150);
  }

  public static async analyzeSentiment(reviews: string[]): Promise<{
    overallSentiment: string;
    analysis: string;
  }> {
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

  public static async generateReadingInsights(
    readingHistory: {
      title: string;
      genre: string;
      completionDate: string;
      timeSpent: number;
    }[]
  ): Promise<string> {
    const prompt = `Based on this reading history:
      ${readingHistory.map(book => 
        `- ${book.title} (${book.genre}): Completed ${book.completionDate}, Time spent: ${book.timeSpent} minutes`
      ).join('\n')}

      Provide insights about reading patterns and suggestions for improvement.`;

    return this.createCompletion(prompt, 200);
  }
}