export const HTTP_MESSAGES: Record<number, string> = {
  200: 'Request completed successfully',
  201: 'Resource created successfully',
  202: 'Request accepted for processing',
  204: 'Resource deleted successfully',
  400: 'The request could not be understood or was missing required parameters',
  401: 'Authentication is required or the provided credentials are invalid',
  403: 'You do not have permission to access this resource',
  404: 'The requested resource was not found',
  409: 'The request conflicts with the current state of the resource',
  410: 'The requested resource is no longer available',
  422: 'The request was well-formed but failed validation',
  429: 'Too many requests. Please try again later',
  500: 'An unexpected error occurred on the server',
  502: 'The upstream service returned an invalid response',
  503: 'The service is temporarily unavailable',
  504: 'The upstream service did not respond in time',
};

export const AUTH_SUCCESS_MESSAGES = {
  REGISTERED: 'Account created successfully',
  LOGGED_IN: 'Logged in successfully',
  LOGGED_OUT: 'Logged out successfully',
  TOKEN_REFRESHED: 'Access token refreshed successfully',
  PROFILE_FETCHED: 'Profile retrieved successfully',
  PASSWORD_CHANGED: 'Password changed successfully',
} as const;

export const USER_SUCCESS_MESSAGES = {
  PROFILE_FETCHED: 'Profile retrieved successfully',
  USER_FETCHED: 'User retrieved successfully',
  USERS_FETCHED: 'Users retrieved successfully',
  USER_UPDATED: 'User updated successfully',
  USER_DELETED: 'User deleted successfully',
} as const;

export const HEALTH_SUCCESS_MESSAGES = {
  HEALTHY: 'Service is healthy',
} as const;
