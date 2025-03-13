import { NextResponse } from 'next/server';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const instagramUrl = searchParams.get('url');

  console.log('\n=== Instagram API Request ===');
  console.log('URL:', instagramUrl);

  if (!instagramUrl) {
    return NextResponse.json({ error: 'URL parameter is required' }, { status: 400 });
  }

  try {
    // Extract the shortcode from the Instagram URL
    const shortcode = instagramUrl.split('/p/')[1]?.split('/')[0];
    console.log('Extracted shortcode:', shortcode);
    
    if (!shortcode) {
      throw new Error('Invalid Instagram URL');
    }

    const apiUrl = `https://graph.instagram.com/oembed?url=${encodeURIComponent(instagramUrl)}&access_token=${process.env.INSTAGRAM_ACCESS_TOKEN}`;
    console.log('Full API URL:', apiUrl.replace(process.env.INSTAGRAM_ACCESS_TOKEN!, '[REDACTED]'));

    const response = await fetch(apiUrl);
    console.log('Response status:', response.status);
    
    const responseText = await response.text();
    console.log('Raw response:', responseText);

    if (!response.ok) {
      throw new Error(`Instagram API error: ${response.status} - ${responseText}`);
    }

    const data = JSON.parse(responseText);
    
    return NextResponse.json({
      ...data,
      media_id: shortcode
    });

  } catch (error) {
    console.error('\n=== Error Details ===');
    console.error(error);
    return NextResponse.json({ 
      error: error instanceof Error ? error.message : 'Failed to fetch from Instagram',
      details: error instanceof Error ? error.stack : undefined
    }, { status: 500 });
  }
} 