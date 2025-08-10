export async function extractYouTubeTranscript(url: string): Promise<string> {
  try {
    // Extract video ID from various YouTube URL formats
    const videoIdMatch = url.match(/(?:youtube\.com\/(?:[^\/]+\/.+\/|(?:v|e(?:mbed)?)\/|.*[?&]v=)|youtu\.be\/)([^"&?\/\s]{11})/);
    
    if (!videoIdMatch) {
      throw new Error('Invalid YouTube URL format');
    }
    
    const videoId = videoIdMatch[1];
    
    // Use the backend API to get transcript
    const response = await fetch('/api/youtube-transcript', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ videoId })
    });
    
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.error || `Failed to get transcript: ${response.statusText}`);
    }
    
    const data = await response.json();
    
    if (!data.transcript || data.transcript.length === 0) {
      throw new Error('No transcript available for this video');
    }
    
    return data.transcript;
  } catch (error) {
    if (error instanceof Error) {
      throw error;
    }
    throw new Error('Failed to extract YouTube transcript');
  }
}

export function isYouTubeURL(url: string): boolean {
  const youtubeRegex = /^(https?:\/\/)?(www\.)?(youtube\.com|youtu\.be)\/.+/i;
  return youtubeRegex.test(url);
}