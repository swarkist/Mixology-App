import axios from 'axios';

export async function scrapeWebContent(url: string): Promise<string> {
  try {
    // Use AllOrigins proxy to bypass CORS
    const proxyUrl = `https://api.allorigins.win/get?url=${encodeURIComponent(url)}`;
    
    const response = await axios.get(proxyUrl, {
      timeout: 30000 // 30 second timeout
    });
    
    if (!response.data?.contents) {
      throw new Error('No content retrieved from URL');
    }
    
    const htmlContent = response.data.contents;
    
    // Basic HTML tag removal and text extraction
    const textContent = htmlContent
      // Remove script and style elements completely
      .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
      .replace(/<style\b[^<]*(?:(?!<\/style>)<[^<]*)*<\/style>/gi, '')
      // Remove HTML tags
      .replace(/<[^>]*>/g, ' ')
      // Decode HTML entities
      .replace(/&nbsp;/g, ' ')
      .replace(/&amp;/g, '&')
      .replace(/&lt;/g, '<')
      .replace(/&gt;/g, '>')
      .replace(/&quot;/g, '"')
      .replace(/&#39;/g, "'")
      // Clean up whitespace
      .replace(/\s+/g, ' ')
      .trim();
    
    if (textContent.length < 50) {
      throw new Error('Extracted content is too short to be meaningful');
    }
    
    return textContent;
  } catch (error) {
    if (axios.isAxiosError(error)) {
      throw new Error(`Failed to fetch webpage: ${error.message}`);
    }
    throw error;
  }
}