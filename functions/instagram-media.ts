import { Handler } from '@netlify/functions';
import { IgApiClient } from 'instagram-private-api';

export const handler: Handler = async (event) => {
  const mediaId = event.queryStringParameters?.mediaId;
  let ig: IgApiClient;

  if (!mediaId) {
    return {
      statusCode: 400,
      body: JSON.stringify({ error: 'Media ID is required' })
    };
  }

  console.log('\n=== MEDIA API ===');
  console.log('MEDIA ID:', mediaId);

  try {
    ig = new IgApiClient();
    ig.state.generateDevice(process.env.INSTAGRAM_USERNAME!);
    await ig.simulate.preLoginFlow();
    const auth = await ig.account.login(process.env.INSTAGRAM_USERNAME!, process.env.INSTAGRAM_PASSWORD!);
    
    const mediaInfo: any = await ig.media.info(mediaId);
    const videoUrl: string = mediaInfo.items[0].video_versions[0].url;

    console.log("Media info are: ", mediaInfo);
    
    // Cleanup the session
    await ig.simulate.postLoginFlow();
    
    return {
      statusCode: 200,
      body: JSON.stringify({ videoUrl })
    };
  } catch (error) {
    console.error('Error fetching from Instagram:', error);
    return {
      statusCode: 500,
      body: JSON.stringify({ error: 'Failed to fetch from Instagram' })
    };
  } finally {
    // Ensure we destroy the session
    if (ig) {
      await ig.destroy();
    }
  }
}; 