export type UserRole = 'admin' | 'user';

export interface UserAccount {
  id: string;
  name: string;
  email: string;
  password: string;
  role: UserRole;
  createdAt: string;
  status: 'active' | 'inactive';
  assignedVenue?: string;
  assignedCity?: string;
  lastLogin?: string;
}

export interface AuthSession {
  user: UserAccount;
  token: string;
  loginTime: string;
}
