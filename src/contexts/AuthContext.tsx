import React, { createContext, useContext, useEffect, useState } from 'react';
import { User as FirebaseUser, onAuthStateChanged, signInWithPopup, GoogleAuthProvider, signOut as firebaseSignOut } from 'firebase/auth';
import { doc, getDoc, setDoc, serverTimestamp } from 'firebase/firestore';
import { auth, db, handleFirestoreError, OperationType } from '../firebase';
import { supabase } from '../lib/supabase';
import { User as SupabaseUser } from '@supabase/supabase-js';

interface AuthContextType {
  user: (FirebaseUser | SupabaseUser) | null;
  authType: 'firebase' | 'supabase' | null;
  cravePoints: number;
  isAuthReady: boolean;
  login: () => Promise<void>;
  loginWithEmail: (email: string, password: string) => Promise<void>;
  signUpWithEmail: (email: string, password: string, name: string) => Promise<void>;
  logout: () => Promise<void>;
  updateCravePoints: (points: number) => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<(FirebaseUser | SupabaseUser) | null>(null);
  const [authType, setAuthType] = useState<'firebase' | 'supabase' | null>(null);
  const [cravePoints, setCravePoints] = useState(0);
  const [isAuthReady, setIsAuthReady] = useState(false);

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
          } else {
            const newProfile = {
              uid: currentUser.uid,
              email: currentUser.email,
              displayName: currentUser.displayName,
              photoURL: currentUser.photoURL,
              cravePoints: 0,
              createdAt: serverTimestamp()
            };
            await setDoc(userRef, newProfile);
            setCravePoints(0);
          }
        } catch (error) {
          handleFirestoreError(error, OperationType.GET, `users/${currentUser.uid}`);
        }
      } else if (authType === 'firebase') {
        setUser(null);
        setAuthType(null);
        setCravePoints(0);
      }
      setIsAuthReady(true);
    });

    // Supabase Auth Listener
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (session?.user) {
        setUser(session.user);
        setAuthType('supabase');
        
        // Fetch points from Supabase 'profiles' table
        const { data: profile, error } = await supabase
          .from('profiles')
          .select('crave_points')
          .eq('id', session.user.id)
          .single();

        if (error && error.code !== 'PGRST116') {
          console.error('Error fetching Supabase profile:', error);
        }

        if (profile) {
          setCravePoints(profile.crave_points || 0);
        } else {
          // Create profile if it doesn't exist
          const { error: insertError } = await supabase
            .from('profiles')
            .insert({
              id: session.user.id,
              email: session.user.email,
              display_name: session.user.user_metadata.full_name || session.user.email?.split('@')[0],
              crave_points: 0
            });
          
          if (insertError) console.error('Error creating Supabase profile:', insertError);
          setCravePoints(0);
        }
      } else if (authType === 'supabase') {
        setUser(null);
        setAuthType(null);
        setCravePoints(0);
      }
      setIsAuthReady(true);
    });

    return () => {
      unsubscribeFirebase();
      subscription.unsubscribe();
    };
  }, [authType]);

  const login = async () => {
    const provider = new GoogleAuthProvider();
    try {
      await signInWithPopup(auth, provider);
    } catch (error) {
      console.error("Login failed", error);
    }
  };

  const loginWithEmail = async (email: string, password: string) => {
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) throw error;
  };

  const signUpWithEmail = async (email: string, password: string, name: string) => {
    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          full_name: name
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

  return (
    <AuthContext.Provider value={{ user, authType, cravePoints, isAuthReady, login, loginWithEmail, signUpWithEmail, logout, updateCravePoints }}>
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
