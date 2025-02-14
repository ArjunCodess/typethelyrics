import { memo, RefObject } from "react";
import TypingBox from "./typing-box";

const MemoizedTypingContainer = memo(
  ({
    words,
    currentWordIndex,
    currentCharIndex,
    correctChars,
    input,
    isFinished,
    canStartTyping,
    inputRef,
    onInputChange,
    getCharacterClass,
  }: {
    words: string[][];
    currentWordIndex: number;
    currentCharIndex: number;
    correctChars: boolean[];
    input: string;
    isFinished: boolean;
    canStartTyping?: boolean;
    inputRef: RefObject<HTMLInputElement | null>;
    onInputChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
    getCharacterClass: (wordIndex: number, charIndex: number) => string;
  }) => (
    <div className="w-1/2">
      <TypingBox
        words={words}
        currentWordIndex={currentWordIndex}
        currentCharIndex={currentCharIndex}
        correctChars={correctChars}
        input={input}
        isFinished={isFinished}
        canStartTyping={canStartTyping}
        inputRef={inputRef}
        onInputChange={onInputChange}
        getCharacterClass={getCharacterClass}
      />
    </div>
  )
);

export default MemoizedTypingContainer;

MemoizedTypingContainer.displayName = "MemoizedTypingContainer";