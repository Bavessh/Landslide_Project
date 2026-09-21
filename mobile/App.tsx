import { StatusBar } from 'expo-status-bar'
import { NavigationContainer, DefaultTheme } from '@react-navigation/native'
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs'
import { Ionicons } from '@expo/vector-icons'

import HomeScreen from './src/screens/HomeScreen'
import ReportScreen from './src/screens/ReportScreen'
import ReportsScreen from './src/screens/ReportsScreen'
import WarningsScreen from './src/screens/WarningsScreen'
import SettingsScreen from './src/screens/SettingsScreen'
import { useAutoSync } from './src/hooks/useAutoSync'

const Tab = createBottomTabNavigator()

const theme = {
  ...DefaultTheme,
  colors: {
    ...DefaultTheme.colors,
    primary: '#1D4E89',
    background: '#F6F7F9',
    card: '#FFFFFF',
    text: '#172033',
    border: '#DDE2E7',
    notification: '#B91C1C',
  },
}

export default function App() {
  useAutoSync()

  return (
    <NavigationContainer theme={theme}>
      <StatusBar style="dark" />

      <Tab.Navigator
        screenOptions={({ route }) => ({
          headerStyle: {
            backgroundColor: '#FFFFFF',
          },
          headerShadowVisible: true,
          headerTintColor: '#172033',
          headerTitleStyle: {
            fontWeight: '700',
            fontSize: 17,
          },
          tabBarStyle: {
            backgroundColor: '#FFFFFF',
            borderTopColor: '#DDE2E7',
            height: 66,
            paddingTop: 6,
            paddingBottom: 7,
          },
          tabBarActiveTintColor: '#1D4E89',
          tabBarInactiveTintColor: '#7A8491',
          tabBarLabelStyle: {
            fontSize: 10,
            fontWeight: '700',
          },
          tabBarIcon: ({ focused, color, size }) => {
            let iconName: keyof typeof Ionicons.glyphMap

            switch (route.name) {
              case 'Home':
                iconName = focused ? 'home' : 'home-outline'
                break
              case 'Report':
                iconName = focused ? 'add-circle' : 'add-circle-outline'
                break
              case 'My Reports':
                iconName = focused ? 'document-text' : 'document-text-outline'
                break
              case 'Warnings':
                iconName = focused ? 'warning' : 'warning-outline'
                break
              case 'Settings':
                iconName = focused ? 'settings' : 'settings-outline'
                break
              default:
                iconName = 'ellipse-outline'
            }

            return <Ionicons name={iconName} size={size} color={color} />
          },
        })}
      >
        <Tab.Screen name="Home" component={HomeScreen} options={{ title: 'Citizen Portal' }} />
        <Tab.Screen name="Report" component={ReportScreen} options={{ title: 'Report Hazard' }} />
        <Tab.Screen name="My Reports" component={ReportsScreen} />
        <Tab.Screen name="Warnings" component={WarningsScreen} />
        <Tab.Screen name="Settings" component={SettingsScreen} />
      </Tab.Navigator>
    </NavigationContainer>
  )
}
