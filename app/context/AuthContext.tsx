// app/context/AuthContext.tsx
"use client";

import React, { createContext, useContext, useEffect, useState, useCallback } from "react";
import { onAuthStateChanged, User } from "firebase/auth";
import { auth } from "@/app/lib/firebase";
import { useRouter, usePathname } from "next/navigation";

// Define a frontend interface for the User Profile
export interface UserProfile {
  _id: string;
  uid: string;
  email: string;
  name: string;
  phone?: string;
  roles: string[];
  createdAt?: string;
  updatedAt?: string;
}

interface AuthContextType {
  user: User | null;
  profile: UserProfile | null;
  loading: boolean;
  role: string | null;
  token: string | null;
  refreshProfile: () => Promise<void>; // Added function to sync data manually
}

export const AuthContext = createContext<AuthContextType>({ 
  user: null, 
  profile: null,
  loading: true, 
  role: null,
  token: null,
  refreshProfile: async () => {} 
});

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [role, setRole] = useState<string | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();
  const pathname = usePathname();

  const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000';

  // Function to fetch profile data from backend
  const fetchProfileData = useCallback(async (currentUser: User) => {
    try {
      const idToken = await currentUser.getIdToken();
      setToken(idToken);

      const res = await fetch(`${API_URL}/api/users/me`, {
          headers: { 
            'Authorization': `Bearer ${idToken}`,
            'Content-Type': 'application/json'
          }
      });

      if (res.ok) {
          const data: UserProfile = await res.json();
          setProfile(data);
          setRole(data.roles?.[0] || 'customer');
      } else {
          setRole('customer');
      }
    } catch (error) {
      console.error("Failed to connect to backend", error);
      setRole('customer');
    }
  }, [API_URL]);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      if (firebaseUser) {
        setUser(firebaseUser);
        await fetchProfileData(firebaseUser);
      } else {
        setUser(null);
        setProfile(null);
        setRole(null);
        setToken(null);
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, [fetchProfileData]);

  // Exposed function to allow components to trigger a profile refresh
  const refreshProfile = async () => {
    if (user) {
      await fetchProfileData(user);
    }
  };

  // Route Protection
  useEffect(() => {
    if (loading) return;

    if (!user && pathname.startsWith("/dashboard")) {
        router.push("/auth");
        return;
    }

    if (user && role) {
        if (pathname.startsWith("/dashboard/admin")) {
            if (role === "receptionist") router.push("/dashboard/receptionist");
            else if (role === "customer") router.push("/dashboard/customer");
        }
        if (pathname.startsWith("/dashboard/receptionist") && role === "customer") {
            router.push("/dashboard/customer");
        }
    }
  }, [user, loading, role, pathname, router]);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen w-screen bg-white">
        <div className="flex flex-col items-center gap-3">
            <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-blue-600"></div>
            <p className="text-gray-500 text-sm font-medium">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <AuthContext.Provider value={{ user, profile, loading, role, token, refreshProfile }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);