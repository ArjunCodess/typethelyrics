import SpotifyWebApi from 'spotify-web-api-node';

const spotifyApi = new SpotifyWebApi({
  clientId: process.env.SPOTIFY_CLIENT_ID,
  clientSecret: process.env.SPOTIFY_CLIENT_SECRET,
});

export const checkSpotifyUrl = (url: string): { type: string | null; id: string | null } => {
  const regex = /^(?:spotify:(track|album|playlist):|https:\/\/[a-z]+\.spotify\.com\/(track|playlist|album)\/)([\w\d]+)/;
  const match = url.match(regex);

  if (!match) {
    return { type: null, id: null };
  }

  return {
    type: match[2] || match[1],
    id: match[3],
  };
};

export const getAccessToken = async () => {
  try {
    const data = await spotifyApi.clientCredentialsGrant();
    spotifyApi.setAccessToken(data.body['access_token']);
    return data.body['access_token'];
  } catch (error) {
    console.error('Error getting Spotify access token:', error);
    throw error;
  }
};

export const getLyrics = async (trackId: string, format: 'lrc' | 'srt' = 'lrc') => {
  try {
    // First get track details from Spotify
    await getAccessToken();
    const track = await spotifyApi.getTrack(trackId);
    
    // Then fetch lyrics from the lyrics API
    const response = await fetch(`https://spotify-lyrics-api-pi.vercel.app/?trackid=${trackId}&format=${format}`);
    
    if (!response.ok) {
      throw new Error('No lyrics found');
    }

    const data = await response.json();
    const trackDetails = {
      track_name: track.body.name,
      track_artist: track.body.artists.map(artist => artist.name).join(', '),
      track_album: track.body.album.name,
      track_duration: formatDuration(track.body.duration_ms),
    };

    const formattedLyrics: string[] = [];

    // Add track metadata
    formattedLyrics.push(
      `[ar:${trackDetails.track_artist}]`,
      `[al:${trackDetails.track_album}]`,
      `[ti:${trackDetails.track_name}]`,
      `[length:${trackDetails.track_duration}]`,
      ''
    );

    // Format lyrics based on sync type and requested format
    if (data.syncType === "UNSYNCED") {
      formattedLyrics.push(...data.lines.map((line: { words: string }) => line.words));
    } else if (format === 'srt') {
      formattedLyrics.push(
        ...data.lines.map((line: { index: number, startTime: string, endTime: string, words: string }) => (
          `${line.index}\n${line.startTime} --> ${line.endTime}\n${line.words}\n`
        ))
      );
    } else {
      formattedLyrics.push(
        ...data.lines.map((line: { timeTag: string, words: string }) => (
          `[${line.timeTag}] ${line.words}`
        ))
      );
    }

    return {
      lyrics: formattedLyrics.join('\n'),
      syncType: data.syncType,
      trackDetails
    };
  } catch (error) {
    console.error('Error getting lyrics:', error);
    throw error;
  }
};

const formatDuration = (durationMs: number): string => {
  const minutes = Math.floor(durationMs / 60000);
  const seconds = Math.floor((durationMs % 60000) / 1000);
  const hundredths = Math.floor((durationMs % 1000) / 10);
  return `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}.${hundredths.toString().padStart(2, '0')}`;
}; 