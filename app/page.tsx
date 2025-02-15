"use client";

import { useState, useCallback, useRef, useEffect } from "react";
import { Keyboard, Info, Music, SquareX, LogIn, LogOut } from "lucide-react";
import { Button } from "@/components/ui/button";
import type React from "react";
import type { LyricsResponse, TrackDetails } from "@/components/types";
import URLInput from "@/components/game/url-input";
import SpotifyPlayer from "@/components/spotify/spotify-player";
import LyricsBox from "@/components/lyrics/lyrics-box";
import MemoizedTypingContainer from "@/components/typing/memoized-typing-box";
import { supabase } from "@/lib/supabase";
import { User } from "@supabase/supabase-js";
import Leaderboard from "@/components/leaderboard/leaderboard";

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
  const [, setTestDuration] = useState<number | null>(null);
  const [, setElapsedTime] = useState(0);
  const [rawWPM, setRawWPM] = useState(0);
  const [currentPosition, setCurrentPosition] = useState(0);
  const [canStartTyping, setCanStartTyping] = useState(false);
  const [syncedLyrics, setSyncedLyrics] = useState<{ startTimeMs: number; words: string; }[]>([]);
  const lastPositionUpdate = useRef<number>(0);
  const lyricsContainerRef = useRef<HTMLDivElement>(null);

  const [filters, setFilters] = useState({
    lowercase: false,
    noPunctuation: false,
  });

  const [isPlaying, setIsPlaying] = useState(false);
  const [spotifyTrackId, setSpotifyTrackId] = useState<string | null>(null);
  const spotifyEmbedRef = useRef<HTMLIFrameElement>(null);

  const [user, setUser] = useState<User | null>(null);

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
    // Only update if enough time has passed (50ms throttle)
    if (now - lastPositionUpdate.current > 50) {
      // Batch the state updates
      requestAnimationFrame(() => {
        setCurrentPosition(position);
        if (syncedLyrics.length > 0) {
          const shouldStartTyping = position >= syncedLyrics[0].startTimeMs;
          setCanStartTyping(shouldStartTyping);
        }
      });
      lastPositionUpdate.current = now;
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

  // Memoize getCharacterOffset
  const getCharacterOffset = useCallback((wordIndex: number) => 
    words.flat().slice(0, wordIndex).join(" ").length + (wordIndex > 0 ? 1 : 0)
  , [words]);

  const updateUserScore = useCallback(async (wpm: number, accuracy: number) => {
    try {
      const response = await fetch('/api/scores', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          wpm,
          accuracy,
          songId: spotifyTrackId,
          userId: user?.id
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to update score');
      }

      const { score, totalScore } = await response.json();
      
      // You can show a notification or update UI to show the earned score
      console.log(`Earned ${score} points! Total score: ${totalScore}`);
    } catch (error) {
      console.error('Error updating score:', error);
    }
  }, [spotifyTrackId, user?.id]);

  // Memoize finishTest
  const finishTest = useCallback(() => {
    if (!startTime) return;

    const endTime = Date.now();
    const timeInSeconds = Math.max((endTime - startTime) / 1000, 1);
    const timeInMinutes = timeInSeconds / 60;

    let totalCharactersTyped = 0;
    let correctCharactersTyped = 0;

    for (let wordIdx = 0; wordIdx <= currentWordIndex; wordIdx++) {
      const word = words.flat()[wordIdx];
      if (!word) continue;
      
      const offset = getCharacterOffset(wordIdx);
      const charLimit = wordIdx === currentWordIndex ? input.length : word.length;
      
      for (let charIdx = 0; charIdx < charLimit; charIdx++) {
        totalCharactersTyped++;
        if (correctChars[offset + charIdx]) {
          correctCharactersTyped++;
        }
      }
      
      if (wordIdx < currentWordIndex) {
        totalCharactersTyped++;
        correctCharactersTyped++;
      }
    }

    const calculatedAccuracy = totalCharactersTyped > 0
      ? Math.round((correctCharactersTyped / totalCharactersTyped) * 100)
      : 0;

    const calculatedRawWPM = Math.round(totalCharactersTyped / 5 / timeInMinutes);
    const calculatedWPM = Math.round(calculatedRawWPM * (calculatedAccuracy / 100));

    setRawWPM(Math.min(calculatedRawWPM, 500));
    setWPM(Math.min(calculatedWPM, 500));
    setAccuracy(calculatedAccuracy);
    setIsFinished(true);

    // Update user score if logged in
    if (user) {
      updateUserScore(calculatedWPM, calculatedAccuracy);
    }
  }, [updateUserScore, startTime, currentWordIndex, words, input.length, correctChars, getCharacterOffset, user]);

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

  // Extract track ID from Spotify URL
  const extractTrackId = (url: string) => {
    const match = url.match(/track\/([a-zA-Z0-9]+)/);
    return match ? match[1] : null;
  };

  const handleUrlSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setIsTestActive(false);
    setCanStartTyping(false);

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
    
    // Set the Spotify track ID for the embed immediately
    setSpotifyTrackId(trackId);

    try {
      // First fetch lyrics
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
      
      // Only track the song play after lyrics are successfully fetched
      const response2 = await fetch('/api/songs', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ 
          songDetails: cleanTrackDetails, 
          spotifyUrl,
          userId: user?.id
        }),
      });

      if (!response2.ok) {
        console.error('Error tracking song:', await response2.json());
      }
      
      // Initialize the test
      initializeTest(data.lyrics, data.syncedLyrics);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setLoading(false);
    }
  };

  // Control Spotify player
  const controlSpotifyPlayer = (command: 'toggle' | 'play' | 'pause') => {
    if (spotifyEmbedRef.current?.contentWindow) {
      spotifyEmbedRef.current.contentWindow.postMessage({ command }, '*');
    }
  };

  // Memoize getCharacterClass to prevent unnecessary recalculations
  const getCharacterClass = useCallback((wordIndex: number, charIndex: number) => {
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
  }, [currentWordIndex, currentCharIndex, input.length, correctChars, getCharacterOffset]);

  // Memoize handleInputChange to prevent unnecessary recreations
  const handleInputChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    if (isFinished || !isTestActive || !canStartTyping) return;

    const value = e.target.value;
    inputRef.current?.focus();

    // Set start time on first input
    if (!startTime) {
      setStartTime(Date.now());
      // Start tracking elapsed time
      const timer = setInterval(() => {
        setElapsedTime(prev => prev + 1);
      }, 1000);
      return () => clearInterval(timer);
    }

    if (value.endsWith(" ")) {
      const word = value.trim();
      const currentWord = words.flat()[currentWordIndex];

      // Batch state updates
      const newCorrectChars = [...correctChars];
      const offset = getCharacterOffset(currentWordIndex);
      for (let i = 0; i < currentWord.length; i++) {
        newCorrectChars[offset + i] = word[i] === currentWord[i];
      }

      // Use a single setState call with all updates
      if (currentWordIndex === words.flat().length - 1) {
        requestAnimationFrame(() => {
          setCorrectChars(newCorrectChars);
          finishTest();
        });
      } else {
        requestAnimationFrame(() => {
          setCorrectChars(newCorrectChars);
          setCurrentWordIndex(prev => prev + 1);
          setCurrentCharIndex(0);
          setInput("");
        });
      }
    } else {
      // Batch updates for character typing
      requestAnimationFrame(() => {
        setInput(value);
        setCurrentCharIndex(value.length);

        const currentWord = words.flat()[currentWordIndex];
        const offset = getCharacterOffset(currentWordIndex);
        const newCorrectChars = [...correctChars];
        for (let i = 0; i < value.length; i++) {
          newCorrectChars[offset + i] = value[i] === currentWord[i];
        }
        setCorrectChars(newCorrectChars);
      });
    }
  }, [currentWordIndex, words, correctChars, isFinished, isTestActive, canStartTyping, getCharacterOffset, startTime, finishTest]);

  // Handle end test
  const handleEndTest = () => {
    if (!startTime) {
      setStartTime(Date.now() - 1000); // Set minimum 1 second if ending before typing
    }
    
    // Stop the music
    if (isPlaying) {
      setIsPlaying(false);
      controlSpotifyPlayer('pause');
    }

    // Calculate and show results
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

  useEffect(() => {
    // Check current session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null);
    });

    // Listen for auth changes
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
    });

    return () => subscription.unsubscribe();
  }, []);

  const handleSignOut = async () => {
    await supabase.auth.signOut();
  };

  return (
    <div className="min-h-screen bg-background text-text flex flex-col items-center p-4 font-mono">
      <header className="w-full max-w-3xl flex items-center justify-between mb-8">
        <div className="flex items-center gap-2">
          <Keyboard className="w-6 h-6 text-primary" />
          <span className="text-lg font-bold text-primary">TypeTheLyrics</span>
        </div>
        <div className="flex items-center gap-4">
          {user ? (
            <div className="flex items-center gap-4">
              <span className="text-textDark">{user.user_metadata.username}</span>
              <Button
                variant="ghost"
                size="sm"
                onClick={handleSignOut}
                className="flex items-center gap-2 text-textDark hover:text-textDark/90"
              >
                <LogOut className="w-4 h-4" />
                Sign Out
              </Button>
            </div>
          ) : (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => window.location.href = '/auth'}
              className="flex items-center gap-2 text-textDark hover:text-textDark/90"
            >
              <LogIn className="w-4 h-4" />
              Sign In (to save your scores)
            </Button>
          )}
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
          <>
            <URLInput
              spotifyUrl={spotifyUrl}
              onUrlChange={handleUrlChange}
              onSubmit={handleUrlSubmit}
              loading={loading}
              error={error}
              filters={filters}
              onFilterChange={handleFilterChange}
            />
            <div className="mt-8 max-w-4xl mx-auto">
              <Leaderboard />
            </div>
          </>
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

            <div className="flex gap-4 h-full">
              <MemoizedTypingContainer
                words={words}
                currentWordIndex={currentWordIndex}
                currentCharIndex={currentCharIndex}
                correctChars={correctChars}
                input={input}
                isFinished={isFinished}
                canStartTyping={canStartTyping}
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
                    <div className="text-3xl font-bold text-text">
                      {wpm}
                    </div>
                    <div className="text-sm text-textDark">WPM</div>
                  </div>
                  <div className="p-4 rounded-lg bg-[#2c2e31] shadow-lg">
                    <div className="text-3xl font-bold text-text">
                      {rawWPM}
                    </div>
                    <div className="text-sm text-textDark">Raw WPM</div>
                  </div>
                  <div className="p-4 rounded-lg bg-[#2c2e31] shadow-lg">
                    <div className="text-3xl font-bold text-text">
                      {accuracy}%
                    </div>
                    <div className="text-sm text-textDark">Accuracy</div>
                  </div>
                </div>
                <div className="flex gap-2 justify-center">
                  <Button
                    onClick={() => setIsTestActive(false)}
                    variant="outline"
                    className="gap-2 bg-[#2c2e31] text-text hover:bg-[#2c2e31]/90 hover:text-text/60"
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