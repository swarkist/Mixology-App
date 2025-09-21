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

    console.log('🍹 Share Debug: Starting share process', {
      cocktailId: cocktail.id,
      cocktailName: cocktail.name,
      imageUrl: cocktail.imageUrl,
      shareUrl,
      hasNavigatorShare: !!navigator.share,
      hasCanShare: !!navigator.canShare,
      userAgent: navigator.userAgent
    });

    try {
      // Phase 1: Try to share as image (preferred)
      if (cocktail.imageUrl && navigator.canShare) {
        console.log('🖼️ Share Debug: Attempting image share', {
          imageUrl: cocktail.imageUrl,
          isHttps: cocktail.imageUrl.startsWith('https://')
        });

        const imageFile = await imageToPngBlob(cocktail.imageUrl);
        console.log('🔄 Share Debug: Image conversion result', {
          success: !!imageFile,
          fileSize: imageFile?.size,
          fileType: imageFile?.type,
          fileName: imageFile?.name
        });
        
        if (imageFile) {
          const canShareFiles = navigator.canShare({ files: [imageFile] });
          console.log('✅ Share Debug: navigator.canShare check', {
            canShareFiles,
            fileObject: imageFile
          });

          if (canShareFiles) {
            const filename = `${slugify(cocktail.name)}.png`;
            const renamedFile = new File([imageFile], filename, { type: 'image/png' });
            
            console.log('📤 Share Debug: Attempting navigator.share with image', {
              filename,
              fileSize: renamedFile.size,
              shareData: {
                files: [renamedFile],
                title: shareTitle,
                text: shareText
              }
            });

            try {
              await navigator.share({
                files: [renamedFile],
                title: shareTitle,
                text: shareText
              });
              console.log('✅ Share Debug: Image share successful');
              return; // Success, exit early
            } catch (shareError) {
              console.log('❌ Share Debug: Image share failed', {
                error: shareError,
                errorName: (shareError as Error)?.name,
                errorMessage: (shareError as Error)?.message
              });
              // User cancelled or share failed, continue to link share
            }
          } else {
            console.log('❌ Share Debug: navigator.canShare returned false for files');
          }
        } else {
          console.log('❌ Share Debug: Image conversion failed (CORS or fetch error)');
        }
      } else {
        console.log('⏭️ Share Debug: Skipping image share', {
          hasImageUrl: !!cocktail.imageUrl,
          hasCanShare: !!navigator.canShare
        });
      }

      // Phase 2: Try to share as link
      if (navigator.share) {
        console.log('🔗 Share Debug: Attempting link share', {
          shareData: {
            title: shareTitle,
            text: shareText,
            url: shareUrl
          }
        });

        try {
          await navigator.share({
            title: shareTitle,
            text: shareText,
            url: shareUrl
          });
          console.log('✅ Share Debug: Link share successful');
          return; // Success, exit early
        } catch (shareError) {
          console.log('❌ Share Debug: Link share failed', {
            error: shareError,
            errorName: (shareError as Error)?.name,
            errorMessage: (shareError as Error)?.message
          });
          // User cancelled or share failed, continue to copy
        }
      } else {
        console.log('⏭️ Share Debug: No navigator.share available');
      }

      // Phase 3: Copy link to clipboard (final fallback)
      console.log('📋 Share Debug: Attempting clipboard copy');
      const copied = await copyToClipboard(shareUrl);
      console.log('📋 Share Debug: Clipboard copy result', { success: copied });
      
      if (copied) {
        showCopyConfirmation();
        console.log('✅ Share Debug: Copy fallback successful');
      } else {
        console.log('❌ Share Debug: All methods failed, showing manual copy');
        // Ultimate fallback: show modal with selectable text
        const message = `Share this cocktail: ${shareUrl}`;
        prompt('Copy this link to share:', shareUrl) || alert(message);
      }
    } catch (error) {
      console.error('💥 Share Debug: Unexpected error', error);
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