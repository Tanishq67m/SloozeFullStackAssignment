'use client';
import { ReactNode } from 'react';
import { useAuth, Role } from '@/lib/auth-context';

interface AccessGateProps {
  roles: Role[];
  children: ReactNode;
  fallback?: ReactNode;
}

/**
 * AccessGate — mirrors backend RBAC on the frontend.
 * Wraps any UI element and only renders it if the current user's
 * role is in the allowed roles list.
 *
 * Usage:
 *   <AccessGate roles={['ADMIN']}>
 *     <Button>Modify Payment Method</Button>
 *   </AccessGate>
 */
export function AccessGate({ roles, children, fallback = null }: AccessGateProps) {
  const { user } = useAuth();
  if (!user) return null;
  if (!roles.includes(user.role)) return <>{fallback}</>;
  return <>{children}</>;
}

// Convenience wrappers
export const AdminOnly = ({ children }: { children: ReactNode }) => (
  <AccessGate roles={['ADMIN']}>{children}</AccessGate>
);

export const ManagerAndAbove = ({ children }: { children: ReactNode }) => (
  <AccessGate roles={['ADMIN', 'MANAGER']}>{children}</AccessGate>
);
