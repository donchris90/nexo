import React, { createContext, useContext, useEffect, useState } from 'react';
import { 
  auth, 
  googleProvider 
} from '../lib/firebase';
import { 
  signInWithPopup, 
  signOut, 
  onAuthStateChanged, 
  createUserWithEmailAndPassword, 
  signInWithEmailAndPassword, 
  signInWithPhoneNumber, 
  updateProfile, 
  User as FirebaseUser,
  RecaptchaVerifier,
  ConfirmationResult,
  UserCredential
} from 'firebase/auth';

export interface AuthContextType {
  user: FirebaseUser | null;
  loading: boolean;
  error: string | null;
  signInWithGoogle: () => Promise<UserCredential | void>;
  signUpWithEmail: (email: string, pass: string, displayName?: string) => Promise<UserCredential>;
  signInWithEmail: (email: string, pass: string) => Promise<UserCredential>;
  sendPhoneOTP: (phoneNumber: string, appVerifier: RecaptchaVerifier) => Promise<ConfirmationResult>;
  verifyPhoneOTP: (confirmationResult: ConfirmationResult, code: string) => Promise<UserCredential>;
  signOutUser: () => Promise<void>;
}

export class AuthService {
  /**
   * Google Sign-In with Popup
   */
  public async signInWithGoogle(): Promise<UserCredential> {
    return signInWithPopup(auth, googleProvider);
  }

  /**
   * Sign up with Email and Password
   */
  public async signUpWithEmail(email: string, pass: string, displayName?: string): Promise<UserCredential> {
    const cred = await createUserWithEmailAndPassword(auth, email, pass);
    if (displayName && cred.user) {
      await updateProfile(cred.user, { displayName });
    }
    return cred;
  }

  /**
   * Sign in with Email and Password
   */
  public async signInWithEmail(email: string, pass: string): Promise<UserCredential> {
    return signInWithEmailAndPassword(auth, email, pass);
  }

  /**
   * Send Phone OTP
   */
  public async sendPhoneOTP(phoneNumber: string, appVerifier: RecaptchaVerifier): Promise<ConfirmationResult> {
    return signInWithPhoneNumber(auth, phoneNumber, appVerifier);
  }

  /**
   * Verify Phone OTP
   */
  public async verifyPhoneOTP(confirmationResult: ConfirmationResult, code: string): Promise<UserCredential> {
    return confirmationResult.confirm(code);
  }

  /**
   * Sign Out
   */
  public async signOutUser(): Promise<void> {
    return signOut(auth);
  }
}

export const authService = new AuthService();

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<FirebaseUser | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
      setLoading(false);
    }, (err) => {
      console.error('Auth state change error:', err);
      setError(err.message);
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const handleSignInWithGoogle = async () => {
    try {
      setError(null);
      return await authService.signInWithGoogle();
    } catch (err: any) {
      console.error('Google Sign In error:', err);
      setError(err.message || 'Failed to sign in with Google');
      throw err;
    }
  };

  const handleSignUpWithEmail = async (email: string, pass: string, displayName?: string) => {
    try {
      setError(null);
      return await authService.signUpWithEmail(email, pass, displayName);
    } catch (err: any) {
      console.error('Email Sign Up error:', err);
      setError(err.message || 'Failed to sign up with email');
      throw err;
    }
  };

  const handleSignInWithEmail = async (email: string, pass: string) => {
    try {
      setError(null);
      return await authService.signInWithEmail(email, pass);
    } catch (err: any) {
      console.error('Email Sign In error:', err);
      setError(err.message || 'Failed to sign in with email');
      throw err;
    }
  };

  const handleSendPhoneOTP = async (phoneNumber: string, appVerifier: RecaptchaVerifier) => {
    try {
      setError(null);
      return await authService.sendPhoneOTP(phoneNumber, appVerifier);
    } catch (err: any) {
      console.error('Send Phone OTP error:', err);
      setError(err.message || 'Failed to send phone verification code');
      throw err;
    }
  };

  const handleVerifyPhoneOTP = async (confirmationResult: ConfirmationResult, code: string) => {
    try {
      setError(null);
      return await authService.verifyPhoneOTP(confirmationResult, code);
    } catch (err: any) {
      console.error('Verify Phone OTP error:', err);
      setError(err.message || 'Failed to verify OTP code');
      throw err;
    }
  };

  const handleSignOutUser = async () => {
    try {
      setError(null);
      await authService.signOutUser();
    } catch (err: any) {
      console.error('Sign Out error:', err);
      setError(err.message || 'Failed to sign out');
      throw err;
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        loading,
        error,
        signInWithGoogle: handleSignInWithGoogle,
        signUpWithEmail: handleSignUpWithEmail,
        signInWithEmail: handleSignInWithEmail,
        sendPhoneOTP: handleSendPhoneOTP,
        verifyPhoneOTP: handleVerifyPhoneOTP,
        signOutUser: handleSignOutUser
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
