import { createRouteHandlerClient } from "@supabase/auth-helpers-nextjs";
import { cookies } from "next/headers";
import { NextResponse } from "next/server";

export async function POST(request: Request) {
  try {
    const supabase = createRouteHandlerClient({ cookies });
    const { songDetails, spotifyUrl } = await request.json();

    if (!songDetails || !spotifyUrl) {
      return NextResponse.json(
        { error: "Missing song details" },
        { status: 400 },
      );
    }

    const cleanUrl = spotifyUrl.split("?")[0];

    // First, get or create the song
    let songId: string;
    const { data: existingSong, error: fetchError } = await supabase
      .from("songs")
      .select("id, play_count")
      .eq("spotify_url", cleanUrl)
      .single();

    if (fetchError && fetchError.code !== "PGRST116") {
      return NextResponse.json({ error: "Database error" }, { status: 500 });
    }

    if (existingSong) {
      songId = existingSong.id;

      // Update existing song's play count
      const { error: updateError } = await supabase
        .from("songs")
        .update({
          play_count: (existingSong.play_count || 0) + 1,
        })
        .eq("id", songId);

      if (updateError) {
        console.error("Error updating song:", updateError);
        return NextResponse.json({ error: "Update error" }, { status: 500 });
      }
    } else {
      // Insert new song
      const { data: newSong, error: insertError } = await supabase
        .from("songs")
        .insert([
          {
            title: songDetails.track_name,
            artist: songDetails.track_artist,
            spotify_url: cleanUrl,
            play_count: 1,
          },
        ])
        .select()
        .single();

      if (insertError || !newSong) {
        console.error("Error inserting song:", insertError);
        return NextResponse.json({ error: "Insert error" }, { status: 500 });
      }

      songId = newSong.id;
    }

    // Remove song_plays tracking
    return NextResponse.json({
      success: true,
      songId,
    });
  } catch (error) {
    console.error("Server error:", error);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
