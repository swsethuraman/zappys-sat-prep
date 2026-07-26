import { useEffect, useState } from 'react';
import {
  useFonts as useSpaceGrotesk,
  SpaceGrotesk_500Medium,
  SpaceGrotesk_700Bold,
} from '@expo-google-fonts/space-grotesk';
import {
  Inter_400Regular,
  Inter_500Medium,
  Inter_600SemiBold,
} from '@expo-google-fonts/inter';
import {
  JetBrainsMono_500Medium,
  JetBrainsMono_700Bold,
} from '@expo-google-fonts/jetbrains-mono';

/**
 * How long the app may block on font loading before rendering anyway. If the
 * bundled TTFs fail to load (e.g. a web deploy that didn't serve the font
 * assets), we proceed with system-font fallback instead of hanging forever on
 * the splash spinner. Fonts that do arrive swap in when ready.
 */
const FONT_LOAD_TIMEOUT_MS = 4000;

/**
 * Loads all fonts referenced in src/theme/colors.ts `fonts` tokens.
 * Returns `true` once the app is allowed to render — when fonts finish
 * loading, when loading errors, OR after FONT_LOAD_TIMEOUT_MS, whichever comes
 * first. The app must never hang waiting on fonts; unresolved fonts simply
 * degrade to the platform's system font.
 */
export function useZappyFonts(): boolean {
  const [loaded, error] = useSpaceGrotesk({
    SpaceGrotesk_500Medium,
    SpaceGrotesk_700Bold,
    Inter_400Regular,
    Inter_500Medium,
    Inter_600SemiBold,
    JetBrainsMono_500Medium,
    JetBrainsMono_700Bold,
  });

  // Safety valve: never block the UI on fonts for more than the timeout.
  const [timedOut, setTimedOut] = useState(false);
  useEffect(() => {
    const timer = setTimeout(() => setTimedOut(true), FONT_LOAD_TIMEOUT_MS);
    return () => clearTimeout(timer);
  }, []);

  return loaded || error !== null || timedOut;
}
