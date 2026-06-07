import { createContext, useContext, useEffect, useMemo, useState } from 'react';
import {
  browserLocalPersistence,
  createUserWithEmailAndPassword,
  onAuthStateChanged,
  setPersistence,
  signInWithEmailAndPassword,
  signOut,
} from 'firebase/auth';
import { doc, getDoc, serverTimestamp, setDoc } from 'firebase/firestore';
import { auth, db, hasFirebaseConfig } from '../firebase';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [userProfile, setUserProfile] = useState(null);
  const [loading, setLoading] = useState(hasFirebaseConfig);

  const loadUserProfile = async (firebaseUser) => {
    if (!firebaseUser || !db) {
      setUserProfile(null);
      return null;
    }

    const profileSnap = await getDoc(doc(db, 'users', firebaseUser.uid));
    const profile = profileSnap.exists() ? profileSnap.data() : null;
    setUserProfile(profile);
    return profile;
  };

  useEffect(() => {
    if (!hasFirebaseConfig || !auth) {
      setLoading(false);
      return undefined;
    }

    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      setUser(firebaseUser);

      try {
        await loadUserProfile(firebaseUser);
      } catch (error) {
        console.error('사용자 정보를 불러오지 못했습니다.', error);
        setLoading(false);
      } finally {
        setLoading(false);
      }
    });

    return unsubscribe;
  }, []);

  const login = async (email, password) => {
    if (!auth) {
      throw new Error('Firebase 환경변수를 client/.env에 설정해 주세요.');
    }

    // 브라우저를 닫았다가 다시 열어도 로그인 상태를 유지합니다.
    await setPersistence(auth, browserLocalPersistence);
    return signInWithEmailAndPassword(auth, email, password);
  };

  const register = async (email, password, userType) => {
    if (!auth || !db) {
      throw new Error('Firebase 환경변수를 client/.env에 설정해 주세요.');
    }

    await setPersistence(auth, browserLocalPersistence);
    const result = await createUserWithEmailAndPassword(auth, email, password);

    const profile = {
      uid: result.user.uid,
      email: result.user.email,
      userType,
      createdAt: serverTimestamp(),
    };

    await setDoc(doc(db, 'users', result.user.uid), profile);

    // 회원가입 직후에도 사용자 유형을 전역 상태에 바로 반영합니다.
    await loadUserProfile(result.user);
    return result;
  };

  const logout = async () => {
    if (auth) {
      await signOut(auth);
    }
  };

  const value = useMemo(
    () => ({
      user,
      userProfile,
      loading,
      login,
      register,
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
