'use client';
import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import Cookies from 'js-cookie';

export type Role = 'ADMIN' | 'MANAGER' | 'MEMBER';
export type Country = 'INDIA' | 'AMERICA' | null;

export interface User {
  id: string;
  name: string;
  email: string;
  role: Role;
  country: Country;
}

interface AuthContextType {
  user: User | null;
  token: string | null;
  login: (email: string, password: string) => Promise<void>;
  logout: () => void;
  switchUser: (email: string) => Promise<void>; // Identity switcher for demo
  loading: boolean;
}

const AuthContext = createContext<AuthContextType | null>(null);

const GQL = process.env.NEXT_PUBLIC_GRAPHQL_URL ?? 'http://localhost:4000/graphql';

async function gqlLogin(email: string, password: string) {
  const res = await fetch(GQL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      query: `mutation Login($email: String!, $password: String!) {
        login(email: $email, password: $password) {
          accessToken
          user { id name email role country }
        }
      }`,
      variables: { email, password },
    }),
  });
  const { data, errors } = await res.json();
  if (errors) throw new Error(errors[0].message);
  return data.login;
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const savedToken = Cookies.get('slooze_token');
    const savedUser = Cookies.get('slooze_user');
    if (savedToken && savedUser) {
      setToken(savedToken);
      setUser(JSON.parse(savedUser));
    }
    setLoading(false);
  }, []);

  const login = async (email: string, password: string) => {
    const { accessToken, user: u } = await gqlLogin(email, password);
    Cookies.set('slooze_token', accessToken, { expires: 7 });
    Cookies.set('slooze_user', JSON.stringify(u), { expires: 7 });
    setToken(accessToken);
    setUser(u);
  };

  // Identity switcher: logs in as another team member (all use password123)
  const switchUser = async (email: string) => {
    await login(email, 'password123');
  };

  const logout = () => {
    Cookies.remove('slooze_token');
    Cookies.remove('slooze_user');
    setToken(null);
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, token, login, logout, switchUser, loading }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
