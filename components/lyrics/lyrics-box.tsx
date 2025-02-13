import { memo, RefObject } from 'react';

interface LyricsBoxProps {
  syncedLyrics: { startTimeMs: number; words: string; }[];
  currentPosition: number;
  lyricsContainerRef: RefObject<HTMLDivElement | null>;
}

const LyricsBox = memo(({
  syncedLyrics,
  currentPosition,
  lyricsContainerRef
}: LyricsBoxProps) => {
  return (
    <div className="w-1/2 flex-1 relative mb-8 p-4 bg-[#2c2e31] rounded-lg shadow-lg overflow-hidden">
      <div 
        ref={lyricsContainerRef}
        className="text-2xl whitespace-pre-wrap max-h-[300px] overflow-y-auto scroll-smooth scrollbar-hide"
        style={{ scrollBehavior: 'smooth' }}
      >
        {/* Add empty space at the top to allow first lyrics to be centered */}
        <div className="h-[150px]" />
        {syncedLyrics.map((lyric, index) => {
          const isCurrentLyric = currentPosition >= lyric.startTimeMs && 
            (!syncedLyrics[index + 1] || currentPosition < syncedLyrics[index + 1].startTimeMs);
          const isPastLyric = syncedLyrics[index + 1] && currentPosition >= syncedLyrics[index + 1].startTimeMs;
          
          return (
            <div
              key={index}
              className={`mb-4 transition-all duration-200 ${
                isCurrentLyric 
                  ? 'text-text text-primary scale-105 origin-left'
                  : isPastLyric
                    ? 'text-textDark/50'
                    : 'text-textDark'
              }`}
            >
              {lyric.words}
            </div>
          );
        })}
        {/* Add empty space at the bottom to allow last lyrics to be centered */}
        <div className="h-[150px]" />
      </div>
    </div>
  );
});

LyricsBox.displayName = 'LyricsBox';

export default LyricsBox; 