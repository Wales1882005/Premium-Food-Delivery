import React, { createContext, useContext, useEffect, useState } from 'react';
import { User as FirebaseUser, onAuthStateChanged, signInWithPopup, GoogleAuthProvider, signOut as firebaseSignOut, deleteUser, updateProfile as firebaseUpdateProfile } from 'firebase/auth';
import { doc, getDoc, setDoc, serverTimestamp } from 'firebase/firestore';
import { auth, db, handleFirestoreError, OperationType } from '../firebase';
import { supabase } from '../lib/supabase';
import { User as SupabaseUser } from '@supabase/supabase-js';

interface AuthContextType {
  user: (FirebaseUser | SupabaseUser) | null;
  authType: 'firebase' | 'supabase' | null;
  role: 'customer' | 'restaurant' | 'admin';
  cravePoints: number;
  isAuthReady: boolean;
  login: () => Promise<void>;
  loginWithEmail: (email: string, password: string) => Promise<void>;
  signUpWithEmail: (email: string, password: string, name: string, role?: 'customer' | 'restaurant') => Promise<void>;
  logout: () => Promise<void>;
  deleteAccount: () => Promise<void>;
  updateCravePoints: (points: number) => Promise<void>;
  updateProfileName: (name: string) => Promise<void>;
  refreshUser: () => Promise<void>;
  setRole: (role: 'customer' | 'restaurant' | 'admin') => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<(FirebaseUser | SupabaseUser) | null>(null);
  const [authType, setAuthType] = useState<'firebase' | 'supabase' | null>(null);
  const [role, setRole] = useState<'customer' | 'restaurant' | 'admin'>('customer');
  const [cravePoints, setCravePoints] = useState(0);
  const [isFirebaseReady, setIsFirebaseReady] = useState(false);
  const [isSupabaseReady, setIsSupabaseReady] = useState(false);

  const isAuthReady = isFirebaseReady && isSupabaseReady;

  useEffect(() => {
    // Firebase Auth Listener
    const unsubscribeFirebase = onAuthStateChanged(auth, async (currentUser) => {
      if (currentUser) {
        setUser(currentUser);
        setAuthType('firebase');
        try {
          const userRef = doc(db, 'users', currentUser.uid);
          const userSnap = await getDoc(userRef);
          
          if (userSnap.exists()) {
            setCravePoints(userSnap.data().cravePoints || 0);
            setRole(userSnap.data().role || 'customer');
          } else {
            const newProfile: any = {
              uid: currentUser.uid,
              email: currentUser.email || 'no-email@example.com',
              cravePoints: 0,
              role: 'customer',
              createdAt: serverTimestamp()
            };
            if (currentUser.displayName) newProfile.displayName = currentUser.displayName;
            if (currentUser.photoURL) newProfile.photoURL = currentUser.photoURL;
            
            await setDoc(userRef, newProfile);
            setCravePoints(0);
            setRole('customer');
          }
        } catch (error) {
          handleFirestoreError(error, OperationType.GET, `users/${currentUser.uid}`);
        }
      } else {
        setUser(prev => (prev && 'aud' in prev ? prev : null));
        setAuthType(prev => (prev === 'firebase' ? null : prev));
      }
      setIsFirebaseReady(true);
    });

    // Supabase Auth Listener
    const initSupabase = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (session?.user) {
        setUser(session.user);
        setAuthType('supabase');
        
        const { data: profile } = await supabase
          .from('profiles')
          .select('crave_points, role')
          .eq('id', session.user.id)
          .single();

        if (profile) {
          setCravePoints(profile.crave_points || 0);
          setRole(profile.role || 'customer');
        }
      }
      setIsSupabaseReady(true);
    };

    initSupabase();

    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (session?.user) {
        setUser(session.user);
        setAuthType('supabase');
        
        const { data: profile } = await supabase
          .from('profiles')
          .select('crave_points, role')
          .eq('id', session.user.id)
          .single();

        if (profile) {
          setCravePoints(profile.crave_points || 0);
          setRole(profile.role || 'customer');
        }
      } else {
        setUser(prev => (prev && 'uid' in prev ? prev : null));
        setAuthType(prev => (prev === 'supabase' ? null : prev));
      }
      setIsSupabaseReady(true);
    });

    return () => {
      unsubscribeFirebase();
      subscription.unsubscribe();
    };
  }, []);

  const login = async () => {
    const provider = new GoogleAuthProvider();
    try {
      await signInWithPopup(auth, provider);
    } catch (error: any) {
      if (error.code === 'auth/cancelled-popup-request' || error.code === 'auth/popup-closed-by-user') {
        console.log('Login popup closed by user.');
      } else {
        console.error("Login failed", error);
      }
    }
  };

  const loginWithEmail = async (email: string, password: string) => {
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) throw error;
  };

  const signUpWithEmail = async (email: string, password: string, name: string, selectedRole: 'customer' | 'restaurant' | 'admin' = 'customer') => {
    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          full_name: name,
          role: selectedRole
        }
      }
    });
    if (error) throw error;
  };

  const logout = async () => {
    try {
      if (authType === 'firebase') {
        await firebaseSignOut(auth);
      } else if (authType === 'supabase') {
        await supabase.auth.signOut();
      }
    } catch (error) {
      console.error("Logout failed", error);
    }
  };

  const deleteAccount = async () => {
    if (!user) return;

    try {
      if (authType === 'firebase') {
        const firebaseUser = user as FirebaseUser;
        // Delete user data from Firestore first
        try {
          const userRef = doc(db, 'users', firebaseUser.uid);
          await setDoc(userRef, { deleted: true, deletedAt: serverTimestamp() }, { merge: true });
        } catch (e) {
          console.error("Error marking user as deleted in Firestore", e);
        }
        // Delete the user from Firebase Auth
        await deleteUser(firebaseUser);
      } else if (authType === 'supabase') {
        const supabaseUser = user as SupabaseUser;
        // Delete profile from Supabase
        const { error: profileError } = await supabase
          .from('profiles')
          .delete()
          .eq('id', supabaseUser.id);
        
        if (profileError) console.error('Error deleting Supabase profile:', profileError);
        
        // Note: Supabase doesn't allow users to delete themselves from auth.users via client SDK 
        // without a service role or a specific RPC function. 
        // We'll just sign them out after deleting their profile.
        await supabase.auth.signOut();
      }
      
      setUser(null);
      setAuthType(null);
      setCravePoints(0);
    } catch (error) {
      console.error("Delete account failed", error);
      throw error;
    }
  };

  const updateProfileName = async (name: string) => {
    if (!user) return;
    try {
      if (authType === 'firebase') {
        await firebaseUpdateProfile(user as FirebaseUser, { displayName: name });
        await setDoc(doc(db, 'users', (user as SupabaseUser).id || (user as FirebaseUser).uid), { displayName: name }, { merge: true });
        // Force a re-render by updating the user state
        setUser({ ...user, displayName: name } as any);
      } else if (authType === 'supabase') {
        const { error } = await supabase.auth.updateUser({
          data: { full_name: name }
        });
        if (error) throw error;
        await supabase.from('profiles').update({ display_name: name }).eq('id', (user as SupabaseUser).id);
        setUser({ ...user, user_metadata: { ...((user as SupabaseUser).user_metadata || {}), full_name: name } } as any);
      }
    } catch (error) {
      console.error('Error updating profile name:', error);
      throw error;
    }
  };

  const updateCravePoints = async (points: number) => {
    if (!user) return;
    const newPoints = cravePoints + points;

    if (authType === 'firebase') {
      try {
        const userRef = doc(db, 'users', (user as FirebaseUser).uid);
        await setDoc(userRef, { cravePoints: newPoints }, { merge: true });
        setCravePoints(newPoints);
      } catch (error) {
        handleFirestoreError(error, OperationType.UPDATE, `users/${(user as FirebaseUser).uid}`);
      }
    } else if (authType === 'supabase') {
      const { error } = await supabase
        .from('profiles')
        .update({ crave_points: newPoints })
        .eq('id', (user as SupabaseUser).id);
      
      if (error) console.error('Error updating Supabase points:', error);
      else setCravePoints(newPoints);
    }
  };

  const refreshUser = async () => {
    if (!user) return;

    if (authType === 'firebase') {
      try {
        const userRef = doc(db, 'users', (user as FirebaseUser).uid);
        const userSnap = await getDoc(userRef);
        if (userSnap.exists()) {
          setCravePoints(userSnap.data().cravePoints || 0);
          setRole(userSnap.data().role || 'customer');
        }
      } catch (error) {
        handleFirestoreError(error, OperationType.GET, `users/${(user as FirebaseUser).uid}`);
      }
    } else if (authType === 'supabase') {
      const { data: profile, error } = await supabase
        .from('profiles')
        .select('crave_points, role')
        .eq('id', (user as SupabaseUser).id)
        .single();

      if (!error && profile) {
        setCravePoints(profile.crave_points || 0);
        setRole(profile.role || 'customer');
      }
    }
  };

  const updateRole = async (newRole: 'customer' | 'restaurant' | 'admin') => {
    if (!user) return;
    try {
      if (authType === 'firebase') {
        const userRef = doc(db, 'users', (user as FirebaseUser).uid);
        await setDoc(userRef, { role: newRole }, { merge: true });
        setRole(newRole);
      } else if (authType === 'supabase') {
        const { error } = await supabase
          .from('profiles')
          .update({ role: newRole })
          .eq('id', (user as SupabaseUser).id);
        if (error) throw error;
        setRole(newRole);
      }
    } catch (error) {
      console.error('Error updating role:', error);
      throw error;
    }
  };

  return (
    <AuthContext.Provider value={{ 
      user, 
      authType, 
      role, 
      cravePoints, 
      isAuthReady, 
      login, 
      loginWithEmail, 
      signUpWithEmail, 
      logout, 
      deleteAccount, 
      updateCravePoints, 
      updateProfileName, 
      refreshUser, 
      setRole: updateRole 
    }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
