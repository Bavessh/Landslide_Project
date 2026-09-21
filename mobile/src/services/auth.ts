import { DEV_AUTH } from '../config/api'

export function getAuthHeaders() {
  return {
    'X-User-ID': DEV_AUTH.userId,
    'X-User-Role': DEV_AUTH.role,
  }
}
