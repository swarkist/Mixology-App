import { useAuth } from "@/hooks/useAuth";

interface RoleGateProps {
  children: React.ReactNode;
  role: 'admin' | 'basic';
  fallback?: React.ReactNode;
}

export function RoleGate({ children, role, fallback = null }: RoleGateProps) {
  const { user, isLoading } = useAuth();

  if (isLoading) {
    return null;
  }

  if (!user || user.role !== role) {
    return <>{fallback}</>;
  }

  return <>{children}</>;
}