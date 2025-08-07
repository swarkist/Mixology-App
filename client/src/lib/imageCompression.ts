/**
 * Compresses an image file to reduce size for Firebase storage
 * @param file - The image file to compress
 * @param maxDimension - Maximum width or height in pixels (default: 800)
 * @param quality - JPEG compression quality (0-1, default: 0.7)
 * @returns Promise<string> - Base64 data URL of compressed image
 */
export const compressImage = (
  file: File, 
  maxDimension: number = 800, 
  quality: number = 0.7
): Promise<string> => {
  return new Promise((resolve, reject) => {
    console.log(`Compressing image: ${file.name}, original size: ${file.size} bytes`);
    
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    const img = new Image();
    
    img.onload = () => {
      // Calculate new dimensions
      let { width, height } = img;
      
      if (width > height && width > maxDimension) {
        height = (height * maxDimension) / width;
        width = maxDimension;
      } else if (height > maxDimension) {
        width = (width * maxDimension) / height;
        height = maxDimension;
      }
      
      // Set canvas dimensions and draw compressed image
      canvas.width = width;
      canvas.height = height;
      ctx?.drawImage(img, 0, 0, width, height);
      
      // Convert to base64 with compression
      const compressedDataUrl = canvas.toDataURL('image/jpeg', quality);
      console.log(`Image compressed to ${compressedDataUrl.length} bytes (~${Math.round(compressedDataUrl.length / 1024)}KB)`);
      
      resolve(compressedDataUrl);
    };
    
    img.onerror = () => {
      reject(new Error('Failed to load image'));
    };
    
    // Load the image
    const reader = new FileReader();
    reader.onload = (event) => {
      img.src = event.target?.result as string;
    };
    reader.onerror = () => {
      reject(new Error('Failed to read file'));
    };
    reader.readAsDataURL(file);
  });
};