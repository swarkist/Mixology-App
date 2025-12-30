import { useAuth } from "@/hooks/useAuth";
import { useLocation } from "wouter";
import { useEffect } from "react";

interface ProtectedRouteProps {
  children: React.ReactNode;
  requireRole?: 'admin' | 'basic' | 'reviewer';
  requireRoles?: ('admin' | 'basic' | 'reviewer')[];
  redirectTo?: string;
}

// E2E testing bypass: check env var OR window flag (for Playwright injection)
const isE2EMode = import.meta.env.VITE_E2E === 'true' || 
  (typeof window !== 'undefined' && (window as any).__E2E_MODE__ === true);
const getE2ERole = (): 'admin' | 'basic' | 'reviewer' => {
  if (typeof window !== 'undefined' && (window as any).__E2E_ROLE__) {
    return (window as any).__E2E_ROLE__;
  }
  return (import.meta.env.VITE_E2E_ROLE as 'admin' | 'basic' | 'reviewer') || 'basic';
};

export function ProtectedRoute({ 
  children, 
  requireRole,
  requireRoles,
  redirectTo = '/login' 
}: ProtectedRouteProps) {
  const { user, isLoading } = useAuth();
  const [, setLocation] = useLocation();

  useEffect(() => {
    if (isE2EMode) return;
    
    if (!isLoading) {
      if (!user) {
        setLocation(redirectTo);
        return;
      }

      if (requireRole && user.role !== requireRole) {
        setLocation('/');
        return;
      }

      if (requireRoles && !requireRoles.includes(user.role)) {
        setLocation('/');
        return;
      }
    }
  }, [user, isLoading, requireRole, requireRoles, redirectTo, setLocation]);

  if (isE2EMode) {
    const e2eRole = getE2ERole();
    if (requireRole && e2eRole !== requireRole) {
      return null;
    }
    if (requireRoles && !requireRoles.includes(e2eRole)) {
      return null;
    }
    return <>{children}</>;
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#f2c40c]"></div>
      </div>
    );
  }

  if (!user) {
    return null;
  }

  if (requireRole && user.role !== requireRole) {
    return null;
  }

  if (requireRoles && !requireRoles.includes(user.role)) {
    return null;
  }

  return <>{children}</>;
}