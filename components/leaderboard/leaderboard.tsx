"use client";

import { useEffect, useState, useCallback } from 'react';
import { Trophy, Music } from 'lucide-react';
import Link from 'next/link';

type TopUser = {
  username: string;
  score: number;
};

type TopSong = {
  title: string;
  artist: string;
  play_count: number;
  spotify_url: string;
};

export default function Leaderboard() {
  const [topUsers, setTopUsers] = useState<TopUser[]>([]);
  const [topSongs, setTopSongs] = useState<TopSong[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchLeaderboards = useCallback(async () => {
    try {
      const response = await fetch('/api/leaderboard', {
        cache: 'no-store',
        headers: {
          'Cache-Control': 'no-cache'
        }
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to fetch leaderboard data');
      }

      const data = await response.json();
      setTopUsers(data.topUsers);
      setTopSongs(data.topSongs);
      setError(null);
    } catch (err) {
      console.error('Leaderboard error:', err);
      setError(err instanceof Error ? err.message : 'Failed to load leaderboard');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchLeaderboards();

    // Refresh every 30 seconds
    const interval = setInterval(fetchLeaderboards, 30000);
    return () => clearInterval(interval);
  }, [fetchLeaderboards]);

  if (loading) {
    return (
      <div className="w-full flex justify-center items-center py-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-error text-center py-4">
        {error}
      </div>
    );
  }

  return (
    <div className="w-full grid grid-cols-1 md:grid-cols-2 gap-4">
      {/* Top Users */}
      <div className="bg-card rounded-lg shadow-lg p-6 border border-border">
        <div className="flex items-center gap-2 mb-4">
          <Trophy className="w-5 h-5 text-primary" />
          <h2 className="text-lg font-bold text-foreground">Top Typists</h2>
        </div>
        <hr />
        <div className="space-y-3 mt-2">
          {topUsers.map((user, index) => (
            <div key={user.username} className="flex items-center justify-between p-2 rounded bg-background">
              <div className="flex items-center gap-3">
                <span className="text-primary font-mono">{index + 1}</span>
                <span className="text-foreground">{user.username}</span>
              </div>
              <span className="text-muted-foreground font-mono">{user.score.toLocaleString()} pts</span>
            </div>
          ))}
          {topUsers.length === 0 && (
            <div className="text-muted-foreground text-center py-2">No scores yet</div>
          )}
        </div>
      </div>

      {/* Top Songs */}
      <div className="bg-card rounded-lg shadow-lg p-6 border border-border">
        <div className="flex items-center gap-2 mb-4">
          <Music className="w-5 h-5 text-primary" />
          <h2 className="text-lg font-bold text-foreground">Most Played Songs</h2>
        </div>
        <hr />
        <div className="space-y-3 mt-2">
          {topSongs.map((song, index) => (
            <div
              key={`${song.title}-${song.artist}`}
              className="flex items-center justify-between p-2 rounded bg-background"
            >
              <div className="flex items-center gap-3">
                <span className="text-primary font-mono">{index + 1}</span>
                <Link href={song.spotify_url} target="_blank" className="flex flex-col">
                  <span className="text-foreground">{song.title}</span>
                  <span className="text-xs text-muted-foreground">{song.artist}</span>
                </Link>
              </div>
              <span className="text-muted-foreground font-mono">{song.play_count} plays</span>
            </div>
          ))}
          {topSongs.length === 0 && (
            <div className="text-muted-foreground text-center py-2">No songs played yet</div>
          )}
        </div>
      </div>
    </div>
  );
}