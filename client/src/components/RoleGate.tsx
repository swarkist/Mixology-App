import { useAuth } from "@/hooks/useAuth";

interface RoleGateProps {
  children: React.ReactNode;
  role?: 'admin' | 'basic' | 'reviewer';
  roles?: ('admin' | 'basic' | 'reviewer')[];
  fallback?: React.ReactNode;
  onAuthCheck?: (isAuthorized: boolean) => void;
}

export function RoleGate({ children, role, roles, fallback = null, onAuthCheck }: RoleGateProps) {
  const { user, isLoading } = useAuth();

  if (isLoading) {
    return null;
  }

  // Support both single role and multiple roles
  const allowedRoles = roles || (role ? [role] : []);
  const isAuthorized = user && allowedRoles.includes(user.role);
  
  // Call onAuthCheck callback if provided
  if (onAuthCheck) {
    onAuthCheck(!!isAuthorized);
  }

  if (!isAuthorized) {
    return <>{fallback}</>;
  }

  return <>{children}</>;
}