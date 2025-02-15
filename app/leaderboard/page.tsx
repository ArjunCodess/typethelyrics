"use client";

import Leaderboard from "@/components/leaderboard/leaderboard";
import { Keyboard } from "lucide-react";
import Link from "next/link";

export default function LeaderboardPage() {
  return (
    <div className="min-h-screen bg-background text-text flex flex-col items-center p-4 font-mono">
      <header className="w-full max-w-3xl flex items-center justify-between mb-8">
        <Link href="/" className="flex items-center gap-2 hover:opacity-80 transition-opacity">
          <Keyboard className="w-6 h-6 text-primary" />
          <span className="text-lg font-bold text-primary">TypeTheLyrics</span>
        </Link>
      </header>

      <main className="w-full max-w-6xl">
        <h1 className="text-2xl font-bold text-foreground mb-8 text-center">Leaderboard</h1>
        <Leaderboard />
      </main>
    </div>
  );
} 