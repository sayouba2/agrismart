// Design tokens — the single source of truth for the app's look.

export const colors = {
  bg: '#F3F6F2',
  surface: '#FFFFFF',
  surfaceAlt: '#EAF0E9',

  primary: '#15633E',
  primaryDark: '#0E472D',
  primaryLight: '#E2EFE8',

  accent: '#E0922F',
  accentLight: '#FBEFDC',

  text: '#15241C',
  textMuted: '#6C7C72',
  textFaint: '#A6B1AA',

  border: '#E3E8E1',

  success: '#1C9C57',
  successBg: '#E3F4EA',
  warning: '#C07C16',
  warningBg: '#FAF0DA',
  danger: '#CF4339',
  dangerBg: '#FBE6E4',

  white: '#FFFFFF',
  overlay: 'rgba(11,40,26,0.45)',
}

// Brand gradient used on headers / hero surfaces
export const gradients = {
  brand: ['#1A7048', '#0E472D'],
  hero: ['#1E7A4F', '#10532F'],
}

export const radius = { sm: 10, md: 16, lg: 22, xl: 30, pill: 999 }

// 4pt spacing scale
export const space = { xs: 4, sm: 8, md: 12, lg: 16, xl: 24, xxl: 32 }

export const font = {
  regular: 'Inter_400Regular',
  medium: 'Inter_500Medium',
  semibold: 'Inter_600SemiBold',
  bold: 'Inter_700Bold',
  extrabold: 'Inter_800ExtraBold',
}

// Typography presets
export const type = {
  display: { fontFamily: font.extrabold, fontSize: 28, letterSpacing: -0.5 },
  h1: { fontFamily: font.bold, fontSize: 22, letterSpacing: -0.3 },
  h2: { fontFamily: font.bold, fontSize: 18, letterSpacing: -0.2 },
  title: { fontFamily: font.semibold, fontSize: 16 },
  body: { fontFamily: font.regular, fontSize: 15, lineHeight: 21 },
  bodyMed: { fontFamily: font.medium, fontSize: 15, lineHeight: 21 },
  label: { fontFamily: font.semibold, fontSize: 13, letterSpacing: 0.2 },
  caption: { fontFamily: font.medium, fontSize: 12 },
  overline: { fontFamily: font.semibold, fontSize: 11, letterSpacing: 1, textTransform: 'uppercase' },
  mono: { fontFamily: font.extrabold, fontSize: 36, letterSpacing: -1 },
}

export const shadow = {
  card: {
    shadowColor: '#0E472D',
    shadowOpacity: 0.07,
    shadowRadius: 16,
    shadowOffset: { width: 0, height: 6 },
    elevation: 3,
  },
  soft: {
    shadowColor: '#0E472D',
    shadowOpacity: 0.05,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 3 },
    elevation: 2,
  },
  hero: {
    shadowColor: '#0E472D',
    shadowOpacity: 0.25,
    shadowRadius: 20,
    shadowOffset: { width: 0, height: 10 },
    elevation: 8,
  },
}

// Inter font map for expo-font loading
export { Inter_400Regular, Inter_500Medium, Inter_600SemiBold, Inter_700Bold, Inter_800ExtraBold } from '@expo-google-fonts/inter'
