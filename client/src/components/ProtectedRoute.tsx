import { useAuth } from "@/hooks/useAuth";
import { useLocation } from "wouter";
import { useEffect } from "react";

interface ProtectedRouteProps {
  children: React.ReactNode;
  requireRole?: 'admin' | 'basic';
  redirectTo?: string;
}

export function ProtectedRoute({ 
  children, 
  requireRole,
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

      if (requireRole && user.role !== requireRole) {
        setLocation('/'); // Redirect to home if insufficient permissions
        return;
      }
    }
  }, [user, isLoading, requireRole, redirectTo, setLocation]);

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

  return <>{children}</>;
}