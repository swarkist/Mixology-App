import { useAuth } from "@/hooks/useAuth";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Eye } from "lucide-react";

export function ReviewBanner() {
  const { user } = useAuth();

  if (!user || user.role !== 'reviewer') {
    return null;
  }

  return (
    <Alert className="mb-4 border-yellow-200 bg-yellow-50 text-yellow-800">
      <Eye className="h-4 w-4" />
      <AlertDescription>
        Review mode: you can make local changes but saving is disabled.
      </AlertDescription>
    </Alert>
  );
}