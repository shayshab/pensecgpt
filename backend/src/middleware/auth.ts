import { Request, Response, NextFunction } from 'express';
import { createSupabaseClient } from '../config/database';

export interface AuthRequest extends Request {
  user?: {
    id: string;
    email?: string;
  };
}

export const authenticate = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  // Skip authentication in development mode (for testing)
  if (process.env.NODE_ENV === 'development') {
    // Use a mock user with a valid UUID format for development
    // This is a fixed UUID that we'll use for all dev requests
    req.user = {
      id: '00000000-0000-0000-0000-000000000001',
      email: 'dev@example.com',
    };
    return next();
  }

  try {
    const authHeader = req.headers.authorization;
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ error: 'Missing or invalid authorization header' });
    }

    const token = authHeader.substring(7);
    const supabase = createSupabaseClient(token);

    const { data: { user }, error } = await supabase.auth.getUser();

    if (error || !user) {
      return res.status(401).json({ error: 'Invalid or expired token' });
    }

    req.user = {
      id: user.id,
      email: user.email,
    };

    next();
  } catch (error) {
    console.error('Authentication error:', error);
    return res.status(401).json({ error: 'Authentication failed' });
  }
};

