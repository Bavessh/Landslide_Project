import NetInfo from '@react-native-community/netinfo'

import {
  createReport,
  uploadReportImage,
} from '../services/module8'

import {
  getQueue,
  getQueuedReport,
  removeQueuedReport,
  updateQueuedReport,
} from '../storage/queue'

export async function syncQueuedReport(
  localId: string,
) {
  const network = await NetInfo.fetch()

  if (!network.isConnected) {
    return {
      uploaded: false,
      offline: true,
      reportId: null as number | null,
    }
  }

  let item = await getQueuedReport(localId)

  if (!item) {
    return {
      uploaded: true,
      offline: false,
      reportId: null as number | null,
    }
  }

  await updateQueuedReport(localId, {
    syncStatus: 'syncing',
    lastError: null,
  })

  try {
    let reportId = item.serverReportId

    if (!reportId) {
      const report = await createReport(
        item,
        item.idempotencyKey,
      )

      reportId = report.id

      await updateQueuedReport(localId, {
        serverReportId: reportId,
      })
    }

    item = await getQueuedReport(localId)

    if (
      item &&
      item.imageUri &&
      !item.mediaUploaded
    ) {
      await uploadReportImage(
        reportId,
        item,
      )

      await updateQueuedReport(localId, {
        mediaUploaded: true,
      })
    }

    await updateQueuedReport(localId, {
      syncStatus: 'uploaded',
      lastError: null,
    })

    await removeQueuedReport(localId)

    return {
      uploaded: true,
      offline: false,
      reportId,
    }
  } catch (error) {
    const current = await getQueuedReport(localId)

    await updateQueuedReport(localId, {
      syncStatus: 'failed',
      retryCount:
        (current?.retryCount ?? 0) + 1,
      lastError:
        error instanceof Error
          ? error.message
          : String(error),
    })

    return {
      uploaded: false,
      offline: false,
      reportId:
        current?.serverReportId ?? null,
    }
  }
}

export async function syncPendingReports() {
  const network = await NetInfo.fetch()

  if (!network.isConnected) {
    return {
      synced: 0,
      failed: 0,
      offline: true,
    }
  }

  const queue = await getQueue()
  let synced = 0
  let failed = 0

  // Sequential by design: oldest queued item first.
  for (const item of queue) {
    const result =
      await syncQueuedReport(item.localId)

    if (result.uploaded) {
      synced += 1
    } else if (!result.offline) {
      failed += 1
    }
  }

  return {
    synced,
    failed,
    offline: false,
  }
}
