import { NextResponse } from 'next/server';
import { checkSpotifyUrl, getLyrics } from '@/lib/spotify';

export async function POST(request: Request) {
  try {
    const data = await request.json();
    const { url } = data;

    if (!url) {
      return NextResponse.json({ error: 'No URL provided' }, { status: 400 });
    }

    const { type, id } = checkSpotifyUrl(url);

    if (!type || !id) {
      return NextResponse.json(
        { error: 'Invalid URL...Please check the URL and try again' },
        { status: 400 }
      );
    }

    if (type !== 'track') {
      return NextResponse.json(
        { error: 'URL must be a Spotify track URL' },
        { status: 400 }
      );
    }

    // Get both regular and synced lyrics
    const [regularLyrics, syncedLyrics] = await Promise.all([
      getLyrics(id, 'lrc'),
      getLyrics(id, 'srt')
    ]);

    // Process synced lyrics to extract timestamps
    const processedSyncedLyrics = syncedLyrics.lyrics
      .split('\n\n')
      .map(block => {
        const lines = block.split('\n');
        if (lines.length >= 3) {
          const timeMatch = lines[1].match(/(\d{2}):(\d{2}):(\d{2}),(\d{3})/);
          if (timeMatch) {
            const [, hours, minutes, seconds, milliseconds] = timeMatch;
            const startTimeMs = 
              parseInt(hours) * 3600000 +
              parseInt(minutes) * 60000 +
              parseInt(seconds) * 1000 +
              parseInt(milliseconds);
            return {
              startTimeMs,
              words: lines[2].trim()
            };
          }
        }
        return null;
      })
      .filter((item): item is { startTimeMs: number; words: string } => item !== null)
      .sort((a, b) => a.startTimeMs - b.startTimeMs);

    return NextResponse.json({
      lyrics: regularLyrics.lyrics,
      syncType: regularLyrics.syncType,
      syncedLyrics: processedSyncedLyrics,
      trackDetails: regularLyrics.trackDetails
    });
  } catch (error) {
    console.error('Error getting lyrics:', error);
    return NextResponse.json(
      { error: 'Failed to get lyrics' },
      { status: 500 }
    );
  }
}