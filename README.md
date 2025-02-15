# TypeTheLyrics - Type Along with Your Favorite Songs

This project is a fun and engaging web application that allows users to practice their typing skills while following along with synchronized lyrics from their favorite Spotify songs.  It combines a typing test with a music player, creating an interactive and motivating experience. Users can input a Spotify track URL, and the application will fetch the lyrics and synchronize the typing test with the music playback.


## Features

*   **Synchronized Lyrics:**  Type along with the music in real-time, thanks to synchronized lyrics.
*   **Typing Test:**  Tracks words per minute (WPM) and accuracy.
*   **Spotify Integration:**  Seamlessly integrates with Spotify to fetch song details and lyrics.
*   **Leaderboard:**  Compete with others by viewing the leaderboard of top typists and most played songs.
*   **User Authentication:** Secure user accounts for score saving.
*   **Customizable Filters:** Option to enable lowercase only or remove punctuation from the lyrics.
*   **Responsive Design:**  Works smoothly on various screen sizes.


## Usage

1.  Enter a valid Spotify track URL.
2.  Choose optional filters (lowercase, no punctuation).
3.  Click "Get Lyrics" to start.
4.  Type the lyrics as they appear, synchronized with the Spotify player.
5.  View your WPM, raw WPM, and accuracy after finishing the test.
6.  Check out the Leaderboard to see how you rank against other users and popular songs.


## Installation

1.  Clone the repository: `git clone https://github.com/[YourGitHubUsername]/TypeTheLyrics.git`
2.  Navigate to the project directory: `cd TypeTheLyrics`
3.  Install dependencies: `npm install` or `yarn install` or `pnpm install` or `bun install`
4.  Run the development server: `npm run dev` or `yarn dev` or `pnpm dev` or `bun dev`


## Technologies Used

*   **Next.js:**  React framework for building the user interface.
*   **React:**  JavaScript library for building user interfaces.
*   **Tailwind CSS:**  Utility-first CSS framework for styling.
*   **Supabase:**  Backend service for authentication and database management.  Provides authentication and a PostgreSQL database for user data and song tracking.
*   **Spotify Web API:**  Used to fetch song information and lyrics from Spotify.
*   **`@supabase/auth-helpers-nextjs`:**  Supabase helper library for Next.js authentication.
*   **Lucide:** Icon library for UI elements.
*   **clsx:** Utility for efficiently joining classNames.
*   **tailwind-merge:** Utility for merging Tailwind CSS classes.
*   **class-variance-authority:** Utility for creating reusable and variant-aware CSS classes.
*   **`next/font`:** Next.js's font optimization library.


## API Documentation

### `/api/leaderboard`

**GET**

Returns the top 10 users and top 10 songs.

**Response:**

```json
{
  "topUsers": [
    { "username": "user1", "score": 1000 },
    // ... more users
  ],
  "topSongs": [
    {
      "title": "Song 1",
      "artist": "Artist 1",
      "play_count": 50,
      "spotify_url": "spotify_url",
      "most_played_by_username": "user1"
    },
    // ... more songs
  ]
}
```

### `/api/lyrics`

**POST**

Requires a Spotify track URL. Returns lyrics and synchronized lyrics data if available.

**Request Body:**

```json
{
  "url": "spotify_track_url"
}
```

**Response:**

```json
{
  "lyrics": "Song lyrics",
  "syncType": "SYNCED" or "UNSYNCED",
  "syncedLyrics": [
     { "startTimeMs": 1000, "words": "First line" },
     // ...more synced lyrics
  ],
  "trackDetails": {
    "track_name": "Song Title",
    "track_artist": "Artist Name",
    "track_album": "Album Name",
    "track_duration": "03:20.50"
  }
}
```

### `/api/scores`

**POST**

Submits typing test scores and updates the user's score in the database.

**Request Body:**

```json
{
  "wpm": 60,
  "accuracy": 95,
  "userId": "user_id"
}
```

**Response:**

```json
{
  "success": true,
  "score": 547,
  "totalScore": 1547
}
```

### `/api/songs`

**POST**

Tracks a song play, updating play count and potentially the user who played it most.

**Request Body:**

```json
{
  "songDetails": {
    "track_name": "Song Title",
    "track_artist": "Artist Name",
    "track_album": "Album Name",
    "track_duration": "03:20.50"
  },
  "spotifyUrl": "spotify_track_url",
  "userId": "user_id" // optional
}
```

**Response:**

```json
{
  "success": true,
  "songId": "song_id"
}
```


## Dependencies

Refer to `package.json` for a complete list of project dependencies.


## Contributing

Contributions are welcome! Please open an issue or submit a pull request.


## Testing

No explicit testing framework is present in this codebase.  Adding unit or integration tests is recommended for future development.


*README.md was made with [Etchr](https://etchr.dev)*