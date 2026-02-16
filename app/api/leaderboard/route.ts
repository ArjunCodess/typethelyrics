import { createRouteHandlerClient } from "@supabase/auth-helpers-nextjs";
import { cookies } from "next/headers";
import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export async function GET() {
  try {
    const supabase = createRouteHandlerClient({ cookies });

    // Get top 10 users by score - no auth needed
    const { data: topUsers, error: usersError } = await supabase
      .from("users")
      .select("username, score")
      .order("score", { ascending: false })
      .limit(10);

    if (usersError) {
      console.error("Error fetching users:", usersError);
      return NextResponse.json(
        { error: "Failed to fetch top users" },
        { status: 500 },
      );
    }

    // First get top 10 songs
    const { data: topSongs, error: songsError } = await supabase
      .from("songs")
      .select(
        `
        title,
        artist,
        play_count,
        spotify_url
      `,
      )
      .order("play_count", { ascending: false })
      .limit(10);

    if (songsError) {
      console.error("Error fetching songs:", songsError);
      return NextResponse.json(
        { error: "Failed to fetch top songs" },
        { status: 500 },
      );
    }

    // Transform the songs data
    const transformedSongs =
      topSongs?.map((song) => ({
        title: song.title,
        artist: song.artist,
        play_count: song.play_count,
        spotify_url: song.spotify_url,
      })) || [];

    // Return the response with no-cache headers
    return new NextResponse(
      JSON.stringify({
        topUsers: topUsers || [],
        topSongs: transformedSongs,
      }),
      {
        headers: {
          "Content-Type": "application/json",
          "Cache-Control":
            "no-store, no-cache, must-revalidate, proxy-revalidate",
          Pragma: "no-cache",
          Expires: "0",
        },
      },
    );
  } catch (error) {
    console.error("Server error:", error);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
