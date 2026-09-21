import {
  useCallback,
  useState,
} from 'react'
import {
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
} from 'react-native'
import { useFocusEffect } from '@react-navigation/native'

import type { Alert } from '../types'
import { getAlerts } from '../services/module8'
import {
  Card,
  Page,
  colors,
} from '../components/UI'

export default function WarningsScreen() {
  const [alerts, setAlerts] =
    useState<Alert[]>([])
  const [refreshing, setRefreshing] =
    useState(false)
  const [error, setError] =
    useState('')

  const load = useCallback(async () => {
    setRefreshing(true)
    setError('')

    try {
      const data = await getAlerts()
      setAlerts(
        Array.isArray(data) ? data : [],
      )
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
        eyebrow="VORTEXA / WARNINGS"
        title="Public Warnings"
        subtitle="Official public warning information from the landslide monitoring backend."
      >
        {!!error && (
          <Card>
            <Text style={styles.error}>
              Warning feed unavailable
            </Text>
            <Text style={styles.message}>
              {error}
            </Text>
          </Card>
        )}

        {alerts.map((alert) => (
          <Card key={alert.id}>
            <Text style={styles.severity}>
              {(alert.severity || 'WARNING')
                .toUpperCase()}
            </Text>

            <Text style={styles.title}>
              {alert.title ||
                `Alert #${alert.id}`}
            </Text>

            <Text style={styles.message}>
              {alert.message ||
                alert.description ||
                'No public alert message supplied.'}
            </Text>

            <Text style={styles.status}>
              Status:{' '}
              {alert.status ||
                'Unavailable'}
            </Text>
          </Card>
        ))}

        {!refreshing &&
          alerts.length === 0 &&
          !error && (
            <Card>
              <Text style={styles.message}>
                No warnings are currently available.
              </Text>
            </Card>
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
  severity: {
    color: colors.amber,
    fontWeight: '900',
    fontSize: 10,
  },
  title: {
    color: colors.text,
    fontSize: 17,
    fontWeight: '800',
    marginTop: 5,
  },
  message: {
    color: colors.muted,
    lineHeight: 20,
    marginTop: 8,
  },
  status: {
    color: colors.cyan,
    marginTop: 10,
    fontSize: 12,
  },
  error: {
    color: colors.red,
    fontWeight: '900',
  },
})
