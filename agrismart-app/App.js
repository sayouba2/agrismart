import { View, Text, StyleSheet } from 'react-native'
import { StatusBar } from 'expo-status-bar'
import { SafeAreaProvider } from 'react-native-safe-area-context'
import { NavigationContainer, DefaultTheme, getFocusedRouteNameFromRoute } from '@react-navigation/native'
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs'
import { createNativeStackNavigator } from '@react-navigation/native-stack'
import { useFonts } from 'expo-font'
import { Feather } from '@expo/vector-icons'
import Animated, { ZoomIn, FadeIn } from 'react-native-reanimated'
import { LinearGradient } from 'expo-linear-gradient'

import { AppProvider, useApp } from './context/AppContext'
import {
  colors,
  gradients,
  font,
  type,
  Inter_400Regular,
  Inter_500Medium,
  Inter_600SemiBold,
  Inter_700Bold,
  Inter_800ExtraBold,
} from './theme'
import OnboardingScreen from './screens/OnboardingScreen'
import HomeScreen from './screens/HomeScreen'
import JourneyScreen from './screens/JourneyScreen'
import InspectionScreen from './screens/InspectionScreen'
import FollowUpScreen from './screens/FollowUpScreen'
import AnomalyDetailScreen from './screens/AnomalyDetailScreen'
import ProfileScreen from './screens/ProfileScreen'
import SmsSettingsScreen from './screens/SmsSettingsScreen'

const Tab = createBottomTabNavigator()
const Stack = createNativeStackNavigator()

const navTheme = {
  ...DefaultTheme,
  colors: { ...DefaultTheme.colors, background: colors.bg, card: colors.surface, border: colors.border, text: colors.text, primary: colors.primary },
}

function ParcoursStack() {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="Timeline" component={JourneyScreen} />
      <Stack.Screen name="Inspection" component={InspectionScreen} />
    </Stack.Navigator>
  )
}

function SuiviStack() {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="Anomalies" component={FollowUpScreen} />
      <Stack.Screen name="AnomalyDetail" component={AnomalyDetailScreen} />
    </Stack.Navigator>
  )
}

function ProfilStack() {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="ProfilMain" component={ProfileScreen} />
      <Stack.Screen name="AjouterCulture" component={OnboardingScreen} />
      <Stack.Screen name="AlertesSMS" component={SmsSettingsScreen} />
    </Stack.Navigator>
  )
}

const TAB_ICON = { Accueil: 'home', Parcours: 'trending-up', Suivi: 'bell', Profil: 'user' }

function MainTabs() {
  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        headerShown: false,
        tabBarActiveTintColor: colors.primary,
        tabBarInactiveTintColor: colors.textFaint,
        tabBarStyle: styles.tabBar,
        tabBarLabelStyle: { fontFamily: font.semibold, fontSize: 11, marginTop: -2 },
        tabBarIcon: ({ color, focused }) => (
          <Feather name={TAB_ICON[route.name]} size={focused ? 23 : 21} color={color} />
        ),
      })}
    >
      <Tab.Screen name="Accueil" component={HomeScreen} />
      <Tab.Screen name="Parcours" component={ParcoursStack} />
      <Tab.Screen name="Suivi" component={SuiviStack} />
      <Tab.Screen
        name="Profil"
        component={ProfilStack}
        options={({ route }) => ({
          // Hide the floating tab bar on the full-screen "add a culture" assistant
          tabBarStyle:
            getFocusedRouteNameFromRoute(route) === 'AjouterCulture'
              ? { display: 'none' }
              : styles.tabBar,
        })}
      />
    </Tab.Navigator>
  )
}

function OnboardingFlow() {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="Onboarding" component={OnboardingScreen} />
    </Stack.Navigator>
  )
}

function Splash() {
  return (
    <LinearGradient colors={gradients.hero} style={styles.splash}>
      <Animated.View entering={ZoomIn.duration(500)} style={styles.logo}>
        <Feather name="feather" size={40} color={colors.white} />
      </Animated.View>
      <Text style={styles.splashTitle}>AgriSmart</Text>
      <Animated.Text entering={FadeIn.delay(300)} style={styles.splashSub}>Chargement…</Animated.Text>
    </LinearGradient>
  )
}

function Root() {
  const { ready, hasProfile } = useApp()
  if (!ready) return <Splash />
  return (
    <NavigationContainer theme={navTheme}>
      {hasProfile ? <MainTabs /> : <OnboardingFlow />}
    </NavigationContainer>
  )
}

export default function App() {
  const [fontsLoaded] = useFonts({
    Inter_400Regular,
    Inter_500Medium,
    Inter_600SemiBold,
    Inter_700Bold,
    Inter_800ExtraBold,
  })

  return (
    <SafeAreaProvider>
      <StatusBar style="light" />
      {fontsLoaded ? (
        <AppProvider>
          <Root />
        </AppProvider>
      ) : (
        <Splash />
      )}
    </SafeAreaProvider>
  )
}

const styles = StyleSheet.create({
  tabBar: {
    position: 'absolute',
    left: 16,
    right: 16,
    bottom: 18,
    height: 64,
    borderRadius: 22,
    backgroundColor: colors.surface,
    borderTopWidth: 0,
    borderWidth: 1,
    borderColor: colors.border,
    paddingTop: 8,
    paddingBottom: 8,
    shadowColor: '#0E472D',
    shadowOpacity: 0.12,
    shadowRadius: 18,
    shadowOffset: { width: 0, height: 8 },
    elevation: 10,
  },
  splash: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  logo: {
    width: 84,
    height: 84,
    borderRadius: 26,
    backgroundColor: 'rgba(255,255,255,0.15)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 18,
  },
  splashTitle: { ...type.display, color: colors.white },
  splashSub: { ...type.bodyMed, color: 'rgba(255,255,255,0.8)', marginTop: 8 },
})
