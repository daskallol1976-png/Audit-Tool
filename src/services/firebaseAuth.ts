import { initializeApp, getApps, getApp } from 'firebase/app';
import {
  getAuth,
  signInWithPopup,
  GoogleAuthProvider,
  onAuthStateChanged,
  User,
  signOut,
} from 'firebase/auth';
import { getFirestore, doc, getDocFromServer } from 'firebase/firestore';
import firebaseConfig from '../../firebase-applet-config.json';

// Initialize Firebase App
const app = getApps().length > 0 ? getApp() : initializeApp(firebaseConfig);
export const auth = getAuth(app);

// Initialize Firestore Database (using custom database ID if provisioned)
export const db = firebaseConfig.firestoreDatabaseId
  ? getFirestore(app, firebaseConfig.firestoreDatabaseId)
  : getFirestore(app);

// Test connection on initialization as recommended by Firebase guidelines
async function testFirestoreConnection() {
  try {
    await getDocFromServer(doc(db, 'test', 'connection'));
  } catch (error) {
    if (error instanceof Error && error.message.includes('the client is offline')) {
      console.warn('Firestore client appears offline or is initializing.');
    }
  }
}
testFirestoreConnection();

// Provider with Google Drive scope
export const googleProvider = new GoogleAuthProvider();
googleProvider.addScope('https://www.googleapis.com/auth/drive');
googleProvider.addScope('https://www.googleapis.com/auth/drive.file');

// In-memory token cache (persists during the session, avoids prompt issues)
let cachedAccessToken: string | null = null;
let isSigningIn = false;

// Attempt to restore token from session memory
try {
  cachedAccessToken = sessionStorage.getItem('gdrive_cached_token');
} catch (e) {
  // Ignore sessionStorage restriction if in secure sandbox
}

export const setCachedToken = (token: string | null) => {
  cachedAccessToken = token;
  try {
    if (token) {
      sessionStorage.setItem('gdrive_cached_token', token);
    } else {
      sessionStorage.removeItem('gdrive_cached_token');
    }
  } catch (e) {
    // Ignore
  }
};

export const getCachedToken = (): string | null => {
  if (!cachedAccessToken) {
    try {
      cachedAccessToken = sessionStorage.getItem('gdrive_cached_token');
    } catch (e) {
      // Ignore
    }
  }
  return cachedAccessToken;
};

/**
 * Initiates the Google Sign-in flow with popup and requests Drive permissions
 */
export const signInWithGoogleDrive = async (): Promise<{ user: User; accessToken: string }> => {
  if (isSigningIn) {
    throw new Error('Sign-in is already in progress.');
  }

  isSigningIn = true;
  try {
    googleProvider.setCustomParameters({
      prompt: 'consent',
      access_type: 'offline',
    });

    const result = await signInWithPopup(auth, googleProvider);
    const credential = GoogleAuthProvider.credentialFromResult(result);

    const token = credential?.accessToken;
    if (!token) {
      throw new Error('Google did not return an access token for Drive. Please ensure Drive permissions were granted.');
    }

    setCachedToken(token);
    return { user: result.user, accessToken: token };
  } catch (error: any) {
    console.error('Firebase Google Sign-In Error:', error);
    if (error.code === 'auth/popup-closed-by-user') {
      throw new Error('Sign-in popup was closed before authorization was completed. Please try again.');
    } else if (error.code === 'auth/popup-blocked') {
      throw new Error('Popup was blocked by the browser. Please allow popups for this site and try again.');
    }
    throw new Error(error.message || 'Failed to authenticate with Google Drive');
  } finally {
    isSigningIn = false;
  }
};

/**
 * Subscribe to Auth State changes
 */
export const subscribeToAuth = (callback: (user: User | null, token: string | null) => void) => {
  return onAuthStateChanged(auth, (user) => {
    callback(user, getCachedToken());
  });
};

/**
 * Sign out
 */
export const signOutGoogle = async () => {
  await signOut(auth);
  setCachedToken(null);
};
