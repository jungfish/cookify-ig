import { NextResponse } from 'next/server';
import { IgApiClient } from 'instagram-private-api';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const mediaId = searchParams.get('mediaId');
  let ig: IgApiClient;

  if (!mediaId) {
    return NextResponse.json({ error: 'Media ID is required' }, { status: 400 });
  }

  console.log('\n=== MEDIA API ===');
  console.log('MEDIA ID:', mediaId);

  try {
    ig = new IgApiClient();
    ig.state.generateDevice(process.env.INSTAGRAM_USERNAME!);
    await ig.simulate.preLoginFlow();
    const auth = await ig.account.login(process.env.INSTAGRAM_USERNAME!, process.env.INSTAGRAM_PASSWORD!);
    
    const mediaInfo: any = await ig.media.info(mediaId) // ig comes from "instagram-private-api"
    const videoUrl: string = mediaInfo.items[0].video_versions[0].url;

    console.log("Media info are: "  + mediaInfo)
    
    // Cleanup the session
    await ig.simulate.postLoginFlow();
    
    return NextResponse.json({ videoUrl });
  } catch (error) {
    console.error('Error fetching from Instagram:', error);
    return NextResponse.json({ error: 'Failed to fetch from Instagram' }, { status: 500 });
  } finally {
    // Ensure we destroy the session
    if (ig) {
      await ig.destroy();
    }
  }
} 