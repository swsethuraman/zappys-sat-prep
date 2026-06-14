// firebase/auth resolves to browser types by default; the React Native bundle
// (applied by Metro via the "react-native" condition) also exports
// getReactNativePersistence. Augment the module so TypeScript knows about it.
import type { Persistence } from 'firebase/auth';

declare module 'firebase/auth' {
  export function getReactNativePersistence(storage: {
    getItem(key: string): Promise<string | null>;
    setItem(key: string, value: string): Promise<void>;
    removeItem(key: string): Promise<void>;
  }): Persistence;
}
