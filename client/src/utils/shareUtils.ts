// Share utilities for cocktail recipes - keep under 5KB total
// Device detection and share fallback chain

export interface ShareData {
  title: string;
  text: string;
  url?: string;
  files?: File[];
}

// Device detection for mobile/tablet visibility
export function isMobileOrTablet(): boolean {
  // Check touch capability
  const hasTouchPoints = navigator.maxTouchPoints > 0;
  
  // Check for coarse pointer (mobile/tablet)
  const hasCoarsePointer = window.matchMedia('(pointer: coarse)').matches;
  
  // Check for no hover capability (mobile/tablet)
  const hasNoHover = window.matchMedia('(hover: none)').matches;
  
  // Check viewport width (tablets can be wide)
  const isNarrowViewport = window.innerWidth <= 1280;
  
  // Special case for iPadOS (reports as MacIntel but has touch)
  const isIPadOS = navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1;
  
  return hasTouchPoints && (hasCoarsePointer || hasNoHover || isNarrowViewport) || isIPadOS;
}

// Convert image URL to PNG Blob
export async function imageToPngBlob(imageUrl: string): Promise<File | null> {
  console.log('🔄 ImageToPng Debug: Starting conversion', { imageUrl });
  
  try {
    // Ensure HTTPS URL
    if (!imageUrl.startsWith('https://')) {
      console.log('❌ ImageToPng Debug: Non-HTTPS URL rejected', { imageUrl });
      return null;
    }

    console.log('📡 ImageToPng Debug: Fetching image');
    const response = await fetch(imageUrl, {
      mode: 'cors',
      credentials: 'omit'
    });
    
    if (!response.ok) {
      console.log('❌ ImageToPng Debug: Fetch failed', { 
        status: response.status,
        statusText: response.statusText 
      });
      return null;
    }

    const blob = await response.blob();
    console.log('✅ ImageToPng Debug: Blob created', {
      size: blob.size,
      type: blob.type
    });
    
    // Convert to PNG using Canvas if not already PNG
    if (!blob.type.includes('png')) {
      console.log('🎨 ImageToPng Debug: Converting to PNG via canvas');
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      const img = new Image();
      
      return new Promise((resolve) => {
        img.onload = () => {
          console.log('🖼️ ImageToPng Debug: Image loaded for canvas', {
            width: img.width,
            height: img.height
          });
          
          canvas.width = img.width;
          canvas.height = img.height;
          ctx?.drawImage(img, 0, 0);
          
          canvas.toBlob((pngBlob) => {
            if (pngBlob) {
              console.log('✅ ImageToPng Debug: Canvas conversion successful', {
                size: pngBlob.size,
                type: pngBlob.type
              });
              resolve(new File([pngBlob], 'cocktail.png', { type: 'image/png' }));
            } else {
              console.log('❌ ImageToPng Debug: Canvas toBlob failed');
              resolve(null);
            }
          }, 'image/png');
        };
        
        img.onerror = (error) => {
          console.log('❌ ImageToPng Debug: Image load error', error);
          resolve(null);
        };
        
        img.src = URL.createObjectURL(blob);
        console.log('🔗 ImageToPng Debug: Set img.src to blob URL');
      });
    }

    // Already PNG, create File object
    console.log('✅ ImageToPng Debug: Already PNG, creating File object');
    return new File([blob], 'cocktail.png', { type: 'image/png' });
  } catch (error) {
    // Silent CORS failure fallback
    console.log('❌ ImageToPng Debug: Exception caught', {
      error,
      message: (error as Error)?.message,
      name: (error as Error)?.name
    });
    return null;
  }
}

// Create slugified filename
export function slugify(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .substring(0, 50); // Limit length
}

// Show copy confirmation toast
export function showCopyConfirmation() {
  // Try to find existing toast system
  const event = new CustomEvent('share:copied', {
    detail: { message: 'Link copied!' }
  });
  window.dispatchEvent(event);
  
  // Fallback to browser alert if no toast system
  setTimeout(() => {
    if (!document.querySelector('[role="status"]')) {
      alert('Link copied!');
    }
  }, 100);
}

// Copy to clipboard with fallbacks
export async function copyToClipboard(text: string): Promise<boolean> {
  try {
    // Modern Clipboard API
    if (navigator.clipboard && window.isSecureContext) {
      await navigator.clipboard.writeText(text);
      return true;
    }
    
    // Fallback: textarea method
    const textarea = document.createElement('textarea');
    textarea.value = text;
    textarea.style.position = 'fixed';
    textarea.style.opacity = '0';
    textarea.style.pointerEvents = 'none';
    
    document.body.appendChild(textarea);
    textarea.select();
    textarea.setSelectionRange(0, text.length);
    
    const successful = document.execCommand('copy');
    document.body.removeChild(textarea);
    
    return successful;
  } catch (error) {
    return false;
  }
}