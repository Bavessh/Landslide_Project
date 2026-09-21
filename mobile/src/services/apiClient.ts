import { API_BASE_URL } from '../config/api'
import { getAuthHeaders } from './auth'

export async function checkHealth() {
  const response = await fetch(`${API_BASE_URL}/health`)
  if (!response.ok) throw new Error(`HTTP ${response.status}`)
  return response.json()
}

export async function checkReports() {
  const response = await fetch(`${API_BASE_URL}/reports/`, {
    headers: getAuthHeaders(),
  })

  if (!response.ok) throw new Error(`HTTP ${response.status}`)
  return response.json()
}
