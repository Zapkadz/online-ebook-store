import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { UserModel } from '../models/userModel';

interface JwtPayload {
  userId: number;
  email: string;
}

declare global {
  namespace Express {
    interface Request {
      user?: JwtPayload;
    }
  }
}

export const auth = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const authHeader = req.headers.authorization;
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ message: 'Authorization token required' });
    }

    const token = authHeader.split(' ')[1];
    const decoded = jwt.verify(
      token,
      process.env.JWT_SECRET || 'your-fallback-secret'
    ) as JwtPayload;

    // Verify user exists
    const user = await UserModel.findById(decoded.userId);
    if (!user) {
      return res.status(401).json({ message: 'User no longer exists' });
    }

    if (!user.is_active) {
      return res.status(403).json({ message: 'User account is inactive' });
    }

    // Add user info to request
    req.user = decoded;
    next();
  } catch (error) {
    if (error instanceof jwt.JsonWebTokenError) {
      return res.status(401).json({ message: 'Invalid token' });
    }
    
    console.error('Auth middleware error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};

export const adminAuth = async (req: Request, res: Response, next: NextFunction) => {
  try {
    // First apply regular authentication
    auth(req, res, async () => {
      if (!req.user) {
        return res.status(401).json({ message: 'Authentication required' });
      }

      // Check if user is admin
      const user = await UserModel.findById(req.user.userId);
      if (!user || user.role !== 'Admin') {
        return res.status(403).json({ message: 'Admin privileges required' });
      }

      next();
    });
  } catch (error) {
    console.error('Admin auth middleware error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};