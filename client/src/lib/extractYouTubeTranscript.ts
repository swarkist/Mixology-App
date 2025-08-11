// More robust ID extraction supporting youtu.be, shorts, embed, and query params
function extractVideoId(input: string): string | null {
  try {
    // Normalize
    const url = new URL(input);
    // youtu.be/<id>
    if (url.hostname === "youtu.be") {
      return url.pathname.replace("/", "").split("?")[0] || null;
    }
    // youtube.com/shorts/<id> or /embed/<id> or /watch?v=<id>
    if (url.hostname.includes("youtube.com")) {
      const pathParts = url.pathname.split("/").filter(Boolean);
      if (url.searchParams.get("v")) return url.searchParams.get("v");
      if (pathParts[0] === "shorts" && pathParts[1]) return pathParts[1];
      if (pathParts[0] === "embed" && pathParts[1]) return pathParts[1];
    }
    return null;
  } catch {
    // As a last resort, try common patterns
    const match = input.match(/(?:v=|\/shorts\/|\/embed\/|youtu\.be\/)([A-Za-z0-9_-]{6,})/);
    return match?.[1] ?? null;
  }
}

export async function extractYouTubeTranscript(url: string): Promise<string> {
  const videoId = extractVideoId(url);
  if (!videoId) {
    throw new Error("Invalid YouTube URL");
  }

  try {
    const response = await fetch("/api/youtube-transcript", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ videoId })
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.error || "Failed to extract YouTube transcript");
    }

    const data = await response.json();
    return data.transcript;
  } catch (error) {
    console.error("YouTube transcript extraction failed:", error);
    throw error;
  }
}

export function isYouTubeURL(url: string): boolean {
  if (!url) return false;
  const youtubeRegex = /^(https?:\/\/)?(www\.)?(youtube\.com|youtu\.be)\//;
  return youtubeRegex.test(url);
}