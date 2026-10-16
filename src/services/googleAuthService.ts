import { initializeApp, getApps, getApp } from 'firebase/app';
import {
  getAuth,
  signInWithPopup,
  GoogleAuthProvider,
  signOut,
  onAuthStateChanged,
  User as FirebaseUser,
} from 'firebase/auth';
import firebaseConfig from '../../firebase-applet-config.json';

// Initialize Firebase App singleton
const app = getApps().length > 0 ? getApp() : initializeApp(firebaseConfig);
export const auth = getAuth(app);

// Configure Google Auth Provider
const googleProvider = new GoogleAuthProvider();
googleProvider.setCustomParameters({
  prompt: 'select_account',
});

export interface GoogleAuthProfile {
  uid: string;
  email: string;
  displayName: string;
  photoURL?: string;
  firstName?: string;
  lastName?: string;
  /**
   * Firebase ID token signe par Google.
   *
   * Seul element que le backend accepte comme preuve d'identite.
   * Il doit etre envoye dans l'en-tete "Authorization: Bearer <idToken>".
   */
  idToken: string;
}

/**
 * Perform real Google Authentication with popup
 */
export async function authenticateWithGoogle(): Promise<GoogleAuthProfile> {
  try {
    const result = await signInWithPopup(auth, googleProvider);
    const user = result.user;

    // Le profil est un retour de confort pour l'IHM uniquement.
    // L'autorisation reelle repose sur idToken, verifie par le serveur.
    const displayName = user.displayName || user.email?.split('@')[0] || 'Utilisateur Google';
    const nameParts = displayName.split(' ');
    const firstName = nameParts[0] || '';
    const lastName = nameParts.slice(1).join(' ') || '';

    // Force larafraichissement du jeton afin d'eviter un ID token deja expire.
    const idToken = await user.getIdToken(true);

    if (!idToken) {
      throw new Error('Impossible d’obtenir le jeton de session Google. Veuillez réessayer.');
    }

    return {
      uid: user.uid,
      email: user.email || '',
      displayName,
      photoURL: user.photoURL || undefined,
      firstName,
      lastName,
      idToken,
    };
  } catch (error: any) {
    console.error('Google Sign-In failed:', error);
    // User cancelled popup or closed it
    if (error.code === 'auth/popup-closed-by-user' || error.code === 'auth/cancelled-popup-request') {
      throw new Error('Connexion annulée par l’utilisateur.');
    }
    if (error.code === 'auth/network-request-failed') {
      throw new Error('Erreur de connexion réseau lors de la communication avec Google.');
    }
    throw new Error(error.message || 'Impossible de se connecter avec Google.');
  }
}

/**
 * Sign out from Google Auth
 */
export async function logoutGoogle(): Promise<void> {
  try {
    await signOut(auth);
  } catch (error) {
    console.warn('Sign-out error:', error);
  }
}

/**
 * Listen to auth state change
 */
export function onGoogleAuthStateChanged(callback: (user: FirebaseUser | null) => void) {
  return onAuthStateChanged(auth, callback);
}
