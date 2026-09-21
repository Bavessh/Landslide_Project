export const BACKEND_BASE_URL =
  (process.env.EXPO_PUBLIC_API_BASE_URL || 'http://192.168.1.11:8000')
    .replace(/\/+$/, '')

export const API_BASE_URL = `${BACKEND_BASE_URL}/api/v1`

export const DEV_AUTH = {
  userId: process.env.EXPO_PUBLIC_DEV_USER_ID || '1',
  role: 'citizen',
}
