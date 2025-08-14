import { useAuth } from "@/hooks/useAuth";

interface RoleGateProps {
  children: React.ReactNode;
  role: 'admin' | 'basic' | 'reviewer';
  roles?: ('admin' | 'basic' | 'reviewer')[];
  fallback?: React.ReactNode;
}

export function RoleGate({ children, role, roles, fallback = null }: RoleGateProps) {
  const { user, isLoading } = useAuth();

  if (isLoading) {
    return null;
  }

  // Support both single role and multiple roles
  const allowedRoles = roles || [role];
  if (!user || !allowedRoles.includes(user.role)) {
    return <>{fallback}</>;
  }

  return <>{children}</>;
}