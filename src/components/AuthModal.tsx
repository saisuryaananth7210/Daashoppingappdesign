import { useState } from 'react';
import { motion } from 'motion/react';
import { X, LogIn, UserPlus } from 'lucide-react';
import { getSupabaseClient } from '../utils/supabase/client';
import { projectId, publicAnonKey } from '../utils/supabase/info';

const supabase = getSupabaseClient();

interface AuthModalProps {
  onClose: () => void;
  onSuccess: (accessToken: string, isAdmin: boolean) => void;
}

export function AuthModal({ onClose, onSuccess }: AuthModalProps) {
  const [mode, setMode] = useState<'signin' | 'signup'>('signin');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [isAdmin, setIsAdmin] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) {
        console.error('Sign in error:', error);
        alert('Sign in failed: ' + error.message);
        return;
      }

      if (data.session?.access_token) {
        // Fetch user metadata to check if admin
        const userIsAdmin = data.user?.user_metadata?.isAdmin || false;
        onSuccess(data.session.access_token, userIsAdmin);
      }
    } catch (error) {
      console.error('Sign in error:', error);
      alert('Sign in failed');
    } finally {
      setLoading(false);
    }
  };

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const response = await fetch(
        `https://${projectId}.supabase.co/functions/v1/make-server-88ccad03/auth/signup`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${publicAnonKey}`,
          },
          body: JSON.stringify({
            email,
            password,
            name,
            isAdmin,
          }),
        }
      );

      if (!response.ok) {
        const error = await response.json();
        console.error('Sign up error:', error);
        alert('Sign up failed: ' + (error.error || 'Unknown error'));
        return;
      }

      // Now sign in
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) {
        console.error('Sign in after signup error:', error);
        alert('Account created but sign in failed. Please try signing in.');
        return;
      }

      if (data.session?.access_token) {
        onSuccess(data.session.access_token, isAdmin);
      }
    } catch (error) {
      console.error('Sign up error:', error);
      alert('Sign up failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-6"
      onClick={onClose}
    >
      <motion.div
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.9, opacity: 0 }}
        onClick={(e) => e.stopPropagation()}
        className="bg-white/10 backdrop-blur-xl border border-white/20 rounded-3xl w-full max-w-md overflow-hidden"
      >
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-white/20">
          <h2 className="text-white">{mode === 'signin' ? 'Sign In' : 'Sign Up'}</h2>
          <button
            onClick={onClose}
            className="bg-white/10 hover:bg-white/20 text-white rounded-full p-2 transition-colors"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={mode === 'signin' ? handleSignIn : handleSignUp} className="p-6">
          {mode === 'signup' && (
            <input
              type="text"
              placeholder="Full Name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
              className="w-full mb-4 bg-white/10 border border-white/20 rounded-2xl px-4 py-3 text-white placeholder:text-white/40 focus:outline-none focus:ring-2 focus:ring-white/30"
            />
          )}

          <input
            type="email"
            placeholder="Email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            className="w-full mb-4 bg-white/10 border border-white/20 rounded-2xl px-4 py-3 text-white placeholder:text-white/40 focus:outline-none focus:ring-2 focus:ring-white/30"
          />

          <input
            type="password"
            placeholder="Password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            className="w-full mb-4 bg-white/10 border border-white/20 rounded-2xl px-4 py-3 text-white placeholder:text-white/40 focus:outline-none focus:ring-2 focus:ring-white/30"
          />

          {mode === 'signup' && (
            <label className="flex items-center gap-3 text-white mb-6 cursor-pointer">
              <input
                type="checkbox"
                checked={isAdmin}
                onChange={(e) => setIsAdmin(e.target.checked)}
                className="w-5 h-5 rounded"
              />
              Sign up as Admin
            </label>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-gradient-to-r from-[#FF6B00] to-[#C84C0C] text-white py-4 rounded-2xl hover:opacity-90 transition-opacity disabled:opacity-50 flex items-center justify-center gap-2"
          >
            {loading ? (
              'Processing...'
            ) : mode === 'signin' ? (
              <>
                <LogIn className="w-5 h-5" />
                Sign In
              </>
            ) : (
              <>
                <UserPlus className="w-5 h-5" />
                Sign Up
              </>
            )}
          </button>

          <div className="mt-6 text-center">
            <button
              type="button"
              onClick={() => setMode(mode === 'signin' ? 'signup' : 'signin')}
              className="text-white/60 hover:text-white transition-colors"
            >
              {mode === 'signin'
                ? "Don't have an account? Sign up"
                : 'Already have an account? Sign in'}
            </button>
          </div>
        </form>
      </motion.div>
    </motion.div>
  );
}
