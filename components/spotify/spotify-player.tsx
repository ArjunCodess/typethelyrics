import { memo, RefObject } from 'react';
import { Button } from "@/components/ui/button";
import { Play, Pause } from "lucide-react";

interface SpotifyPlayerProps {
  spotifyTrackId: string;
  isPlaying: boolean;
  onTogglePlay: () => void;
  spotifyEmbedRef: RefObject<HTMLIFrameElement | null>;
}

const SpotifyPlayer = memo(({ 
  spotifyTrackId, 
  isPlaying, 
  onTogglePlay,
  spotifyEmbedRef 
}: SpotifyPlayerProps) => {
  return (
    <>
      <Button
        onClick={onTogglePlay}
        variant="outline"
        size="sm"
        className="gap-2"
      >
        {isPlaying ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
        {isPlaying ? 'Pause' : 'Play'}
      </Button>

      <div className="mb-4 h-[80px]">
        <iframe
          ref={spotifyEmbedRef}
          src={`https://open.spotify.com/embed/track/${spotifyTrackId}?utm_source=generator&theme=0`}
          width="100%"
          height="80"
          allow="autoplay; clipboard-write; encrypted-media; fullscreen; picture-in-picture"
          loading="lazy"
          className="rounded-lg"
        />
      </div>
    </>
  );
});

SpotifyPlayer.displayName = 'SpotifyPlayer';

export default SpotifyPlayer; 