import { Share } from "lucide-react";
import { Button } from "@/components/ui/button";
import { isMobileOrTablet, imageToPngBlob, slugify, copyToClipboard, showCopyConfirmation } from "@/utils/shareUtils";
import { useToast } from "@/hooks/use-toast";
import { useState, useEffect } from "react";

interface ShareButtonProps {
  cocktail: {
    id: number;
    name: string;
    description?: string;
    imageUrl?: string;
  };
}

export function ShareButton({ cocktail }: ShareButtonProps) {
  const { toast } = useToast();
  const [isVisible, setIsVisible] = useState(false);

  // Check device capability and viewport on mount and resize
  useEffect(() => {
    const checkVisibility = () => {
      setIsVisible(isMobileOrTablet());
    };

    checkVisibility();
    window.addEventListener('resize', checkVisibility);
    return () => window.removeEventListener('resize', checkVisibility);
  }, []);

  // Listen for copy confirmation events
  useEffect(() => {
    const handleCopyEvent = (event: CustomEvent) => {
      toast({
        title: "Link copied!",
        description: "Share link has been copied to clipboard.",
      });
    };

    window.addEventListener('share:copied', handleCopyEvent as EventListener);
    return () => window.removeEventListener('share:copied', handleCopyEvent as EventListener);
  }, [toast]);

  const handleShare = async () => {
    const shareUrl = `${window.location.origin}/s/${cocktail.id}`;
    const shareTitle = cocktail.name;
    const shareText = `Check out ${cocktail.name} on Miximixology!`;

    try {
      // Phase 1: Try to share as image (preferred)
      if (cocktail.imageUrl && navigator.canShare) {
        const imageFile = await imageToPngBlob(cocktail.imageUrl);
        
        if (imageFile && navigator.canShare({ files: [imageFile] })) {
          const filename = `${slugify(cocktail.name)}.png`;
          const renamedFile = new File([imageFile], filename, { type: 'image/png' });
          
          try {
            await navigator.share({
              files: [renamedFile],
              title: shareTitle,
              text: shareText
            });
            return; // Success, exit early
          } catch (shareError) {
            // User cancelled or share failed, continue to link share
          }
        }
      }

      // Phase 2: Try to share as link
      if (navigator.share) {
        try {
          await navigator.share({
            title: shareTitle,
            text: shareText,
            url: shareUrl
          });
          return; // Success, exit early
        } catch (shareError) {
          // User cancelled or share failed, continue to copy
        }
      }

      // Phase 3: Copy link to clipboard (final fallback)
      const copied = await copyToClipboard(shareUrl);
      if (copied) {
        showCopyConfirmation();
      } else {
        // Ultimate fallback: show modal with selectable text
        const message = `Share this cocktail: ${shareUrl}`;
        prompt('Copy this link to share:', shareUrl) || alert(message);
      }
    } catch (error) {
      toast({
        title: "Share failed",
        description: "Unable to share this cocktail. Please try again.",
        variant: "destructive",
      });
    }
  };

  // Hide on desktop using CSS and JS check
  if (!isVisible) {
    return null;
  }

  return (
    <Button 
      variant="ghost" 
      size="sm" 
      className="text-white hover:bg-[#2a2920] min-h-[44px] min-w-[44px] share-button-mobile"
      onClick={handleShare}
      aria-label="Share cocktail"
      data-testid="button-share"
    >
      <Share className="w-4 h-4" />
    </Button>
  );
}