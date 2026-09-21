export type Report = {
  id: number
  reported_by?: number
  report_type: string
  description?: string | null
  latitude: number
  longitude: number
  location_source?: string | null
  capture_time?: string | null
  gps_accuracy?: number | null
  severity?: string | null
  status?: string | null
  created_at?: string
  updated_at?: string
  verification_notes?: string | null
}

export type Alert = {
  id: number
  title?: string | null
  message?: string | null
  description?: string | null
  severity?: string | null
  status?: string | null
  latitude?: number | null
  longitude?: number | null
  created_at?: string | null
  issued_at?: string | null
}

export type DraftReport = {
  reportType: string
  description: string
  severity: string
  latitude: number | null
  longitude: number | null
  gpsAccuracy: number | null
  locationSource: 'device_gps' | 'manual'
  captureTime: string
  imageUri: string | null
}

export type QueueStatus =
  | 'pending'
  | 'syncing'
  | 'uploaded'
  | 'failed'

export type QueuedReport = DraftReport & {
  localId: string
  idempotencyKey: string
  createdAt: string
  retryCount: number
  syncStatus: QueueStatus
  lastError: string | null
  serverReportId: number | null
  mediaUploaded: boolean
}
