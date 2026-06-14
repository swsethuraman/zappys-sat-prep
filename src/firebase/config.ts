import { initializeApp } from 'firebase/app';
import { initializeAuth, browserLocalPersistence, getReactNativePersistence } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Platform } from 'react-native';

const firebaseConfig = {
  apiKey: 'AIzaSyCxAcmkDYng1javNTEEwNNd8BXM2rSuXx0',
  authDomain: 'zappys-sat-prep.firebaseapp.com',
  projectId: 'zappys-sat-prep',
  storageBucket: 'zappys-sat-prep.firebasestorage.app',
  messagingSenderId: '54372754316',
  appId: '1:54372754316:web:28c75f63461df730d82ca9',
};

const app = initializeApp(firebaseConfig);

// Web bundle of firebase/auth doesn't ship getReactNativePersistence
// (firebase-js-sdk#7615), so branch on platform.
const persistence =
  Platform.OS === 'web'
    ? browserLocalPersistence
    : getReactNativePersistence(AsyncStorage);

export const auth = initializeAuth(app, { persistence });

export const db = getFirestore(app);
