import { API_BASE_URL, DEV_AUTH } from '../config/api'
import type { Alert, DraftReport, Report } from '../types'

type CreateReportResponse = {
  message: string
  id: number
  status?: string | null
}

const authHeaders = () => ({
  'X-User-ID': DEV_AUTH.userId,
  'X-User-Role': DEV_AUTH.role,
})

async function readBody(response: Response) {
  const text = await response.text()
  if (!text) return null

  try {
    return JSON.parse(text)
  } catch {
    return text
  }
}

function extractError(body: unknown, status: number) {
  if (
    typeof body === 'object' &&
    body !== null &&
    'detail' in body
  ) {
    const detail = (body as { detail?: unknown }).detail

    if (Array.isArray(detail)) {
      return detail
        .map((item: any) => {
          const where = Array.isArray(item?.loc)
            ? item.loc.filter((part: unknown) => part !== 'query' && part !== 'body').join('.')
            : 'request'
          const message = item?.msg || 'Invalid value'
          return where ? `${where}: ${message}` : message
        })
        .join(' | ')
    }

    if (typeof detail === 'string') return detail

    try {
      return JSON.stringify(detail)
    } catch {
      return `HTTP ${status}`
    }
  }

  if (typeof body === 'string' && body.trim()) return body
  return `HTTP ${status}`
}

async function request<T>(
  url: string,
  options: RequestInit = {},
  authenticated = true,
): Promise<T> {
  const controller = new AbortController()
  const timeout = setTimeout(() => controller.abort(), 30000)

  try {
    const response = await fetch(url, {
      ...options,
      headers: {
        Accept: 'application/json',
        ...(authenticated ? authHeaders() : {}),
        ...((options.headers ?? {}) as Record<string, string>),
      },
      signal: controller.signal,
    })

    const body = await readBody(response)

    if (!response.ok) {
      throw new Error(extractError(body, response.status))
    }

    return body as T
  } catch (error) {
    if (error instanceof Error && error.name === 'AbortError') {
      throw new Error('Request timed out. Check that the phone and backend are on the same network.')
    }
    throw error
  } finally {
    clearTimeout(timeout)
  }
}

export function checkHealth() {
  return request(`${API_BASE_URL}/health`, {}, false)
}

export function getReports() {
  return request<Report[]>(`${API_BASE_URL}/reports/`)
}

export async function getReport(id: number) {
  const reports = await getReports()
  const report = reports.find((item) => item.id === id)

  if (!report) {
    throw new Error(`Report #${id} was not found on the backend.`)
  }

  return report
}

export async function getReportMedia(_id: number) {
  return []
}

export function getAlerts() {
  return request<Alert[]>(`${API_BASE_URL}/alerts/`)
}

export async function createReport(
  draft: DraftReport,
  idempotencyKey: string,
) {
  if (draft.latitude === null || draft.longitude === null) {
    throw new Error('Location is required before submitting the report.')
  }

  const params = [
    ['latitude', String(draft.latitude)],
    ['longitude', String(draft.longitude)],
    ['report_type', draft.reportType],
    ['description', draft.description || 'Citizen field report'],
  ]
    .map(([key, value]) => `${encodeURIComponent(key)}=${encodeURIComponent(value)}`)
    .join('&')

  return request<CreateReportResponse>(
    `${API_BASE_URL}/reports/?${params}`,
    {
      method: 'POST',
      headers: {
        'Idempotency-Key': idempotencyKey,
      },
    },
  )
}

export async function uploadReportImage(
  _reportId: number,
  _draft: DraftReport,
) {
  // The integrated backend currently has no report-media upload route.
  // Do not fail an otherwise successful citizen report because of that.
  return {
    skipped: true,
    reason: 'Backend media upload endpoint is not available yet.',
  }
}
