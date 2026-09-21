import { useCallback, useMemo, useState } from 'react'
import {
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native'
import { useFocusEffect } from '@react-navigation/native'

import type { Alert } from '../types'
import { getAlerts, getReports } from '../services/module8'
import { getQueue } from '../storage/queue'
import { syncPendingReports } from '../sync/syncEngine'
import { Button, Card, Page, colors } from '../components/UI'

const severityRank: Record<string, number> = {
  LOW: 1,
  MODERATE: 2,
  MEDIUM: 2,
  HIGH: 3,
  CRITICAL: 4,
}

export default function HomeScreen({ navigation }: any) {
  const [reports, setReports] = useState(0)
  const [alerts, setAlerts] = useState<Alert[]>([])
  const [pending, setPending] = useState(0)
  const [refreshing, setRefreshing] = useState(false)
  const [error, setError] = useState('')

  const load = useCallback(async () => {
    setRefreshing(true)
    setError('')

    try {
      const [reportData, queue] = await Promise.all([
        getReports(),
        getQueue(),
      ])

      setReports(Array.isArray(reportData) ? reportData.length : 0)
      setPending(queue.length)

      try {
        const alertData = await getAlerts()
        setAlerts(
          Array.isArray(alertData)
            ? alertData.filter((item) => {
                const status = (item.status || '').toLowerCase()
                return status !== 'resolved' && status !== 'inactive'
              })
            : [],
        )
      } catch {
        setAlerts([])
      }

      void syncPendingReports()
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e))
    } finally {
      setRefreshing(false)
    }
  }, [])

  useFocusEffect(
    useCallback(() => {
      void load()
    }, [load]),
  )

  const highestAlert = useMemo(
    () =>
      [...alerts].sort(
        (a, b) =>
          (severityRank[(b.severity || '').toUpperCase()] || 0) -
          (severityRank[(a.severity || '').toUpperCase()] || 0),
      )[0],
    [alerts],
  )

  const severity = (highestAlert?.severity || 'LOW').toUpperCase()

  const advisory =
    severity === 'CRITICAL'
      ? {
          bg: '#B91C1C',
          title: 'RED ALERT: IMMEDIATE CAUTION REQUIRED',
          advice: highestAlert?.message || 'Move away from steep slopes, hill cuttings and drainage ravines. Follow local emergency instructions.',
        }
      : severity === 'HIGH'
        ? {
            bg: '#C2410C',
            title: 'ORANGE WARNING: HIGH LANDSLIDE SUSCEPTIBILITY',
            advice: highestAlert?.message || 'Avoid unnecessary mountain-road travel and watch for ground cracking, rockfall or unusual water seepage.',
          }
        : severity === 'MODERATE' || severity === 'MEDIUM'
          ? {
              bg: '#B45309',
              title: 'YELLOW ADVISORY: LANDSLIDE WATCH',
              advice: highestAlert?.message || 'Rainfall risk is elevated. Keep emergency supplies ready and follow local advisories.',
            }
          : {
              bg: '#15803D',
              title: 'NORMAL: NO ACTIVE HIGH-SEVERITY WARNING',
              advice: highestAlert?.message || 'Continue monitoring local weather and official emergency updates.',
            }

  return (
    <ScrollView
      style={styles.root}
      contentContainerStyle={styles.content}
      refreshControl={
        <RefreshControl refreshing={refreshing} onRefresh={load} />
      }
    >
      <Page
        eyebrow="VORTEXA / CITIZEN"
        title="Citizen Emergency Portal"
        subtitle="Official landslide warnings, community reporting and emergency guidance."
      >
        <View style={[styles.advisory, { backgroundColor: advisory.bg }]}>
          <Text style={styles.advisoryEyebrow}>
            STATE DISASTER MANAGEMENT CITIZEN ADVISORY
          </Text>
          <Text style={styles.advisoryTitle}>{advisory.title}</Text>
          <Text style={styles.advisoryText}>{advisory.advice}</Text>
          <Text style={styles.disclaimer}>
            AI-assisted warning information. In an emergency call 112 or 1070.
          </Text>
        </View>

        {!!error && (
          <Card>
            <Text style={styles.error}>BACKEND CONNECTION</Text>
            <Text style={styles.muted}>{error}</Text>
          </Card>
        )}

        <View style={styles.row}>
          <View style={styles.third}>
            <Card>
              <Text style={styles.big}>{alerts.length}</Text>
              <Text style={styles.label}>ACTIVE WARNINGS</Text>
            </Card>
          </View>
          <View style={styles.third}>
            <Card>
              <Text style={styles.big}>{reports}</Text>
              <Text style={styles.label}>REPORTS</Text>
            </Card>
          </View>
          <View style={styles.third}>
            <Card>
              <Text style={styles.big}>{pending}</Text>
              <Text style={styles.label}>PENDING</Text>
            </Card>
          </View>
        </View>

        <Card>
          <Text style={styles.cardTitle}>Report Hazard</Text>
          <Text style={styles.muted}>
            Report slope cracks, rockfall, road blockage, flooding or other visible danger. Reports are saved locally first and then synchronized.
          </Text>
          <Button
            label="REPORT HAZARD TO AUTHORITY"
            onPress={() => navigation.navigate('Report')}
          />
        </Card>

        <Card>
          <Text style={styles.cardTitle}>Emergency Helplines</Text>
          <View style={styles.helplineRow}>
            <Text style={styles.helplineLabel}>National Disaster</Text>
            <Text style={styles.helplineValue}>1070</Text>
          </View>
          <View style={styles.helplineRow}>
            <Text style={styles.helplineLabel}>Police & Emergency</Text>
            <Text style={styles.helplineValue}>112</Text>
          </View>
          <View style={styles.helplineRow}>
            <Text style={styles.helplineLabel}>State Control Room</Text>
            <Text style={styles.helplineValue}>1077</Text>
          </View>
          <View style={styles.helplineRow}>
            <Text style={styles.helplineLabel}>Ambulance</Text>
            <Text style={styles.helplineValue}>108</Text>
          </View>
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
    padding: 16,
    paddingBottom: 34,
  },
  advisory: {
    borderRadius: 7,
    padding: 15,
    marginBottom: 14,
  },
  advisoryEyebrow: {
    color: '#FFFFFF',
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 0.8,
    opacity: 0.92,
  },
  advisoryTitle: {
    color: '#FFFFFF',
    fontSize: 17,
    fontWeight: '900',
    marginTop: 7,
  },
  advisoryText: {
    color: '#FFFFFF',
    fontSize: 13,
    lineHeight: 19,
    marginTop: 6,
  },
  disclaimer: {
    color: '#FFFFFF',
    opacity: 0.82,
    fontSize: 10,
    marginTop: 10,
    paddingTop: 8,
    borderTopColor: 'rgba(255,255,255,0.25)',
    borderTopWidth: 1,
  },
  row: {
    flexDirection: 'row',
    gap: 8,
  },
  third: {
    flex: 1,
  },
  big: {
    color: colors.text,
    fontSize: 25,
    fontWeight: '900',
  },
  label: {
    color: colors.muted,
    fontSize: 9,
    fontWeight: '800',
    marginTop: 5,
  },
  cardTitle: {
    color: colors.blue,
    fontSize: 16,
    fontWeight: '800',
  },
  muted: {
    color: colors.muted,
    marginTop: 7,
    lineHeight: 19,
    fontSize: 13,
  },
  error: {
    color: colors.red,
    fontWeight: '900',
  },
  helplineRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 8,
    borderBottomColor: colors.border,
    borderBottomWidth: 1,
  },
  helplineLabel: {
    color: colors.muted,
    fontSize: 12,
  },
  helplineValue: {
    color: colors.text,
    fontSize: 13,
    fontWeight: '900',
  },
})
