import React, { useState } from "react";
import { Trash2, AlertTriangle } from "lucide-react";
import { 
  Dialog, 
  DialogContent, 
  DialogDescription, 
  DialogFooter, 
  DialogHeader, 
  DialogTitle,
  DialogTrigger 
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";

interface AccountDeletionDialogProps {
  children: React.ReactNode;
  onConfirm: () => void;
  isLoading?: boolean;
}

export function AccountDeletionDialog({ children, onConfirm, isLoading = false }: AccountDeletionDialogProps) {
  const [isOpen, setIsOpen] = useState(false);

  const handleConfirm = () => {
    onConfirm();
    setIsOpen(false);
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        {children}
      </DialogTrigger>
      <DialogContent className="bg-[#161611] border-[#383528] text-white sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-red-400">
            <AlertTriangle className="h-5 w-5" />
            Delete Account
          </DialogTitle>
          <DialogDescription className="text-neutral-300">
            This action cannot be undone. This will permanently delete your account and remove all your data.
          </DialogDescription>
        </DialogHeader>
        
        <Alert className="border-red-500/20 bg-red-500/10">
          <AlertTriangle className="h-4 w-4 text-red-400" />
          <AlertDescription className="text-neutral-300">
            <strong className="text-red-400">What will be deleted:</strong>
            <ul className="mt-2 list-disc list-inside space-y-1 text-sm">
              <li>Your account and login credentials</li>
              <li>Your "My Bar" ingredient collection</li>
              <li>Your preferred brands and settings</li>
              <li>All your personalized data</li>
            </ul>
          </AlertDescription>
        </Alert>

        <DialogFooter className="gap-2">
          <Button 
            variant="outline" 
            onClick={() => setIsOpen(false)}
            className="border-[#383528] text-white hover:bg-[#383528]"
          >
            Cancel
          </Button>
          <Button 
            variant="destructive" 
            onClick={handleConfirm}
            disabled={isLoading}
            className="bg-red-600 hover:bg-red-700 text-white"
          >
            {isLoading ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                Deleting...
              </>
            ) : (
              <>
                <Trash2 className="mr-2 h-4 w-4" />
                Delete Account
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}