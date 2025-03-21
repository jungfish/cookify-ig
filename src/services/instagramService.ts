import { toast } from "sonner";

export interface InstagramMedia {
  id: string;
  caption?: string;
  transcription?:string;
  videoUrl?: string;
  audioUrl?: string;
  thumbnailUrl?: string;
  postUrl?: string;
}

async function getIGMediaFromURL(url: string): Promise<JSON> {
  try {
    // Use a server endpoint to proxy the Instagram API request
    const response = await fetch(`/api/instagram/oembed?url=${encodeURIComponent(url)}`);
    
    if (!response.ok) {
      const errorText = await response.text();
      console.error('Error response:', errorText);
      throw new Error(`Failed to fetch media ID: ${response.status} - ${errorText}`);
    }
    
    const data = await response.json();
    console.log('API Response:', data); // Log the response (remove in production)
    
    if (!data.media_id) {
      throw new Error('No media ID found in response');
    }
    
    return data;
  } catch (error) {
    console.error('Error fetching media ID:', error);
    throw error;
  }
}

export async function fetchInstagramPost(url: string): Promise<InstagramMedia | null> {
  try {
    // Get media from our backend API
    const media = await getIGMediaFromURL(url)
    const videoData = await getVideoFromURL(url, media["media_id"]);

    console.log('VIDEO DATA', videoData);

    const mediaData = {
      id: media["media_id"],
      caption: media["title"],
      transcription: videoData["transcription"],
      videoUrl: videoData["videoUrl"],
      audioUrl: "",
      thumbnailUrl: media["thumbnail_url"],
      postUrl: url,
    };
    
    return mediaData;

  } catch (error) {
    console.error("Error fetching Instagram post:", error);
    toast.error("Failed to fetch Instagram content");
    return null;
  }
}

function extractShortcodeFromUrl(url: string): string | null {
  // Extract the shortcode from Instagram URLs
  // Examples: 
  // https://www.instagram.com/p/CpAbCdEfGhI/
  // https://www.instagram.com/reel/CpAbCdEfGhI/
  
  const regex = /instagram\.com\/(p|reel)\/([A-Za-z0-9_-]+)/;
  const match = url.match(regex);
  
  if (match && match[2]) {
    return match[2];
  }
  
  return null;
}

async function getVideoFromURL(url: string, mediaId: string): Promise<string | null> {
  try {
    // Call our backend API endpoint to get media info
    // const response = await fetch(`/api/instagram/media?url=${url}`);
    const response = await fetch(`/api/instagram-private/media?mediaId=${mediaId}`);
    
    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Failed to fetch media: ${response.status} - ${errorText}`);
    }
    
    const data = await response.json();
    console.log("Response from Video" + data);
    
    return data;
  ;
  } catch (error) {
    console.error('Error fetching media from ID:', error);
    toast.error("Failed to fetch Instagram media");
    return null;
  }
}

// Export the function
export { getVideoFromURL };


