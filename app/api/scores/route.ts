import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';

// Calculate score based on WPM and accuracy
function calculateScore(wpm: number, accuracy: number): number {
  // Base score calculation
  // WPM ranges: < 40 (poor), 40-60 (average), 60-80 (good), > 80 (excellent)
  // Accuracy ranges: < 92% (poor), 92-96% (average), 96-98% (good), > 98% (excellent)
  
  let score = 0;
  
  // WPM scoring (max 500 points)
  if (wpm < 40) {
    score += (wpm / 40) * 200;
  } else if (wpm < 60) {
    score += 200 + ((wpm - 40) / 20) * 100;
  } else if (wpm < 80) {
    score += 300 + ((wpm - 60) / 20) * 100;
  } else {
    score += 400 + Math.min((wpm - 80) / 20 * 100, 100); // Cap at 500
  }
  
  // Accuracy scoring (max 500 points)
  if (accuracy < 92) {
    score += (accuracy / 92) * 200;
  } else if (accuracy < 96) {
    score += 200 + ((accuracy - 92) / 4) * 100;
  } else if (accuracy < 98) {
    score += 300 + ((accuracy - 96) / 2) * 100;
  } else {
    score += 400 + Math.min((accuracy - 98) / 2 * 100, 100); // Cap at 500
  }
  
  return Math.round(score);
}

export async function POST(request: Request) {
  try {
    const cookieStore = cookies();
    const supabase = createRouteHandlerClient({ cookies: () => cookieStore });
    
    const { wpm, accuracy, userId } = await request.json();
    
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Calculate score
    const score = calculateScore(wpm, accuracy);

    // Get user's current score
    const { data: userData, error: fetchError } = await supabase
      .from('users')
      .select('score')
      .eq('id', userId)
      .single();

    if (fetchError) {
      return NextResponse.json({ error: 'Database error' }, { status: 500 });
    }

    // Update user's score (add new score to existing)
    const { error: updateError } = await supabase
      .from('users')
      .update({
        score: (userData?.score || 0) + score
      })
      .eq('id', userId);

    if (updateError) {
      return NextResponse.json({ error: 'Update error' }, { status: 500 });
    }

    return NextResponse.json({ 
      success: true, 
      score,
      totalScore: (userData?.score || 0) + score
    });
  } catch (error) {
    console.error('Server error:', error);
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
} 