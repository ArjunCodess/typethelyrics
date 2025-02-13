export interface LyricsResponse {
  lyrics: string;
  syncType: string;
  syncedLyrics: { startTimeMs: number; words: string; }[];
  trackDetails: TrackDetails;
}

export interface TrackDetails {
  track_name: string;
  track_artist: string;
  track_album: string;
  track_duration: string;
}

export interface SyncedLyric {
  startTimeMs: number;
  words: string;
}