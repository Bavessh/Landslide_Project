import AsyncStorage from '@react-native-async-storage/async-storage'
import * as Crypto from 'expo-crypto'
import * as FileSystem from 'expo-file-system/legacy'

import type {
  DraftReport,
  QueuedReport,
} from '../types'

const STORAGE_KEY = 'vortexa.pendingReports.v2'
const EVIDENCE_DIR =
  `${FileSystem.documentDirectory ?? ''}vortexa-evidence/`

async function ensureEvidenceDirectory() {
  if (!FileSystem.documentDirectory) return

  const info = await FileSystem.getInfoAsync(EVIDENCE_DIR)

  if (!info.exists) {
    await FileSystem.makeDirectoryAsync(
      EVIDENCE_DIR,
      { intermediates: true },
    )
  }
}

async function persistImage(
  localId: string,
  uri: string | null,
) {
  if (!uri || !FileSystem.documentDirectory) {
    return uri
  }

  await ensureEvidenceDirectory()

  const cleanUri = uri.split('?')[0]
  const extension =
    cleanUri.split('.').pop()?.toLowerCase() || 'jpg'

  const safeExtension =
    ['jpg', 'jpeg', 'png', 'webp'].includes(extension)
      ? extension
      : 'jpg'

  const destination =
    `${EVIDENCE_DIR}${localId}.${safeExtension}`

  if (uri === destination) {
    return uri
  }

  await FileSystem.copyAsync({
    from: uri,
    to: destination,
  })

  return destination
}

async function deleteImage(uri: string | null) {
  if (!uri || !uri.startsWith(EVIDENCE_DIR)) return

  try {
    const info = await FileSystem.getInfoAsync(uri)
    if (info.exists) {
      await FileSystem.deleteAsync(uri, {
        idempotent: true,
      })
    }
  } catch {
    // Queue cleanup must never crash the app.
  }
}

export async function getQueue(): Promise<QueuedReport[]> {
  const raw = await AsyncStorage.getItem(STORAGE_KEY)

  if (!raw) return []

  try {
    const parsed = JSON.parse(raw) as QueuedReport[]
    return Array.isArray(parsed) ? parsed : []
  } catch {
    return []
  }
}

async function saveQueue(items: QueuedReport[]) {
  await AsyncStorage.setItem(
    STORAGE_KEY,
    JSON.stringify(items),
  )
}

export async function enqueueReport(
  draft: DraftReport,
): Promise<QueuedReport> {
  const localId =
    `local-${Date.now()}-${Math.random()
      .toString(36)
      .slice(2, 8)}`

  const persistedImageUri =
    await persistImage(localId, draft.imageUri)

  const item: QueuedReport = {
    ...draft,
    imageUri: persistedImageUri,
    localId,
    idempotencyKey: Crypto.randomUUID(),
    createdAt: new Date().toISOString(),
    retryCount: 0,
    syncStatus: 'pending',
    lastError: null,
    serverReportId: null,
    mediaUploaded: false,
  }

  const queue = await getQueue()
  await saveQueue([...queue, item])

  return item
}

export async function updateQueuedReport(
  localId: string,
  patch: Partial<QueuedReport>,
) {
  const queue = await getQueue()

  const next = queue.map((item) =>
    item.localId === localId
      ? { ...item, ...patch }
      : item,
  )

  await saveQueue(next)
}

export async function getQueuedReport(
  localId: string,
) {
  const queue = await getQueue()
  return queue.find(
    (item) => item.localId === localId,
  ) ?? null
}

export async function removeQueuedReport(
  localId: string,
) {
  const queue = await getQueue()
  const target = queue.find(
    (item) => item.localId === localId,
  )

  await saveQueue(
    queue.filter(
      (item) => item.localId !== localId,
    ),
  )

  if (target) {
    await deleteImage(target.imageUri)
  }
}
