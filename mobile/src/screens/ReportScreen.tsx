import { useState } from 'react'
import {
  Alert,
  Image,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native'
import * as ImagePicker from 'expo-image-picker'
import * as Location from 'expo-location'
import MapView, { Marker } from 'react-native-maps'

import type { DraftReport } from '../types'
import { enqueueReport } from '../storage/queue'
import { syncQueuedReport } from '../sync/syncEngine'
import { Button, Card, Page, colors } from '../components/UI'

const TYPES = [
  'landslide',
  'ground_crack',
  'slope_movement',
  'road_blockage',
  'flooding',
  'infrastructure_damage',
  'other',
]

const SEVERITIES = [
  'low',
  'medium',
  'high',
  'critical',
]

export default function ReportScreen({ navigation }: any) {
  const [step, setStep] = useState(0)
  const [reportType, setReportType] =
    useState('landslide')
  const [severity, setSeverity] =
    useState('medium')
  const [description, setDescription] =
    useState('')
  const [imageUri, setImageUri] =
    useState<string | null>(null)

  const [latitude, setLatitude] =
    useState<number | null>(null)
  const [longitude, setLongitude] =
    useState<number | null>(null)
  const [gpsAccuracy, setGpsAccuracy] =
    useState<number | null>(null)

  const [
    locationSource,
    setLocationSource,
  ] = useState<
    'device_gps' | 'manual'
  >('device_gps')

  const [submitting, setSubmitting] =
    useState(false)

  async function takePhoto() {
    const permission =
      await ImagePicker
        .requestCameraPermissionsAsync()

    if (!permission.granted) {
      Alert.alert(
        'Camera permission denied',
        'Camera access is required to capture evidence.',
      )
      return
    }

    const result =
      await ImagePicker.launchCameraAsync({
        mediaTypes: ['images'],
        quality: 0.8,
      })

    if (!result.canceled && result.assets[0]) {
      setImageUri(result.assets[0].uri)
    }
  }

  async function choosePhoto() {
    const permission =
      await ImagePicker
        .requestMediaLibraryPermissionsAsync()

    if (!permission.granted) {
      Alert.alert(
        'Photo permission denied',
        'Photo-library access is required.',
      )
      return
    }

    const result =
      await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ['images'],
        quality: 0.8,
      })

    if (!result.canceled && result.assets[0]) {
      setImageUri(result.assets[0].uri)
    }
  }

  async function detectLocation() {
    const permission =
      await Location
        .requestForegroundPermissionsAsync()

    if (!permission.granted) {
      Alert.alert(
        'Location permission denied',
        'Grant location access and retry.',
      )
      return
    }

    try {
      const result =
        await Location.getCurrentPositionAsync({
          accuracy: Location.Accuracy.High,
        })

      setLatitude(result.coords.latitude)
      setLongitude(result.coords.longitude)
      setGpsAccuracy(
        result.coords.accuracy ?? null,
      )
      setLocationSource('device_gps')
    } catch (e) {
      Alert.alert(
        'Location unavailable',
        e instanceof Error
          ? e.message
          : String(e),
      )
    }
  }

  function reset() {
    setStep(0)
    setReportType('landslide')
    setSeverity('medium')
    setDescription('')
    setImageUri(null)
    setLatitude(null)
    setLongitude(null)
    setGpsAccuracy(null)
    setLocationSource('device_gps')
  }

  async function submit() {
    if (
      latitude === null ||
      longitude === null
    ) {
      Alert.alert(
        'Location required',
        'Capture or confirm a location first.',
      )
      return
    }

    const draft: DraftReport = {
      reportType,
      description,
      severity,
      latitude,
      longitude,
      gpsAccuracy,
      locationSource,
      captureTime:
        new Date().toISOString(),
      imageUri,
    }

    setSubmitting(true)

    try {
      // Persist first. This protects the report
      // before any network request occurs.
      const queued =
        await enqueueReport(draft)

      const result =
        await syncQueuedReport(
          queued.localId,
        )

      if (result.uploaded) {
        Alert.alert(
          'Report submitted',
          result.reportId
            ? `Report #${result.reportId} uploaded successfully.`
            : 'Report uploaded successfully.',
        )
      } else if (result.offline) {
        Alert.alert(
          'Saved offline',
          'The report is safely queued and will retry automatically when connectivity returns.',
        )
      } else {
        Alert.alert(
          'Queued for retry',
          'The report is safely stored locally. Automatic retry will continue.',
        )
      }

      reset()
      navigation.navigate('My Reports')
    } catch (e) {
      Alert.alert(
        'Could not save report',
        e instanceof Error
          ? e.message
          : String(e),
      )
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <KeyboardAvoidingView
      style={styles.root}
      behavior={
        Platform.OS === 'ios'
          ? 'padding'
          : undefined
      }
    >
      <ScrollView
        contentContainerStyle={styles.content}
      >
        <Page
          eyebrow={`VORTEXA / REPORT ${step + 1}/5`}
          title="Report Hazard"
          subtitle="Citizen field reports are saved locally first, then sent to the emergency authority when connectivity is available."
        >
          {step === 0 && (
            <>
              <Text style={styles.label}>
                INCIDENT TYPE
              </Text>

              <View style={styles.chips}>
                {TYPES.map((item) => (
                  <Text
                    key={item}
                    onPress={() =>
                      setReportType(item)
                    }
                    style={[
                      styles.chip,
                      reportType === item &&
                        styles.activeChip,
                    ]}
                  >
                    {item
                      .replaceAll('_', ' ')
                      .toUpperCase()}
                  </Text>
                ))}
              </View>

              <Text style={styles.label}>
                SEVERITY
              </Text>

              <View style={styles.chips}>
                {SEVERITIES.map((item) => (
                  <Text
                    key={item}
                    onPress={() =>
                      setSeverity(item)
                    }
                    style={[
                      styles.chip,
                      severity === item &&
                        styles.activeChip,
                    ]}
                  >
                    {item.toUpperCase()}
                  </Text>
                ))}
              </View>

              <Button
                label="NEXT: IMAGE"
                onPress={() => setStep(1)}
              />
            </>
          )}

          {step === 1 && (
            <>
              <Card>
                {imageUri ? (
                  <Image
                    source={{ uri: imageUri }}
                    style={styles.image}
                  />
                ) : (
                  <Text style={styles.muted}>
                    No image selected.
                  </Text>
                )}

                <Button
                  label="CAPTURE IMAGE"
                  onPress={takePhoto}
                />

                <Button
                  label="CHOOSE FROM GALLERY"
                  onPress={choosePhoto}
                  secondary
                />
              </Card>

              <View style={styles.nav}>
                <View style={styles.flex}>
                  <Button
                    label="BACK"
                    onPress={() => setStep(0)}
                    secondary
                  />
                </View>
                <View style={styles.flex}>
                  <Button
                    label="NEXT: LOCATION"
                    onPress={() => setStep(2)}
                  />
                </View>
              </View>
            </>
          )}

          {step === 2 && (
            <>
              <Card>
                <Button
                  label="DETECT GPS LOCATION"
                  onPress={detectLocation}
                />

                {latitude !== null &&
                  longitude !== null && (
                    <>
                      <Text style={styles.coordinate}>
                        {latitude.toFixed(6)},{' '}
                        {longitude.toFixed(6)}
                      </Text>

                      <Text style={styles.muted}>
                        Accuracy:{' '}
                        {gpsAccuracy !== null
                          ? `±${Math.round(
                              gpsAccuracy,
                            )} m`
                          : 'Unavailable'}
                      </Text>

                      <Text style={styles.muted}>
                        Source: {locationSource}
                      </Text>

                      <MapView
                        style={styles.map}
                        region={{
                          latitude,
                          longitude,
                          latitudeDelta: 0.01,
                          longitudeDelta: 0.01,
                        }}
                      >
                        <Marker
                          draggable
                          coordinate={{
                            latitude,
                            longitude,
                          }}
                          onDragEnd={(event) => {
                            setLatitude(
                              event.nativeEvent
                                .coordinate.latitude,
                            )
                            setLongitude(
                              event.nativeEvent
                                .coordinate.longitude,
                            )
                            setLocationSource(
                              'manual',
                            )
                          }}
                        />
                      </MapView>

                      <Text style={styles.muted}>
                        Drag the marker to correct the location.
                      </Text>
                    </>
                  )}
              </Card>

              <View style={styles.nav}>
                <View style={styles.flex}>
                  <Button
                    label="BACK"
                    onPress={() => setStep(1)}
                    secondary
                  />
                </View>
                <View style={styles.flex}>
                  <Button
                    label="NEXT"
                    onPress={() => setStep(3)}
                    disabled={
                      latitude === null
                    }
                  />
                </View>
              </View>
            </>
          )}

          {step === 3 && (
            <>
              <Card>
                <Text style={styles.label}>
                  DESCRIPTION
                </Text>

                <TextInput
                  multiline
                  value={description}
                  onChangeText={setDescription}
                  placeholder="Describe what you observed..."
                  placeholderTextColor={colors.muted}
                  style={styles.input}
                />
              </Card>

              <View style={styles.nav}>
                <View style={styles.flex}>
                  <Button
                    label="BACK"
                    onPress={() => setStep(2)}
                    secondary
                  />
                </View>
                <View style={styles.flex}>
                  <Button
                    label="PREVIEW"
                    onPress={() => setStep(4)}
                  />
                </View>
              </View>
            </>
          )}

          {step === 4 && (
            <>
              <Card>
                <Text style={styles.previewLabel}>
                  TYPE
                </Text>
                <Text style={styles.previewValue}>
                  {reportType}
                </Text>

                <Text style={styles.previewLabel}>
                  SEVERITY
                </Text>
                <Text style={styles.previewValue}>
                  {severity}
                </Text>

                <Text style={styles.previewLabel}>
                  IMAGE
                </Text>
                <Text style={styles.previewValue}>
                  {imageUri
                    ? 'Image attached'
                    : 'No image attached'}
                </Text>

                <Text style={styles.previewLabel}>
                  LOCATION
                </Text>
                <Text style={styles.previewValue}>
                  {latitude?.toFixed(6)},{' '}
                  {longitude?.toFixed(6)}
                </Text>

                <Text style={styles.previewLabel}>
                  GPS ACCURACY
                </Text>
                <Text style={styles.previewValue}>
                  {gpsAccuracy !== null
                    ? `±${Math.round(
                        gpsAccuracy,
                      )} m`
                    : 'Unavailable'}
                </Text>

                <Text style={styles.previewLabel}>
                  DESCRIPTION
                </Text>
                <Text style={styles.previewValue}>
                  {description ||
                    'No description provided.'}
                </Text>
              </Card>

              <View style={styles.nav}>
                <View style={styles.flex}>
                  <Button
                    label="BACK"
                    onPress={() => setStep(3)}
                    secondary
                  />
                </View>
                <View style={styles.flex}>
                  <Button
                    label={
                      submitting
                        ? 'SAVING...'
                        : 'SUBMIT REPORT'
                    }
                    onPress={submit}
                    disabled={submitting}
                  />
                </View>
              </View>
            </>
          )}
        </Page>
      </ScrollView>
    </KeyboardAvoidingView>
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
    fontSize: 11,
    fontWeight: '900',
    marginBottom: 9,
  },
  chips: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 18,
  },
  chip: {
    color: colors.text,
    borderWidth: 1,
    borderColor: colors.border,
    paddingHorizontal: 10,
    paddingVertical: 9,
    borderRadius: 6,
    backgroundColor: colors.card,
    overflow: 'hidden',
  },
  activeChip: {
    borderColor: colors.cyan,
    color: '#ffffff',
    backgroundColor: colors.blue,
  },
  image: {
    width: '100%',
    height: 220,
    borderRadius: 7,
    marginBottom: 8,
  },
  muted: {
    color: colors.muted,
    marginTop: 8,
    lineHeight: 20,
  },
  coordinate: {
    color: colors.text,
    fontWeight: '900',
    marginTop: 14,
  },
  map: {
    height: 230,
    borderRadius: 7,
    marginTop: 14,
  },
  nav: {
    flexDirection: 'row',
    gap: 10,
  },
  flex: { flex: 1 },
  input: {
    minHeight: 140,
    color: colors.text,
    backgroundColor: colors.panel,
    borderColor: colors.border,
    borderWidth: 1,
    borderRadius: 7,
    padding: 12,
    textAlignVertical: 'top',
  },
  previewLabel: {
    color: colors.muted,
    fontSize: 10,
    fontWeight: '900',
    marginTop: 8,
  },
  previewValue: {
    color: colors.text,
    marginTop: 4,
    marginBottom: 7,
  },
})
