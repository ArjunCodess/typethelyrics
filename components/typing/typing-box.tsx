import { memo, RefObject } from 'react';

interface TypingBoxProps {
  words: string[][];
  currentWordIndex: number;
  currentCharIndex: number;
  correctChars: boolean[];
  input: string;
  isFinished: boolean;
  canStartTyping: boolean;
  typingContainerRef: RefObject<HTMLDivElement | null>;
  inputRef: RefObject<HTMLInputElement | null>;
  onInputChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  getCharacterClass: (wordIndex: number, charIndex: number) => string;
}

const TypingBox = memo(({
  words,
  input,
  isFinished,
  canStartTyping,
  typingContainerRef,
  inputRef,
  onInputChange,
  getCharacterClass,
}: TypingBoxProps) => {
  return (
    <div 
      className="w-1/2 flex-1 relative mb-8 p-4 bg-[#2c2e31] rounded-lg shadow-lg overflow-hidden"
      onClick={() => inputRef.current?.focus()}
    >
      <div 
        ref={typingContainerRef}
        className="text-2xl leading-relaxed whitespace-pre-wrap max-h-[300px] overflow-y-auto scrollbar-hide"
        onMouseUp={(e) => {
          e.preventDefault();
          inputRef.current?.focus();
        }}
      >
        {/* Add empty space at the top to allow first lines to be centered */}
        <div className="h-[150px]" />
        {words.map((line, lineIndex) => (
          <div key={lineIndex} className="mb-4">
            {line.map((word, wordIndex) => {
              const globalWordIndex = words
                .slice(0, lineIndex)
                .reduce((sum, line) => sum + line.length, 0) + wordIndex;
              return (
                <span
                  key={`${lineIndex}-${wordIndex}`}
                  className="mr-2"
                  data-word-index={globalWordIndex}
                >
                  {word.split("").map((char, charIndex) => (
                    <span
                      key={charIndex}
                      className={getCharacterClass(
                        globalWordIndex,
                        charIndex
                      )}
                    >
                      {char}
                    </span>
                  ))}
                </span>
              );
            })}
          </div>
        ))}
        {/* Add empty space at the bottom to allow last lines to be centered */}
        <div className="h-[150px]" />
      </div>
      <input
        ref={inputRef}
        type="text"
        value={input}
        onChange={onInputChange}
        className="absolute inset-0 w-full h-full opacity-0 cursor-default"
        autoFocus
        disabled={isFinished || !canStartTyping}
        placeholder={canStartTyping ? "Type the lyrics..." : "Waiting for lyrics to start..."}
        onBlur={() => {
          if (!isFinished && canStartTyping) {
            inputRef.current?.focus();
          }
        }}
      />
    </div>
  );
});

TypingBox.displayName = 'TypingBox';

export default TypingBox; 