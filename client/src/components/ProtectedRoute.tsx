import { useAuth } from "@/hooks/useAuth";
import { useLocation } from "wouter";
import { useEffect } from "react";

interface ProtectedRouteProps {
  children: React.ReactNode;
  requireRole?: 'admin' | 'basic' | 'reviewer';
  requireRoles?: ('admin' | 'basic' | 'reviewer')[];
  redirectTo?: string;
}

export function ProtectedRoute({ 
  children, 
  requireRole,
  requireRoles,
  redirectTo = '/login' 
}: ProtectedRouteProps) {
  const { user, isLoading } = useAuth();
  const [, setLocation] = useLocation();

  useEffect(() => {
    if (!isLoading) {
      if (!user) {
        setLocation(redirectTo);
        return;
      }

      // Check single role requirement
      if (requireRole && user.role !== requireRole) {
        setLocation('/'); // Redirect to home if insufficient permissions
        return;
      }

      // Check multiple roles requirement
      if (requireRoles && !requireRoles.includes(user.role)) {
        setLocation('/'); // Redirect to home if insufficient permissions
        return;
      }
    }
  }, [user, isLoading, requireRole, requireRoles, redirectTo, setLocation]);

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