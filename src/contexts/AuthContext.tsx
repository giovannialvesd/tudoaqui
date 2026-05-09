import React, { createContext, useContext, useEffect, useState } from 'react';
import { User as FirebaseUser, onAuthStateChanged, GoogleAuthProvider, signInWithPopup, signOut as firebaseSignOut, createUserWithEmailAndPassword, signInWithEmailAndPassword } from 'firebase/auth';
import { doc, getDoc, setDoc, serverTimestamp } from 'firebase/firestore';
import { auth, db } from '../firebase/config';
import { handleFirestoreError, OperationType } from '../firebase/errors';

export type UserRole = 'client' | 'merchant' | 'driver' | 'provider' | 'admin' | 'super_admin' | 'city_admin' | 'city_editor' | 'city_support';

export interface UserProfile {
  userId: string;
  name: string;
  email: string | null;
  phone?: string;
  role: UserRole;
  cityId?: string; // Official city of residence/work
  createdAt: any;
  updatedAt: any;
  hasCompletedOnboarding: boolean;
}

interface AuthContextType {
  currentUser: FirebaseUser | null;
  userProfile: UserProfile | null;
  loading: boolean;
  signInWithGoogle: () => Promise<void>;
  signInWithEmail: (email: string, pass: string) => Promise<void>;
  registerWithEmail: (email: string, pass: string) => Promise<void>;
  logout: () => Promise<void>;
  updateRole: (role: UserRole) => Promise<void>;
  requestRoleUpgrade: (role: UserRole, formData: any) => Promise<void>;
  completeOnboarding: (data: Partial<UserProfile>) => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [currentUser, setCurrentUser] = useState<FirebaseUser | null>(null);
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      setCurrentUser(user);
      if (user) {
        try {
          const userDocRef = doc(db, 'users', user.uid);
          const userDoc = await getDoc(userDocRef).catch(e => handleFirestoreError(e, OperationType.GET, `users/${user.uid}`));
          
          if (userDoc && userDoc.exists()) {
            const data = userDoc.data() as UserProfile;
            // Admin override
            const lowerEmail = user.email?.toLowerCase();
            if ((lowerEmail === 'petzb.vidapet@gmail.com' || lowerEmail === 'alves.giovannic@gmail.com') && data.role !== 'super_admin') {
               data.role = 'super_admin';
               await setDoc(userDocRef, { role: 'super_admin', updatedAt: serverTimestamp() }, { merge: true }).catch(console.warn);
            }
            setUserProfile(data);
          } else if (userDoc !== undefined) {
             // New user, wait for onboarding
             setUserProfile(null);
          }
        } catch (error) {
          console.error("Error fetching user profile", error);
        }
      } else {
        setUserProfile(null);
      }
      setLoading(false);
    });

    return unsubscribe;
  }, []);

  const signInWithGoogle = async () => {
    try {
      const provider = new GoogleAuthProvider();
      await signInWithPopup(auth, provider);
    } catch (error: any) {
      if (error.code === 'auth/cancelled-popup-request' || error.code === 'auth/popup-closed-by-user') {
        console.warn('Sign-in popup closed by user.');
      } else {
        throw error;
      }
    }
  };

  const signInWithEmail = async (email: string, pass: string) => {
     await signInWithEmailAndPassword(auth, email, pass);
  };
  
  const registerWithEmail = async (email: string, pass: string) => {
     await createUserWithEmailAndPassword(auth, email, pass);
  };

  const logout = async () => {
    await firebaseSignOut(auth);
  };

  const completeOnboarding = async (data: Partial<UserProfile>) => {
    if (!currentUser) return;
    const userDocRef = doc(db, 'users', currentUser.uid);
    
    // Get city from localStorage if available
    const savedCitySlug = localStorage.getItem('current_city_slug');
    let cityId = data.cityId || '';
    
    if (!cityId && savedCitySlug) {
      // We might need to fetch the city ID from the slug if not provided, 
      // but for simplicity we assume it might be passed in data or fetched later.
      // Better: we can try to find it in the cities list if we had access here, 
      // but AuthContext doesn't have useCity.
    }

    // We assume default role is 'client'
    let calculatedRole = data.role || 'client';
    const lowerEmail = currentUser.email?.toLowerCase();
    if (lowerEmail === 'petzb.vidapet@gmail.com' || lowerEmail === 'alves.giovannic@gmail.com') {
      calculatedRole = 'super_admin';
    }

    const newProfile = {
      userId: currentUser.uid,
      name: data.name || currentUser.displayName || 'Novo Usuário',
      email: currentUser.email,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
      hasCompletedOnboarding: true,
      cityId: cityId,
      ...data,
      role: calculatedRole, // Ensure it overrides data.role if provided
    };

    try {
      await setDoc(userDocRef, newProfile).catch(e => handleFirestoreError(e, OperationType.CREATE, `users/${currentUser.uid}`));
      setUserProfile(newProfile as UserProfile);
    } catch (error) {
        console.error("Failed to complete onboarding", error);
        throw error;
    }
  };

  const updateRole = async (role: UserRole) => {
     if (!currentUser || !userProfile) return;
     const userDocRef = doc(db, 'users', currentUser.uid);
     try {
       await setDoc(userDocRef, { ...userProfile, role, updatedAt: serverTimestamp() }, { merge: true }).catch(e => handleFirestoreError(e, OperationType.UPDATE, `users/${currentUser.uid}`));
       setUserProfile({ ...userProfile, role });
     } catch(e) {
       console.error("Failed to update role", e);
     }
  }

  const requestRoleUpgrade = async (role: UserRole, formData: any) => {
    if (!currentUser || !userProfile) return;
    const requestRef = doc(db, 'role_requests', currentUser.uid);
    try {
      await setDoc(requestRef, {
        userId: currentUser.uid,
        cityId: userProfile.cityId || localStorage.getItem('current_city_id') || '',
        requestedRole: role,
        status: 'pending',
        formData,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp()
      }).catch(e => handleFirestoreError(e, OperationType.CREATE, `role_requests/${currentUser.uid}`));
    } catch(e) {
      console.error("Failed to request role upgrade", e);
      throw e;
    }
  }

  return (
    <AuthContext.Provider value={{ currentUser, userProfile, loading, signInWithGoogle, signInWithEmail, registerWithEmail, logout, updateRole, requestRoleUpgrade, completeOnboarding }}>
      {loading ? (
        <div className="h-screen w-full flex items-center justify-center bg-bg-base">
          <div className="animate-spin w-8 h-8 border-4 border-primary border-t-transparent rounded-full font-sans" />
        </div>
      ) : children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
