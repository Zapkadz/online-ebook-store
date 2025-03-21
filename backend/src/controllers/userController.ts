import { Request, Response } from 'express';
import { UserModel } from '../models/userModel';
import jwt from 'jsonwebtoken';
import { z } from 'zod';

const registerSchema = z.object({
  email: z.string().email(),
  password: z.string().min(6),
  full_name: z.string().min(2),
  profile_picture_url: z.string().url().optional()
});

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string()
});

export class UserController {
  static async register(req: Request, res: Response) {
    try {
      const validatedData = registerSchema.parse(req.body);
      
      // Check if user already exists
      const existingUser = await UserModel.findByEmail(validatedData.email);
      if (existingUser) {
        return res.status(400).json({ message: 'Email already registered' });
      }

      // Create new user
      const userId = await UserModel.create(validatedData);
      
      // Generate JWT token
      const token = jwt.sign(
        { userId, email: validatedData.email },
        process.env.JWT_SECRET || 'your-fallback-secret',
        { expiresIn: '24h' }
      );

      res.status(201).json({
        message: 'User registered successfully',
        token,
        userId
      });
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({
          message: 'Validation error',
          errors: error.errors
        });
      }
      
      console.error('Registration error:', error);
      res.status(500).json({ message: 'Internal server error' });
    }
  }

  static async login(req: Request, res: Response) {
    try {
      const validatedData = loginSchema.parse(req.body);
      
      // Find user by email
      const user = await UserModel.findByEmail(validatedData.email);
      if (!user) {
        return res.status(401).json({ message: 'Invalid credentials' });
      }

      // Verify password
      const isValidPassword = await UserModel.validatePassword(
        user,
        validatedData.password
      );
      
      if (!isValidPassword) {
        return res.status(401).json({ message: 'Invalid credentials' });
      }

      // Update last login
      await UserModel.updateLastLogin(user.user_id);

      // Generate JWT token
      const token = jwt.sign(
        { userId: user.user_id, email: user.email },
        process.env.JWT_SECRET || 'your-fallback-secret',
        { expiresIn: '24h' }
      );

      res.json({
        message: 'Login successful',
        token,
        user: {
          id: user.user_id,
          email: user.email,
          full_name: user.full_name,
          role: user.role
        }
      });
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({
          message: 'Validation error',
          errors: error.errors
        });
      }
      
      console.error('Login error:', error);
      res.status(500).json({ message: 'Internal server error' });
    }
  }

  static async getProfile(req: Request, res: Response) {
    try {
      const userId = (req as any).user.userId; // Set by auth middleware
      const user = await UserModel.findById(userId);
      
      if (!user) {
        return res.status(404).json({ message: 'User not found' });
      }

      res.json({
        user: {
          id: user.user_id,
          email: user.email,
          full_name: user.full_name,
          profile_picture_url: user.profile_picture_url,
          role: user.role,
          created_at: user.created_at,
          last_login: user.last_login
        }
      });
    } catch (error) {
      console.error('Get profile error:', error);
      res.status(500).json({ message: 'Internal server error' });
    }
  }

  static async updateProfile(req: Request, res: Response) {
    try {
      const userId = (req as any).user.userId; // Set by auth middleware
      const updateSchema = z.object({
        full_name: z.string().min(2).optional(),
        profile_picture_url: z.string().url().optional()
      });

      const validatedData = updateSchema.parse(req.body);
      const success = await UserModel.updateProfile(userId, validatedData);

      if (!success) {
        return res.status(400).json({ message: 'No updates provided' });
      }

      res.json({ message: 'Profile updated successfully' });
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({
          message: 'Validation error',
          errors: error.errors
        });
      }
      
      console.error('Update profile error:', error);
      res.status(500).json({ message: 'Internal server error' });
    }
  }
}