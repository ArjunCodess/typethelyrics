"use client";

import { useState } from 'react';
import { supabase } from '@/lib/supabase';
import { Button } from '@/components/ui/button';
import { useRouter } from 'next/navigation';

export default function AuthPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [username, setUsername] = useState('');
  const [isSignUp, setIsSignUp] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const createUserProfile = async (userId: string) => {
    const { error } = await supabase
      .from('users')
      .insert([
        {
          id: userId,
          username,
          email,
          score: 0,
        }
      ]);

    if (error) throw error;
  };

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      if (isSignUp) {
        // Check if username is already taken
        const { data: existingUser, error: checkError } = await supabase
          .from('users')
          .select('username')
          .eq('username', username)
          .single();

        if (checkError && checkError.code !== 'PGRST116') {
          throw checkError;
        }

        if (existingUser) {
          throw new Error('Username already taken');
        }

        const { error: signUpError, data: signUpData } = await supabase.auth.signUp({
          email,
          password,
          options: {
            data: {
              username,
            }
          },
        });
        
        if (signUpError) throw signUpError;

        // Create user profile
        if (signUpData.user) {
          await createUserProfile(signUpData.user.id);
        }
        
        // Sign in immediately after sign up
        const { error: signInError } = await supabase.auth.signInWithPassword({
          email,
          password,
        });
        
        if (signInError) throw signInError;
        router.push('/');
      } else {
        const { error } = await supabase.auth.signInWithPassword({
          email,
          password,
        });
        if (error) throw error;
        router.push('/');
      }
    } catch (error) {
      setError(error instanceof Error ? error.message : 'An error occurred');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <div className="w-full max-w-md space-y-8 bg-card p-8 rounded-lg shadow-lg border border-border">
        <div>
          <h2 className="text-3xl font-bold text-center text-foreground">
            {isSignUp ? 'Create Account' : 'Sign In'}
          </h2>
          <p className="mt-2 text-sm text-center text-muted-foreground">
            {isSignUp
              ? 'Already have an account?'
              : "Don't have an account?"}{' '}
            <button
              onClick={() => setIsSignUp(!isSignUp)}
              className="text-primary hover:underline font-medium"
            >
              {isSignUp ? 'Sign In' : 'Sign Up'}
            </button>
          </p>
        </div>

        <form onSubmit={handleAuth} className="space-y-6">
          {isSignUp && (
            <div>
              <label htmlFor="username" className="block text-sm font-medium text-foreground">
                Username
              </label>
              <input
                id="username"
                type="text"
                required={isSignUp}
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                className="mt-1 block w-full px-3 py-2 bg-input border border-input rounded-md text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:border-input"
              />
            </div>
          )}

          <div>
            <label htmlFor="email" className="block text-sm font-medium text-foreground">
              Email
            </label>
            <input
              id="email"
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="mt-1 block w-full px-3 py-2 bg-input border border-input rounded-md text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:border-input"
            />
          </div>

          <div>
            <label htmlFor="password" className="block text-sm font-medium text-foreground">
              Password
            </label>
            <input
              id="password"
              type="password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="mt-1 block w-full px-3 py-2 bg-input border border-input rounded-md text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:border-input"
            />
          </div>

          {error && (
            <div className="text-destructive text-sm text-center">{error}</div>
          )}

          <Button
            type="submit"
            disabled={loading}
            className="w-full"
          >
            {loading
              ? 'Loading...'
              : isSignUp
              ? 'Create Account'
              : 'Sign In'}
          </Button>
        </form>
      </div>
    </div>
  );
}