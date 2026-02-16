import { memo } from "react";
import { Type } from "lucide-react";
import { Button } from "@/components/ui/button";

interface URLInputProps {
  spotifyUrl: string;
  onUrlChange: (url: string) => void;
  onSubmit: (e: React.FormEvent) => void;
  loading: boolean;
  error: string | null;
  filters: {
    lowercase: boolean;
    noPunctuation: boolean;
  };
  onFilterChange: (key: 'lowercase' | 'noPunctuation') => void;
}

const URLInput = memo(({
  spotifyUrl,
  onUrlChange,
  onSubmit,
  loading,
  error,
  filters,
  onFilterChange
}: URLInputProps) => {
  return (
    <div className="flex flex-col items-center gap-4 max-w-4xl mx-auto">
      <div className="w-full flex flex-col gap-2">
        <div className="bg-zinc-800 rounded-lg px-4 py-3 text-sm text-zinc-300 flex items-start gap-3 border border-zinc-700">
          <span className="text-lg leading-none mt-0.5">🎵</span>
          <p>
            <span className="text-yellow-400 font-bold">How to get a Spotify link:</span>{" "}
            Right-click a track in Spotify → <span className="text-white font-semibold">Share</span> → <span className="text-white font-semibold">Copy link to song</span>, then paste it below.
          </p>
        </div>
        <div className="bg-zinc-900 rounded-lg px-4 py-2.5 text-xs text-zinc-400 flex items-start gap-3 border border-zinc-700">
          <span className="text-lg leading-none mt-0.5">🔊</span>
          <p>
            <span className="text-emerald-400 font-semibold">Important update:</span>{" "}
            This app was built to let you listen to full songs while typing the lyrics in real-time.
            Unfortunately, due to Spotify&apos;s restrictions, free users can now only hear a 30-second preview — Premium users still get full playback.
            I&apos;m sorry about this, it&apos;s not something I can control.
          </p>
        </div>
      </div>
      <form onSubmit={onSubmit} className="w-full">
        <div className="flex flex-col gap-4">
          <input
            type="text"
            value={spotifyUrl}
            onChange={(e) => onUrlChange(e.target.value)}
            placeholder="Enter Spotify song URL..."
            className="w-full p-4 rounded-lg bg-[#2c2e31] text-text border-2 border-primary focus:outline-none focus:border-primary/80"
          />
          <div className="flex gap-2 mb-4">
            <Button
              type="button"
              variant="outline"
              onClick={() => onFilterChange('lowercase')}
              className={`w-full gap-2 ${filters.lowercase ? 'bg-primary text-background' : 'bg-[#2c2e31]'}`}
            >
              <Type className="w-4 h-4" />
              Lowercase: {filters.lowercase ? 'On' : 'Off'}
            </Button>
            <Button
              type="button"
              variant="outline"
              onClick={() => onFilterChange('noPunctuation')}
              className={`w-full gap-2 ${filters.noPunctuation ? 'bg-primary text-background' : 'bg-[#2c2e31]'}`}
            >
              <Type className="w-4 h-4" />
              No Punctuation: {filters.noPunctuation ? 'On' : 'Off'}
            </Button>
          </div>
          <Button
            type="submit"
            disabled={loading}
            className="w-full bg-primary text-background hover:bg-primary/90"
          >
            {loading ? "Loading..." : "Get Lyrics"}
          </Button>
        </div>
      </form>
      {error && <div className="text-error text-sm">{error}</div>}
    </div>
  );
});

URLInput.displayName = 'URLInput';

export default URLInput; 