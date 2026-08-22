import React, { createContext, useContext, useEffect, useState } from 'react';
import { 
  auth, 
  googleProvider, 
  signInWithPopup, 
  signInAnonymously,
  signOut, 
  onAuthStateChanged,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  updateProfile,
  User,
  db,
  doc,
  setDoc,
  getDoc,
  handleFirestoreError,
  OperationType
} from '../firebase';

interface AuthContextType {
  currentUser: User | null;
  loading: boolean;
  isAuthModalOpen: boolean;
  openAuthModal: () => void;
  closeAuthModal: () => void;
  loginWithGoogle: () => Promise<void>;
  loginWithEmail: (email: string, pass: string) => Promise<void>;
  signupWithEmail: (email: string, pass: string, name: string) => Promise<void>;
  loginAsGuest: () => Promise<void>;
  logout: () => Promise<void>;
  authError: string | null;
  setAuthError: (err: string | null) => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [isAuthModalOpen, setIsAuthModalOpen] = useState<boolean>(false);
  const [authError, setAuthError] = useState<string | null>(null);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      setCurrentUser(user);
      setLoading(false);

      // If user logs in, ensure their user profile exists in Firestore and Cloud SQL database
      if (user) {
        try {
          const token = await user.getIdToken();
          
          // Sync with Cloud SQL backend
          fetch('/api/auth/sync', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              Authorization: `Bearer ${token}`,
            },
            body: JSON.stringify({
              displayName: user.displayName,
              photoURL: user.photoURL,
            }),
          }).catch(e => console.warn('Cloud SQL auth sync notice:', e));

          // Also ensure Firestore document exists
          const userDocRef = doc(db, 'users', user.uid);
          const userSnap = await getDoc(userDocRef);
          
          if (!userSnap.exists()) {
            await setDoc(userDocRef, {
              userId: user.uid,
              email: user.email || (user.isAnonymous ? 'guest@ledger.app' : ''),
              displayName: user.displayName || (user.isAnonymous ? 'Guest Trader' : (user.email?.split('@')[0] || 'User')),
              photoURL: user.photoURL || '',
              usdBalance: 0.00,
              bdtBalance: 0.00,
              totalDepositedUSD: 0.00,
              totalWithdrawnUSD: 0.00,
              totalRealizedPnL: 0.00,
              createdAt: new Date().toISOString(),
              updatedAt: new Date().toISOString(),
            }, { merge: true });
          }
        } catch (err) {
          console.warn('Error syncing initial user doc:', err);
        }
      }
    });

    return () => unsubscribe();
  }, []);

  const openAuthModal = () => {
    setAuthError(null);
    setIsAuthModalOpen(true);
  };

  const closeAuthModal = () => {
    setAuthError(null);
    setIsAuthModalOpen(false);
  };

  const loginWithGoogle = async () => {
    setAuthError(null);
    try {
      await signInWithPopup(auth, googleProvider);
      setIsAuthModalOpen(false);
    } catch (err: any) {
      console.warn('Google login notice:', err);
      let errorMsg = 'Google লগইন সম্পন্ন করা যায়নি।';
      const msgStr = (err?.message || '').toLowerCase();
      
      if (err?.code === 'auth/popup-closed-by-user' || msgStr.includes('closed') || msgStr.includes('closing')) {
        errorMsg = 'Google লগইন পপআপ উইন্ডোটি বন্ধ হয়ে গিয়েছে। আপনি নিচে ওয়ান-ক্লিক গেস্ট অ্যাকাউন্ট বা ইমেইল দিয়ে সহজে লগইন করতে পারেন।';
      } else if (err?.code === 'auth/popup-blocked') {
        errorMsg = 'আপনার ব্রাউজার পপআপ উইন্ডো ব্লক করেছে। অনুগ্রহ করে ব্রাউজার সেটিংসে পপআপ অ্যালাউ করুন অথবা ইমেইল দিয়ে সাইন ইন করুন।';
      } else if (err?.code === 'auth/cancelled-popup-request') {
        errorMsg = 'পূর্বের লগইন রিকোয়েস্ট বাতিল করা হয়েছে। আবার চেষ্টা করুন।';
      } else if (err?.code === 'auth/network-request-failed') {
        errorMsg = 'ইন্টারনেট সংযোগ চেক করুন এবং পুনরায় চেষ্টা করুন।';
      } else if (msgStr.includes('database') || msgStr.includes('indexeddb')) {
        errorMsg = 'ব্রাউজার স্টোরেজ রিফ্রেশ হয়েছে। অনুগ্রহ করে আবার চেষ্টা করুন অথবা গেস্ট একাউন্টে ক্লিক করুন।';
      } else if (err?.message) {
        errorMsg = `লগইন এরর: ${err.message}`;
      }
      setAuthError(errorMsg);
      throw err;
    }
  };

  const loginWithEmail = async (email: string, pass: string) => {
    setAuthError(null);
    try {
      await signInWithEmailAndPassword(auth, email, pass);
      setIsAuthModalOpen(false);
    } catch (err: any) {
      console.error('Email login error:', err);
      let msg = 'লগইন ব্যর্থ হয়েছে। ইমেইল এবং পাসওয়ার্ড চেক করুন।';
      if (err.code === 'auth/user-not-found' || err.code === 'auth/wrong-password' || err.code === 'auth/invalid-credential') {
        msg = 'ভুল ইমেইল অথবা পাসওয়ার্ড (Invalid credentials)';
      } else if (err.code === 'auth/invalid-email') {
        msg = 'সঠিক ইমেইল অ্যাড্রেস লিখুন (Invalid email format)';
      } else if (err.code === 'auth/too-many-requests') {
        msg = 'অতিরিক্ত ভুল চেষ্টার কারণে সাময়িক ব্লক হয়েছে। কিছুক্ষণ পর চেষ্টা করুন।';
      }
      setAuthError(msg);
      throw err;
    }
  };

  const signupWithEmail = async (email: string, pass: string, name: string) => {
    setAuthError(null);
    try {
      const userCred = await createUserWithEmailAndPassword(auth, email, pass);
      if (name.trim()) {
        await updateProfile(userCred.user, { displayName: name });
      }
      setIsAuthModalOpen(false);
    } catch (err: any) {
      console.error('Signup error:', err);
      let msg = 'সাইন আপ ব্যর্থ হয়েছে। আবার চেষ্টা করুন।';
      if (err.code === 'auth/email-already-in-use') {
        msg = 'এই ইমেইল দিয়ে ইতিপূর্বে একাউন্ট খোলা হয়েছে (Email already in use)। লগইন করার চেষ্টা করুন।';
      } else if (err.code === 'auth/weak-password') {
        msg = 'পাসওয়ার্ড অন্তত ৬ অক্ষরের হতে হবে (Password must be at least 6 characters)';
      } else if (err.code === 'auth/invalid-email') {
        msg = 'সঠিক ফরম্যাটের ইমেইল অ্যাড্রেস লিখুন';
      }
      setAuthError(msg);
      throw err;
    }
  };

  const loginAsGuest = async () => {
    setAuthError(null);
    try {
      await signInAnonymously(auth);
      setIsAuthModalOpen(false);
    } catch (err: any) {
      console.error('Guest login error:', err);
      setAuthError('গেস্ট লগইন সম্পন্ন করা যায়নি। ইমেইল লগইন চেষ্টা করুন।');
      throw err;
    }
  };

  const logout = async () => {
    try {
      await signOut(auth);
    } catch (err) {
      console.error('Sign out error:', err);
    }
  };

  return (
    <AuthContext.Provider
      value={{
        currentUser,
        loading,
        isAuthModalOpen,
        openAuthModal,
        closeAuthModal,
        loginWithGoogle,
        loginWithEmail,
        signupWithEmail,
        loginAsGuest,
        logout,
        authError,
        setAuthError,
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
