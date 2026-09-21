import { useState } from 'react'
import {
  ScrollView,
  StyleSheet,
  Text,
} from 'react-native'

import {
  BACKEND_BASE_URL,
  DEV_AUTH,
} from '../config/api'

import { checkHealth } from '../services/module8'
import { getQueue } from '../storage/queue'
import {
  syncPendingReports,
} from '../sync/syncEngine'

import {
  Button,
  Card,
  Page,
  colors,
} from '../components/UI'

export default function SettingsScreen() {
  const [health, setHealth] =
    useState('NOT CHECKED')

  const [queueCount, setQueueCount] =
    useState<number | null>(null)

  const [syncResult, setSyncResult] =
    useState('')

  const fieldOfficer =
    DEV_AUTH.role === 'field_officer'

  async function check() {
    setHealth('CHECKING...')

    try {
      await checkHealth()
      setHealth('CONNECTED')
    } catch {
      setHealth('FAILED')
    }

    setQueueCount(
      (await getQueue()).length,
    )
  }

  async function sync() {
    setSyncResult('SYNCING...')

    const result =
      await syncPendingReports()

    setSyncResult(
      result.offline
        ? 'OFFLINE — WAITING FOR NETWORK'
        : `SYNCED ${result.synced}, FAILED ${result.failed}`,
    )

    setQueueCount(
      (await getQueue()).length,
    )
  }

  return (
    <ScrollView
      style={styles.root}
      contentContainerStyle={styles.content}
    >
      <Page
        eyebrow="VORTEXA / SETTINGS"
        title="Mobile System"
        subtitle="Backend connectivity, offline queue and citizen mobile settings."
      >
        <Card>
          <Text style={styles.label}>
            BACKEND
          </Text>

          <Text style={styles.value}>
            {BACKEND_BASE_URL}
          </Text>

          <Text style={styles.state}>
            {health}
          </Text>

          <Button
            label="CHECK BACKEND"
            onPress={check}
          />
        </Card>

        <Card>
          <Text style={styles.label}>
            IDENTITY
          </Text>

          <Text style={styles.value}>
            User ID: {DEV_AUTH.userId}
          </Text>

          <Text style={styles.value}>
            Role: {DEV_AUTH.role}
          </Text>

          {fieldOfficer && (
            <Text style={styles.field}>
              FIELD OFFICER MODE ACTIVE. Field evidence workflows are enabled; authority-only alert controls remain unavailable.
            </Text>
          )}
        </Card>

        <Card>
          <Text style={styles.label}>
            OFFLINE QUEUE
          </Text>

          <Text style={styles.value}>
            Pending:{' '}
            {queueCount ??
              'Not checked'}
          </Text>

          {!!syncResult && (
            <Text style={styles.state}>
              {syncResult}
            </Text>
          )}

          <Button
            label="SYNC NOW"
            onPress={sync}
          />
        </Card>
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
  label: {
    color: colors.muted,
    fontSize: 10,
    fontWeight: '900',
    marginBottom: 7,
  },
  value: {
    color: colors.text,
    marginBottom: 6,
  },
  state: {
    color: colors.cyan,
    fontWeight: '900',
    marginTop: 7,
  },
  field: {
    color: colors.green,
    lineHeight: 20,
    marginTop: 10,
    fontWeight: '700',
  },
})
