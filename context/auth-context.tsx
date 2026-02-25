import React, { createContext, useContext, useState, useEffect, useMemo, ReactNode } from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";
import * as Crypto from "expo-crypto";

export type UserRole = "client" | "artisan" | "admin";

export interface User {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  verified?: boolean;
  phone?: string;
  avatar?: string;
  trustScore?: number;
  housingScore?: number;
  kycStatus?: "pending" | "verified" | "rejected";
  revenue?: number;
  createdAt: string;
}

interface AuthContextValue {
  user: User | null;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (data: RegisterData) => Promise<void>;
  logout: () => Promise<void>;
  updateUser: (data: Partial<User>) => Promise<void>;
}

export interface RegisterData {
  name: string;
  email: string;
  password: string;
  role: UserRole;
  phone?: string;
}

const AuthContext = createContext<AuthContextValue | null>(null);

const STORAGE_KEY = "@maison_user";
const USERS_KEY = "@maison_users";

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadUser();
  }, []);

  async function loadUser() {
    try {
      const stored = await AsyncStorage.getItem(STORAGE_KEY);
      if (stored) {
        setUser(JSON.parse(stored));
      }
    } catch { }
    setIsLoading(false);
  }

  async function getUsers(): Promise<Record<string, { user: User; password: string }>> {
    try {
      const stored = await AsyncStorage.getItem(USERS_KEY);
      return stored ? JSON.parse(stored) : {};
    } catch {
      return {};
    }
  }

  async function saveUsers(users: Record<string, { user: User; password: string }>) {
    await AsyncStorage.setItem(USERS_KEY, JSON.stringify(users));
  }

  async function login(email: string, password: string) {
    const users = await getUsers();
    const record = users[email.toLowerCase()];
    if (!record || record.password !== password) {
      throw new Error("Email ou mot de passe incorrect");
    }
    setUser(record.user);
    await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(record.user));
  }

  async function register(data: RegisterData) {
    const users = await getUsers();
    if (users[data.email.toLowerCase()]) {
      throw new Error("Un compte avec cet email existe déjà");
    }
    const newUser: User = {
      id: Crypto.randomUUID(),
      name: data.name,
      email: data.email,
      role: data.role,
      phone: data.phone,
      trustScore: data.role === "artisan" ? 4.2 : undefined,
      housingScore: data.role === "client" ? 72 : undefined,
      kycStatus: data.role === "artisan" ? "pending" : undefined,
      revenue: data.role === "artisan" ? 0 : undefined,
      createdAt: new Date().toISOString(),
    };
    users[data.email.toLowerCase()] = { user: newUser, password: data.password };
    await saveUsers(users);
    setUser(newUser);
    await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(newUser));
  }

  async function logout() {
    setUser(null);
    await AsyncStorage.removeItem(STORAGE_KEY);
  }

  async function updateUser(data: Partial<User>) {
    if (!user) return;
    const updated = { ...user, ...data };
    setUser(updated);
    await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
    const users = await getUsers();
    if (users[user.email.toLowerCase()]) {
      users[user.email.toLowerCase()].user = updated;
      await saveUsers(users);
    }
  }

  const value = useMemo<AuthContextValue>(
    () => ({ user, isLoading, login, register, logout, updateUser }),
    [user, isLoading]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}
