"use client";

import { useState, useCallback, useRef, useEffect } from "react";
import { Keyboard, RotateCcw, Info, Music, SquareX } from "lucide-react";
import { Button } from "@/components/ui/button";
import type React from "react";
import type { LyricsResponse, TrackDetails } from "@/components/types";
import URLInput from "@/components/game/url-input";
import SpotifyPlayer from "@/components/spotify/spotify-player";
import TypingBox from "@/components/typing/typing-box";
import LyricsBox from "@/components/lyrics/lyrics-box";

export default function Home() {
  const [spotifyUrl, setSpotifyUrl] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [trackDetails, setTrackDetails] = useState<TrackDetails | null>(null);

  const [words, setWords] = useState<string[][]>([]);
  const [input, setInput] = useState("");
  const [currentWordIndex, setCurrentWordIndex] = useState(0);
  const [currentCharIndex, setCurrentCharIndex] = useState(0);
  const [correctChars, setCorrectChars] = useState<boolean[]>([]);
  const [startTime, setStartTime] = useState<number | null>(null);
  const [isFinished, setIsFinished] = useState(false);
  const [wpm, setWPM] = useState(0);
  const [accuracy, setAccuracy] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);
  const [isTestActive, setIsTestActive] = useState(false);
  const [testDuration, setTestDuration] = useState<number | null>(null);
  const [elapsedTime, setElapsedTime] = useState(0);
  const timerInterval = useRef<NodeJS.Timeout | null>(null);
  const [rawWPM, setRawWPM] = useState(0);
  const [currentPosition, setCurrentPosition] = useState(0);
  const [canStartTyping, setCanStartTyping] = useState(false);
  const [syncedLyrics, setSyncedLyrics] = useState<{ startTimeMs: number; words: string; }[]>([]);
  const lastPositionUpdate = useRef<number>(0);
  const lyricsContainerRef = useRef<HTMLDivElement>(null);

  const typingContainerRef = useRef<HTMLDivElement>(null);

  const [filters, setFilters] = useState({
    lowercase: false,
    noPunctuation: false,
  });

  const [isPlaying, setIsPlaying] = useState(false);
  const [spotifyTrackId, setSpotifyTrackId] = useState<string | null>(null);
  const spotifyEmbedRef = useRef<HTMLIFrameElement>(null);

  const scrollLyricIntoView = useCallback((index: number) => {
    if (!lyricsContainerRef.current) return;
    
    const container = lyricsContainerRef.current;
    const lyricElements = container.children;
    if (index >= 0 && index < lyricElements.length) {
      const lyricElement = lyricElements[index] as HTMLDivElement;
      const containerHeight = container.clientHeight;
      const lyricHeight = lyricElement.clientHeight;
      
      const scrollPosition = lyricElement.offsetTop - (containerHeight / 2) + (lyricHeight / 2);
      
      container.scrollTo({
        top: scrollPosition,
        behavior: 'smooth'
      });
    }
  }, []);

  const handleFilterChange = useCallback((key: 'lowercase' | 'noPunctuation') => {
    setFilters(f => ({ ...f, [key]: !f[key] }));
  }, []);

  const handleUrlChange = useCallback((url: string) => {
    setSpotifyUrl(url);
  }, []);

  const handlePositionUpdate = useCallback((position: number) => {
    const now = Date.now();
    if (now - lastPositionUpdate.current > 50) {
      setCurrentPosition(position);
      lastPositionUpdate.current = now;
      
      if (syncedLyrics.length > 0) {
        const shouldStartTyping = position >= syncedLyrics[0].startTimeMs;
        setCanStartTyping(shouldStartTyping);
      }
    }
  }, [syncedLyrics]);

  // Update the message handler useEffect
  useEffect(() => {
    const handleMessage = (event: MessageEvent) => {
      if (event.origin !== "https://open.spotify.com") return;
      
      const data = event.data;
      if (typeof data === 'object' && data.type === 'playback_update' && data.payload) {
        handlePositionUpdate(data.payload.position);
      }
    };

    window.addEventListener('message', handleMessage);
    return () => window.removeEventListener('message', handleMessage);
  }, [handlePositionUpdate]);

  // Memoize the lyrics scroll effect
  useEffect(() => {
    if (!lyricsContainerRef.current || !syncedLyrics.length) return;

    const currentLyricIndex = syncedLyrics.findIndex((lyric, index) => {
      const nextLyric = syncedLyrics[index + 1];
      return currentPosition >= lyric.startTimeMs && (!nextLyric || currentPosition < nextLyric.startTimeMs);
    });

    if (currentLyricIndex !== -1) {
      scrollLyricIntoView(currentLyricIndex);
    }
  }, [currentPosition, syncedLyrics, scrollLyricIntoView]);

  const finishTest = () => {
    if (startTime) {
      if (timerInterval.current) {
        clearInterval(timerInterval.current);
      }
      const timeInSeconds = testDuration || elapsedTime;
      const timeInMinutes = timeInSeconds / 60;

      // Calculate total characters typed and correct characters
      let totalCharactersTyped = 0;
      let correctCharactersTyped = 0;

      // Go through each word up to the current word
      for (let wordIdx = 0; wordIdx < currentWordIndex; wordIdx++) {
        const word = words.flat()[wordIdx];
        const offset = getCharacterOffset(wordIdx);

        // Count characters in completed words
        for (let charIdx = 0; charIdx < word.length; charIdx++) {
          totalCharactersTyped++;
          if (correctChars[offset + charIdx]) {
            correctCharactersTyped++;
          }
        }
        // Count the space after each word (except the last word)
        if (wordIdx < currentWordIndex - 1) {
          totalCharactersTyped++;
          correctCharactersTyped++; // Space is always counted as correct
        }
      }

      // Add characters from the current word
      if (currentWordIndex < words.flat().length) {
        const currentWord = words.flat()[currentWordIndex];
        const offset = getCharacterOffset(currentWordIndex);
        for (
          let charIdx = 0;
          charIdx < Math.min(input.length, currentWord.length);
          charIdx++
        ) {
          totalCharactersTyped++;
          if (correctChars[offset + charIdx]) {
            correctCharactersTyped++;
          }
        }
      }

      // Calculate accuracy as a percentage of correct characters
      const calculatedAccuracy =
        totalCharactersTyped > 0
          ? Math.round((correctCharactersTyped / totalCharactersTyped) * 100)
          : 0;

      // Calculate raw WPM (5 characters = 1 word)
      const calculatedRawWPM = Math.round(
        totalCharactersTyped / 5 / timeInMinutes
      );

      // Calculate WPM with accuracy penalty
      const calculatedWPM = Math.round(
        calculatedRawWPM * (calculatedAccuracy / 100)
      );

      setRawWPM(calculatedRawWPM);
      setWPM(calculatedWPM);
      setAccuracy(calculatedAccuracy);
      setIsFinished(true);
    }
  };

  // Initialize test
  const initializeTest = useCallback((lyrics: string, syncedLyrics?: { startTimeMs: number; words: string; }[]) => {
    if (!lyrics) {
      setError("No lyrics found for this song");
      return;
    }

    // Move processText inside the callback
    const processText = (text: string) => {
      let processed = text;
      if (filters.lowercase) {
        processed = processed.toLowerCase();
      }
      if (filters.noPunctuation) {
        processed = processed.replace(/[.,\/#!$%\^&\*;:{}=\-_`~()]/g, "");
      }
      return processed;
    };

    if (syncedLyrics && syncedLyrics.length > 0) {
      setSyncedLyrics(syncedLyrics);
      setCanStartTyping(false);
    } else {
      console.error('No synced lyrics received');
    }

    // Process lyrics first
    const metadataRegex = /^\[(ar|al|ti|length):.*\]$/gm;
    let cleanedLyrics = lyrics.replace(metadataRegex, "");
    const timestampRegex = /\[\d{2}:\d{2}\.\d{2}\]/g;
    cleanedLyrics = cleanedLyrics.replace(timestampRegex, "");
    cleanedLyrics = cleanedLyrics.replace(/♪/g, "");
    cleanedLyrics = cleanedLyrics.replace(/\(([^)]+)\)/g, "");

    const lyricsArray = cleanedLyrics
      .split("\n")
      .map((line) => line.trim())
      .filter((line) => line.length > 0)
      .map((line) => processText(line))
      .map((line) => line.split(" ").filter((word) => word.length > 0));

    if (lyricsArray.length === 0) {
      console.error("Lyrics array is empty after processing:", lyricsArray);
      console.error("Original lyrics:", lyrics);
      setError("No valid lyrics found after processing");
      return;
    }

    // Set all the states
    setWords(lyricsArray);
    setCorrectChars(new Array(lyricsArray.flat().join(" ").length).fill(false));
    setIsTestActive(true);
    setCurrentWordIndex(0);
    setCurrentCharIndex(0);
    setInput("");
    setStartTime(null);
    setIsFinished(false);
    setWPM(0);
    setAccuracy(0);
    setError(null);
    setElapsedTime(0);
    setTestDuration(null);

    // Start playing music after a short delay to ensure iframe is loaded
    setTimeout(() => {
      setIsPlaying(true);
      // First start the playback
      controlSpotifyPlayer('play');
      
      // Then start checking position after a short delay
      setTimeout(() => {
        if (spotifyEmbedRef.current?.contentWindow) {
          spotifyEmbedRef.current.contentWindow.postMessage({ command: 'get_position' }, '*');
        }
      }, 500);
    }, 1000);

    setTimeout(() => {
      inputRef.current?.focus();
    }, 100);
  }, [filters]);

  // Reset test
  const resetTest = useCallback(() => {
    setInput("");
    setCurrentWordIndex(0);
    setCurrentCharIndex(0);
    setStartTime(null);
    setIsFinished(false);
    setWPM(0);
    setAccuracy(0);
    setCorrectChars(new Array(words.flat().join(" ").length).fill(false));
    inputRef.current?.focus();
    setElapsedTime(0);
    setTestDuration(null);
    setCanStartTyping(false);
    if (isPlaying) {
      setIsPlaying(false);
      controlSpotifyPlayer('pause');
    }
  }, [words, isPlaying]);

  // Extract track ID from Spotify URL
  const extractTrackId = (url: string) => {
    const match = url.match(/track\/([a-zA-Z0-9]+)/);
    return match ? match[1] : null;
  };

  // Handle URL submit
  const handleUrlSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setIsTestActive(false);
    setCanStartTyping(false); // Reset typing state

    if (!spotifyUrl.includes("spotify.com/track/")) {
      setError("Please enter a valid Spotify track URL");
      setLoading(false);
      return;
    }

    const trackId = extractTrackId(spotifyUrl);
    if (!trackId) {
      setError("Invalid Spotify URL");
      setLoading(false);
      return;
    }
    setSpotifyTrackId(trackId);

    try {
      const response = await fetch("/api/lyrics", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ url: spotifyUrl }),
      });

      const data: LyricsResponse = await response.json();

      if (!response.ok) {
        throw new Error(data.lyrics || "Failed to get lyrics");
      }

      const cleanTrackDetails: TrackDetails = {
        track_name: data.trackDetails.track_name,
        track_artist: data.trackDetails.track_artist,
        track_album: data.trackDetails.track_album,
        track_duration: data.trackDetails.track_duration,
      };

      setTrackDetails(cleanTrackDetails);
      // Pass both regular lyrics and synced lyrics
      initializeTest(data.lyrics, data.syncedLyrics);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setLoading(false);
    }
  };

  // Get character offset
  const getCharacterOffset = (wordIndex: number) => {
    return (
      words.flat().slice(0, wordIndex).join(" ").length +
      (wordIndex > 0 ? 1 : 0)
    );
  };

  // Control Spotify player
  const controlSpotifyPlayer = (command: 'toggle' | 'play' | 'pause') => {
    if (spotifyEmbedRef.current?.contentWindow) {
      spotifyEmbedRef.current.contentWindow.postMessage({ command }, '*');
    }
  };

  // Add this new function to scroll the typing box
  const scrollTypingBoxToCurrentWord = useCallback(() => {
    if (!typingContainerRef.current) return;
    
    const container = typingContainerRef.current;
    const wordElements = container.querySelectorAll('span[data-word-index]');
    const currentWordElement = wordElements[currentWordIndex] as HTMLElement;
    
    if (currentWordElement) {
      const containerHeight = container.clientHeight;
      const elementTop = currentWordElement.offsetTop;
      const elementHeight = currentWordElement.clientHeight;
      
      const scrollPosition = elementTop - (containerHeight / 2) + (elementHeight / 2);
      
      container.scrollTo({
        top: scrollPosition,
        behavior: 'smooth'
      });
    }
  }, [currentWordIndex]);

  // Modify the handleInputChange function
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (isFinished || !isTestActive || !canStartTyping) return;

    const value = e.target.value;
    inputRef.current?.focus(); // Keep focus

    // Check if we can type the current word
    const currentLyric = syncedLyrics[currentWordIndex];
    if (!currentLyric || currentPosition < currentLyric.startTimeMs) {
      return;
    }

    // Start the timer if it hasn't started yet
    if (!startTime) {
      setStartTime(Date.now());
      timerInterval.current = setInterval(() => {
        setElapsedTime((prevTime) => prevTime + 1);
      }, 1000);
    }

    // Handle space to move to next word
    if (value.endsWith(" ")) {
      const word = value.trim();
      const currentWord = words.flat()[currentWordIndex];

      // Update correct characters for the current word
      const offset = getCharacterOffset(currentWordIndex);
      const newCorrectChars = [...correctChars];
      for (let i = 0; i < currentWord.length; i++) {
        newCorrectChars[offset + i] = word[i] === currentWord[i];
      }
      setCorrectChars(newCorrectChars);

      // Check if we can move to the next word
      const nextWordIndex = currentWordIndex + 1;
      const nextLyric = syncedLyrics[nextWordIndex];
      
      if (nextLyric && currentPosition < nextLyric.startTimeMs) {
        // Don't allow moving to next word if its lyric hasn't started
        return;
      }

      if (currentWordIndex === words.flat().length - 1) {
        finishTest();
      } else {
        setCurrentWordIndex(nextWordIndex);
        setCurrentCharIndex(0);
        // Scroll to the next word after state update
        setTimeout(scrollTypingBoxToCurrentWord, 0);
      }
      setInput("");
      inputRef.current?.focus(); // Keep focus after space
    } else {
      const currentWord = words.flat()[currentWordIndex];
      const offset = getCharacterOffset(currentWordIndex);
      const newCorrectChars = [...correctChars];

      // Update correct characters as user types
      for (let i = 0; i < value.length; i++) {
        newCorrectChars[offset + i] = value[i] === currentWord[i];
      }
      setCorrectChars(newCorrectChars);
      setCurrentCharIndex(value.length);
      setInput(value);
    }
  };

  // Get character class
  const getCharacterClass = (wordIndex: number, charIndex: number) => {
    const offset = getCharacterOffset(wordIndex);
    const absoluteIndex = offset + charIndex;

    if (wordIndex === currentWordIndex) {
      if (charIndex === currentCharIndex) {
        return "text-primary border-l-2 border-primary animate-pulse transition-all duration-200";
      }
      if (charIndex < input.length) {
        return correctChars[absoluteIndex]
          ? "text-correct transition-colors duration-200"
          : "text-error transition-colors duration-200";
      }
    } else if (wordIndex < currentWordIndex) {
      return correctChars[absoluteIndex]
        ? "text-correct transition-colors duration-200"
        : "text-error transition-colors duration-200";
    }
    return "text-textDark transition-colors duration-200";
  };

  // Handle end test
  const handleEndTest = () => {
    setTestDuration(elapsedTime);
    if (isPlaying) {
      setIsPlaying(false);
      controlSpotifyPlayer('pause');
    }
    finishTest();
  };

  // Handle play/pause
  const togglePlay = () => {
    const newPlayingState = !isPlaying;
    setIsPlaying(newPlayingState);
    controlSpotifyPlayer('toggle');
  };

  // Add this effect to maintain focus
  useEffect(() => {
    const focusInterval = setInterval(() => {
      if (isTestActive && !isFinished && canStartTyping) {
        inputRef.current?.focus();
      }
    }, 100);

    return () => clearInterval(focusInterval);
  }, [isTestActive, isFinished, canStartTyping]);

  return (
    <div className="min-h-screen bg-background text-text flex flex-col items-center p-4 font-mono">
      <header className="w-full max-w-3xl flex items-center justify-between mb-8">
        <div className="flex items-center gap-2">
          <Keyboard className="w-6 h-6 text-primary" />
          <span className="text-lg font-bold text-primary">TypeTheLyrics</span>
        </div>
        {trackDetails && (
          <div className="flex items-center gap-4">
            <Music className="w-5 h-5 text-textDark" />
            <span className="text-textDark">
              {trackDetails.track_name} - {trackDetails.track_artist}
            </span>
          </div>
        )}
      </header>

      <main className="w-full max-w-7xl">
        {!isTestActive ? (
          <URLInput
            spotifyUrl={spotifyUrl}
            onUrlChange={handleUrlChange}
            onSubmit={handleUrlSubmit}
            loading={loading}
            error={error}
            filters={filters}
            onFilterChange={handleFilterChange}
          />
        ) : (
          <div className="flex flex-col gap-4">
            {spotifyTrackId && (
              <SpotifyPlayer
                spotifyTrackId={spotifyTrackId}
                isPlaying={isPlaying}
                onTogglePlay={togglePlay}
                spotifyEmbedRef={spotifyEmbedRef}
              />
            )}

            {/* Main content area with typing box and lyrics progression */}
            <div className="flex gap-4">
              <TypingBox
                words={words}
                currentWordIndex={currentWordIndex}
                currentCharIndex={currentCharIndex}
                correctChars={correctChars}
                input={input}
                isFinished={isFinished}
                canStartTyping={canStartTyping}
                typingContainerRef={typingContainerRef}
                inputRef={inputRef}
                onInputChange={handleInputChange}
                getCharacterClass={getCharacterClass}
              />

              <LyricsBox
                syncedLyrics={syncedLyrics}
                currentPosition={currentPosition}
                lyricsContainerRef={lyricsContainerRef}
              />
            </div>

            {!isFinished ? (
              <div className="flex justify-between items-center">
                <div className="text-sm text-textDark flex items-center gap-2">
                  <Info className="w-4 h-4" />
                  <span>
                    {!canStartTyping 
                      ? "Waiting for lyrics to start..." 
                      : "Start typing to begin the test..."}
                  </span>
                </div>
                <Button
                  onClick={handleEndTest}
                  variant="destructive"
                  size="sm"
                  className="gap-2"
                >
                  <SquareX className="w-4 h-4" />
                  End Test
                </Button>
              </div>
            ) : (
              <div className="text-center">
                <div className="grid grid-cols-3 gap-4 mb-6">
                  <div className="p-4 rounded-lg bg-[#2c2e31] shadow-lg">
                    <div className="text-3xl font-bold text-primary">
                      {wpm}
                    </div>
                    <div className="text-sm text-textDark">WPM</div>
                  </div>
                  <div className="p-4 rounded-lg bg-[#2c2e31] shadow-lg">
                    <div className="text-3xl font-bold text-primary">
                      {rawWPM}
                    </div>
                    <div className="text-sm text-textDark">Raw WPM</div>
                  </div>
                  <div className="p-4 rounded-lg bg-[#2c2e31] shadow-lg">
                    <div className="text-3xl font-bold text-primary">
                      {accuracy}%
                    </div>
                    <div className="text-sm text-textDark">Accuracy</div>
                  </div>
                </div>
                <div className="flex gap-2 justify-center">
                  <Button
                    onClick={resetTest}
                    variant="outline"
                    className="gap-2 bg-primary text-background hover:bg-primary/90"
                  >
                    <RotateCcw className="w-4 h-4" />
                    Retry Song
                  </Button>
                  <Button
                    onClick={() => setIsTestActive(false)}
                    variant="outline"
                    className="gap-2 bg-[#2c2e31] text-text hover:bg-[#2c2e31]/90"
                  >
                    <Music className="w-4 h-4" />
                    New Song
                  </Button>
                </div>
              </div>
            )}
          </div>
        )}
      </main>

      <footer className="mt-8 text-xs text-textDark">
        {trackDetails ? (
          <>
            From: <b>{trackDetails.track_name}</b> by{" "}
            <b>{trackDetails.track_artist}</b> ({trackDetails.track_album})
          </>
        ) : (
          "Enter a Spotify song URL to start typing its lyrics"
        )}
      </footer>
    </div>
  );
}
