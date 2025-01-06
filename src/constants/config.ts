export const CONFIG = {
  API: {
    PREFIX: '/api',
    VERSION: 'v1',
  },
  SECURITY: {
    HEADERS: {
      NOSNIFF: 'nosniff',
      FRAME_OPTIONS: 'deny',
      XSS_PROTECTION: '1; mode=block',
    }
  }
} as const; 