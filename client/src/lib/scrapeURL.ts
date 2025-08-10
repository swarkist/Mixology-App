import axios from 'axios';

export async function scrapeWebContent(url: string): Promise<string> {
  try {
    const response = await fetch('/api/scrape-url', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ url })
    });
    
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.error || `Failed to scrape webpage: ${response.statusText}`);
    }
    
    const data = await response.json();
    return data.textContent;
  } catch (error) {
    if (error instanceof Error) {
      throw error;
    }
    throw new Error('Failed to scrape webpage');
  }
}