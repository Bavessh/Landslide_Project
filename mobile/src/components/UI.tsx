import type { ReactNode } from 'react'
import {
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native'

export const colors = {
  background: '#F6F7F9',
  card: '#FFFFFF',
  panel: '#F1F3F5',
  border: '#DDE2E7',
  text: '#172033',
  muted: '#5F6877',
  blue: '#1D4E89',
  blueDark: '#153966',
  cyan: '#1D4E89',
  green: '#15803D',
  greenBg: '#DCFCE7',
  amber: '#B45309',
  amberBg: '#FEF3C7',
  orange: '#C2410C',
  orangeBg: '#FFEDD5',
  red: '#B91C1C',
  redBg: '#FEE2E2',
}

export function Page({
  eyebrow,
  title,
  subtitle,
  children,
}: {
  eyebrow: string
  title: string
  subtitle?: string
  children: ReactNode
}) {
  return (
    <View>
      <Text style={styles.eyebrow}>{eyebrow}</Text>
      <Text style={styles.title}>{title}</Text>
      {!!subtitle && <Text style={styles.subtitle}>{subtitle}</Text>}
      <View style={{ marginTop: 18 }}>{children}</View>
    </View>
  )
}

export function Card({ children }: { children: ReactNode }) {
  return <View style={styles.card}>{children}</View>
}

export function Button({
  label,
  onPress,
  disabled = false,
  secondary = false,
}: {
  label: string
  onPress: () => void
  disabled?: boolean
  secondary?: boolean
}) {
  return (
    <Pressable
      disabled={disabled}
      onPress={onPress}
      style={[
        styles.button,
        secondary && styles.secondary,
        disabled && styles.disabled,
      ]}
    >
      <Text
        style={[
          styles.buttonText,
          secondary && styles.secondaryText,
        ]}
      >
        {label}
      </Text>
    </Pressable>
  )
}

const styles = StyleSheet.create({
  eyebrow: {
    color: colors.blue,
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 1.1,
    marginBottom: 6,
  },
  title: {
    color: colors.text,
    fontSize: 25,
    fontWeight: '800',
  },
  subtitle: {
    color: colors.muted,
    marginTop: 6,
    lineHeight: 19,
    fontSize: 13,
  },
  card: {
    backgroundColor: colors.card,
    borderColor: colors.border,
    borderWidth: 1,
    borderRadius: 7,
    padding: 15,
    marginBottom: 12,
  },
  button: {
    backgroundColor: colors.blue,
    borderColor: colors.blue,
    borderWidth: 1,
    paddingVertical: 13,
    paddingHorizontal: 14,
    borderRadius: 6,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 9,
  },
  secondary: {
    backgroundColor: '#FFFFFF',
    borderColor: colors.border,
  },
  disabled: {
    opacity: 0.45,
  },
  buttonText: {
    color: '#FFFFFF',
    fontWeight: '800',
    fontSize: 12,
  },
  secondaryText: {
    color: colors.blue,
  },
})
