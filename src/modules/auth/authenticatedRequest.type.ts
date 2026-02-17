import { Request } from 'express';
import { User, UserRole } from '../users/user.entity';

export type AuthenticatedRequest = { user: { userId: string; role: UserRole } };

export interface LocalAuthenticatedRequest extends Request {
  user: User;
}
