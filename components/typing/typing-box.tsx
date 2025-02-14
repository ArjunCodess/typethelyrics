import { memo, RefObject, useEffect, useMemo, useRef } from 'react';

interface TypingBoxProps {
  words: string[][];                // 2D array of words organized by lines
  currentWordIndex: number;         // Current word index (used for styling)
  currentCharIndex: number;         // Current character position
  correctChars: boolean[];          // Array of correct character flags
  input: string;                    // Current input value
  isFinished: boolean;              // Is the typing test finished?
  canStartTyping?: boolean;         // Add this prop to control typing
  inputRef: RefObject<HTMLInputElement | null>;         // Reference for hidden input
  onInputChange: (e: React.ChangeEvent<HTMLInputElement>) => void; // Input change handler
  getCharacterClass: (wordIndex: number, charIndex: number) => string; // Styling helper for characters
}

const TypingBox = memo(({
  words,
  currentWordIndex,
  input,
  isFinished,
  canStartTyping = true, // Default to true for backward compatibility
  inputRef,
  onInputChange,
  getCharacterClass,
}: TypingBoxProps) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const lastScrolledIndex = useRef<number>(-1);

  // Keep focus on input
  useEffect(() => {
    if (isFinished || !canStartTyping) return;
    inputRef.current?.focus();
  }, [isFinished, canStartTyping, inputRef]);

  // Auto-scroll effect
  useEffect(() => {
    if (!containerRef.current || lastScrolledIndex.current === currentWordIndex) return;

    const container = containerRef.current;
    const currentWordElement = container.querySelector(`[data-word-index="${currentWordIndex}"]`);
    
    if (currentWordElement) {
      const containerRect = container.getBoundingClientRect();
      const wordRect = currentWordElement.getBoundingClientRect();
      const targetScroll = container.scrollTop + (wordRect.top - containerRect.top) - (containerRect.height / 3);

      container.scrollTo({
        top: targetScroll,
        behavior: 'smooth'
      });

      lastScrolledIndex.current = currentWordIndex;
    }
  }, [currentWordIndex]);

  // Handle space key
  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (!canStartTyping) return;
    if (e.key === ' ') {
      e.preventDefault();
      onInputChange({ target: { value: input + ' ' } } as React.ChangeEvent<HTMLInputElement>);
    }
  };

  // Calculate line offsets
  const lineOffsets = useMemo(() => 
    words.map((_, lineIndex) =>
      words.slice(0, lineIndex).reduce((sum, line) => sum + line.length, 0)
    ), [words]
  );

  return (
    <div className="relative p-4 bg-[#2c2e31] rounded-lg shadow-lg overflow-hidden">
      <div
        ref={containerRef}
        className="text-2xl leading-relaxed whitespace-pre-wrap max-h-[300px] overflow-y-auto scrollbar-hide select-none scroll-smooth"
        style={{ scrollBehavior: 'smooth' }}
      >
        {words.map((line, lineIndex) => (
          <div key={lineIndex} className="mb-6">
            {line.map((word, wordIndex) => {
              const globalWordIndex = lineOffsets[lineIndex] + wordIndex;
              return (
                <span
                  key={`${lineIndex}-${wordIndex}`}
                  className={`mr-2 inline-block ${globalWordIndex === currentWordIndex ? 'relative' : ''}`}
                  data-word-index={globalWordIndex}
                >
                  {word.split("").map((char, charIndex) => (
                    <span
                      key={charIndex}
                      className={getCharacterClass(globalWordIndex, charIndex)}
                    >
                      {char}
                    </span>
                  ))}
                </span>
              );
            })}
          </div>
        ))}
      </div>

      <input
        ref={inputRef}
        type="text"
        value={input}
        onChange={onInputChange}
        onKeyDown={handleKeyDown}
        className="absolute inset-0 w-full h-full opacity-0 cursor-default"
        autoComplete="off"
        autoCapitalize="off"
        autoCorrect="off"
        spellCheck={false}
        autoFocus
        disabled={isFinished || !canStartTyping}
      />
    </div>
  );
});

TypingBox.displayName = 'TypingBox';

export default TypingBox;