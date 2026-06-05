import { createContext, useContext, useEffect, useMemo, useState } from 'react';
import { onAuthStateChanged, signOut } from 'firebase/auth';
import { doc, getDoc } from 'firebase/firestore';
import { auth, db, hasFirebaseConfig } from '../firebase';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [userProfile, setUserProfile] = useState(null);
  const [loading, setLoading] = useState(hasFirebaseConfig);

  useEffect(() => {
    if (!hasFirebaseConfig || !auth) {
      setLoading(false);
      return undefined;
    }

    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      setUser(firebaseUser);

      if (!firebaseUser || !db) {
        setUserProfile(null);
        setLoading(false);
        return;
      }

      const profileRef = doc(db, 'users', firebaseUser.uid);
      const profileSnap = await getDoc(profileRef);
      setUserProfile(profileSnap.exists() ? profileSnap.data() : null);
      setLoading(false);
    });

    return unsubscribe;
  }, []);

  const logout = () => {
    if (!auth) {
      return Promise.resolve();
    }

    return signOut(auth);
  };

  const value = useMemo(
    () => ({
      user,
      userProfile,
      loading,
      logout,
      isConfigured: hasFirebaseConfig,
    }),
    [user, userProfile, loading],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);

  if (!context) {
    throw new Error('useAuth must be used inside AuthProvider.');
  }

  return context;
}
