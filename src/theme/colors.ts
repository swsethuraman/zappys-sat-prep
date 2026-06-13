// Zappy's SAT Prep — shared theme tokens.
// Palette matches the original HTML prototype so the native app feels
// like a continuation of the same brand.

export const colors = {
  ink: '#14132B', // app background
  panel: '#1F1E3D', // card background
  panel2: '#272650', // input / nested surface
  text: '#F4F2FF',
  muted: '#A6A2D6',
  zap: '#FFD23F', // primary accent — "charge"
  mint: '#5EE6C8', // success / mastery
  coral: '#FF6B81', // weak areas / incorrect
  line: '#363468', // borders/dividers
} as const;

export const spacing = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 18,
  xl: 24,
  xxl: 32,
} as const;

export const radii = {
  sm: 8,
  md: 12,
  lg: 16,
  pill: 999,
} as const;

// Font family keys — registered via useZappyFonts() in src/theme/fonts.ts
export const fonts = {
  display: 'SpaceGrotesk_700Bold', // headings, big scores
  displayMedium: 'SpaceGrotesk_500Medium',
  body: 'Inter_400Regular',
  bodyMedium: 'Inter_500Medium',
  bodySemiBold: 'Inter_600SemiBold',
  mono: 'JetBrainsMono_700Bold', // score readouts, meters
  monoMedium: 'JetBrainsMono_500Medium',
} as const;

export const fontSizes = {
  xs: 11,
  sm: 13,
  md: 15,
  lg: 18,
  xl: 24,
  display: 48,
} as const;

// Mastery -> color/label helpers, ported from the prototype's scoring logic
export function masteryColor(mastery: number): string {
  if (mastery < 0.4) return colors.coral;
  if (mastery < 0.7) return colors.zap;
  return colors.mint;
}

export function masteryLabel(mastery: number): string {
  if (mastery < 0.4) return 'Needs work';
  if (mastery < 0.7) return 'Developing';
  return 'Strong';
}
