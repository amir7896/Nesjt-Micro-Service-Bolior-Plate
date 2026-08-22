export const AUTH_PATTERNS = {
  REGISTER: 'auth.register',
  LOGIN: 'auth.login',
  REFRESH: 'auth.refresh',
  LOGOUT: 'auth.logout',
  VALIDATE: 'auth.validate',
  ME: 'auth.me',
  CHANGE_PASSWORD: 'auth.change_password',
  DEACTIVATE: 'auth.deactivate',
} as const;

export const USER_PATTERNS = {
  CREATE_PROFILE: 'user.create_profile',
  FIND_ALL: 'user.find_all',
  FIND_ONE: 'user.find_one',
  FIND_BY_USER_ID: 'user.find_by_user_id',
  UPDATE: 'user.update',
  REMOVE: 'user.remove',
} as const;
