import {
  useCallback,
  useState,
} from 'react'
import {
  Pressable,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
} from 'react-native'
import { useFocusEffect } from '@react-navigation/native'

import type {
  QueuedReport,
  Report,
} from '../types'

import {
  getReport,
  getReportMedia,
  getReports,
} from '../services/module8'

import { getQueue } from '../storage/queue'
import {
  syncPendingReports,
  syncQueuedReport,
} from '../sync/syncEngine'

import {
  Button,
  Card,
  Page,
  colors,
} from '../components/UI'

export default function ReportsScreen() {
  const [reports, setReports] =
    useState<Report[]>([])
  const [queue, setQueue] =
    useState<QueuedReport[]>([])

  const [selected, setSelected] =
    useState<Report | null>(null)

  const [mediaCount, setMediaCount] =
    useState<number | null>(null)

  const [refreshing, setRefreshing] =
    useState(false)

  const [error, setError] =
    useState('')

  const load = useCallback(async () => {
    setRefreshing(true)
    setError('')

    try {
      const [remote, local] =
        await Promise.all([
          getReports(),
          getQueue(),
        ])

      setReports(
        Array.isArray(remote)
          ? remote
          : [],
      )

      setQueue(local)
    } catch (e) {
      setError(
        e instanceof Error
          ? e.message
          : String(e),
      )
    } finally {
      setRefreshing(false)
    }
  }, [])

  useFocusEffect(
    useCallback(() => {
      void load()
    }, [load]),
  )

  async function openReport(
    id: number,
  ) {
    try {
      const [detail, media] =
        await Promise.all([
          getReport(id),
          getReportMedia(id)
            .catch(() => []),
        ])

      setSelected(detail)
      setMediaCount(
        Array.isArray(media)
          ? media.length
          : 0,
      )
    } catch (e) {
      setError(
        e instanceof Error
          ? e.message
          : String(e),
      )
    }
  }

  async function retryOne(
    localId: string,
  ) {
    await syncQueuedReport(localId)
    await load()
  }

  async function retryAll() {
    await syncPendingReports()
    await load()
  }

  return (
    <ScrollView
      style={styles.root}
      contentContainerStyle={styles.content}
      refreshControl={
        <RefreshControl
          refreshing={refreshing}
          onRefresh={load}
        />
      }
    >
      <Page
        eyebrow="VORTEXA / REPORTS"
        title="My Reports"
        subtitle="Submitted citizen reports and offline synchronization status."
      >
        {!!error && (
          <Card>
            <Text style={styles.error}>
              {error}
            </Text>
          </Card>
        )}

        {queue.length > 0 && (
          <>
            <Text style={styles.section}>
              PENDING UPLOADS
            </Text>

            <Button
              label="RETRY ALL"
              onPress={retryAll}
            />

            {queue.map((item) => (
              <Card key={item.localId}>
                <Text style={styles.pending}>
                  {item.syncStatus
                    .replaceAll('_', ' ')
                    .toUpperCase()}
                </Text>

                <Text style={styles.title}>
                  {item.reportType}
                </Text>

                <Text style={styles.meta}>
                  retries: {item.retryCount}
                </Text>

                {!!item.serverReportId && (
                  <Text style={styles.meta}>
                    Server report: #
                    {item.serverReportId}
                  </Text>
                )}

                {!!item.lastError && (
                  <Text style={styles.error}>
                    {item.lastError}
                  </Text>
                )}

                <Button
                  label="RETRY"
                  onPress={() =>
                    void retryOne(
                      item.localId,
                    )
                  }
                  secondary
                />
              </Card>
            ))}
          </>
        )}

        <Text style={styles.section}>
          BACKEND REPORTS
        </Text>

        {reports.map((report) => (
          <Pressable
            key={report.id}
            onPress={() =>
              void openReport(report.id)
            }
            style={styles.touchCard}
          >
            <Text style={styles.status}>
              {(report.status || 'UNKNOWN')
                .toUpperCase()}
            </Text>

            <Text style={styles.title}>
              #{report.id}{' '}
              {report.report_type}
            </Text>

            <Text style={styles.meta}>
              {report.severity ||
                'severity unavailable'}
            </Text>

            <Text style={styles.description}>
              {report.description ||
                'No description'}
            </Text>
          </Pressable>
        ))}

        {!refreshing &&
          reports.length === 0 &&
          queue.length === 0 &&
          !error && (
            <Card>
              <Text style={styles.description}>
                No reports available.
              </Text>
            </Card>
          )}

        {selected && (
          <>
            <Text style={styles.section}>
              REPORT DETAILS
            </Text>

            <Card>
              <Text style={styles.detailHeading}>
                REPORT #{selected.id}
              </Text>

              <Text style={styles.detail}>
                Type: {selected.report_type}
              </Text>

              <Text style={styles.detail}>
                Status:{' '}
                {selected.status ||
                  'Unavailable'}
              </Text>

              <Text style={styles.detail}>
                Severity:{' '}
                {selected.severity ||
                  'Unavailable'}
              </Text>

              <Text style={styles.detail}>
                Location:{' '}
                {selected.latitude},{' '}
                {selected.longitude}
              </Text>

              <Text style={styles.detail}>
                GPS accuracy:{' '}
                {selected.gps_accuracy ??
                  'Unavailable'}
              </Text>

              <Text style={styles.detail}>
                Images:{' '}
                {mediaCount ??
                  'Unavailable'}
              </Text>

              <Text style={styles.detail}>
                Description:{' '}
                {selected.description ||
                  'None'}
              </Text>

              {!!selected
                .verification_notes && (
                <Text style={styles.detail}>
                  Verification:{' '}
                  {
                    selected
                      .verification_notes
                  }
                </Text>
              )}
            </Card>
          </>
        )}
      </Page>
    </ScrollView>
  )
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: colors.background,
  },
  content: {
    padding: 20,
    paddingBottom: 40,
  },
  section: {
    color: colors.muted,
    fontSize: 10,
    fontWeight: '900',
    letterSpacing: 1,
    marginTop: 10,
    marginBottom: 8,
  },
  touchCard: {
    backgroundColor: colors.card,
    borderColor: colors.border,
    borderWidth: 1,
    borderRadius: 7,
    padding: 16,
    marginBottom: 12,
  },
  pending: {
    color: colors.amber,
    fontSize: 10,
    fontWeight: '900',
  },
  status: {
    color: colors.cyan,
    fontSize: 10,
    fontWeight: '900',
  },
  title: {
    color: colors.text,
    fontSize: 17,
    fontWeight: '800',
    marginTop: 5,
  },
  meta: {
    color: colors.muted,
    marginTop: 5,
  },
  description: {
    color: colors.muted,
    marginTop: 8,
    lineHeight: 20,
  },
  error: {
    color: colors.red,
    marginTop: 7,
  },
  detailHeading: {
    color: colors.cyan,
    fontWeight: '900',
    marginBottom: 8,
  },
  detail: {
    color: colors.text,
    marginTop: 6,
    lineHeight: 20,
  },
})
