export type ApiEnvelope<T> = {
  success: boolean;
  statusCode: number;
  message: string;
  data: T;
  meta?: Record<string, unknown>;
  timestamp?: string;
  path?: string;
};

export type AuthUser = {
  id: string;
  email: string;
  role: string;
  isActive: boolean;
  isEmailVerified: boolean;
  createdAt: string;
  updatedAt: string;
};

export type TokenPair = {
  accessToken: string;
  refreshToken: string;
  tokenType: string;
  expiresIn: string;
};

export type AuthResult = {
  user: AuthUser;
  tokens: TokenPair;
};

export type UserProfile = {
  id: string;
  userId: string;
  email: string;
  firstName: string;
  lastName: string;
  phone: string | null;
  bio: string | null;
  avatar: string | null;
  dateOfBirth: string | null;
  createdAt: string;
  updatedAt: string;
};

export type ConversationMember = {
  userId: string;
  role: string;
  joinedAt: string;
  lastReadAt: string | null;
  status: 'online' | 'offline';
  lastSeenAt: string | null;
};

export type ChatMessage = {
  id: string;
  conversationId: string;
  senderId: string;
  body: string;
  type: string;
  seenBy: string[];
  createdAt: string;
};

export type Conversation = {
  id: string;
  type: 'private' | 'group';
  name: string | null;
  createdBy: string;
  lastMessageAt: string | null;
  lastReadAt: string | null;
  unreadCount: number;
  members: ConversationMember[];
  createdAt: string;
  updatedAt: string;
};

export type Paginated<T> = {
  items: T[];
  meta: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
    hasNextPage: boolean;
    hasPreviousPage: boolean;
  };
};

export type Presence = {
  userId: string;
  status: 'online' | 'offline';
  lastSeenAt: string | null;
};

export type SeenResult = {
  conversationId: string;
  userId: string;
  lastReadAt: string;
  messageId: string | null;
};
