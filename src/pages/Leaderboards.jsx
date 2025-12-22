import React, { useState, useEffect, useContext } from 'react';
import { Trophy, Crown, Zap, RefreshCw, AlertCircle } from 'lucide-react';
import { supabase } from '../lib/supabaseClient';
import { syncToCloud } from '../services/syncService';
import { AppContext } from '../App';

const Leaderboards = () => {
  const { user, showNotification } = useContext(AppContext);

  const [leaderboard, setLeaderboard] = useState([]);
  const [userRank, setUserRank] = useState(null);
  const [loading, setLoading] = useState(true);
  const [syncing, setSyncing] = useState(false);
  const [error, setError] = useState(null);
  const [showLongLoadingMessage, setShowLongLoadingMessage] = useState(false);

  useEffect(() => {
    let timer;
    if (loading) {
      setShowLongLoadingMessage(false);
      timer = setTimeout(() => setShowLongLoadingMessage(true), 2500); // Show assurance after 2.5s
    }
    return () => clearTimeout(timer);
  }, [loading]);

  const fetchLeaderboard = async () => {
    setLoading(true);
    setError(null);

    try {
      // Add a timeout wrapper for the fetch
      const fetchPromise = supabase
        .from('profiles')
        .select('username, striven_score')
        .order('striven_score', { ascending: false })
        .limit(50);

      // Race between fetch and timeout (30 seconds for cold starts)
      const timeoutPromise = new Promise((_, reject) => 
        setTimeout(() => reject(new Error('Request timed out - please try again')), 30000)
      );

      // Use .then() on the query builder to ensure it's treated as a promise
      const { data, error: fetchError } = await Promise.race([
        fetchPromise.then(res => res), 
        timeoutPromise
      ]);

      if (fetchError) throw fetchError;

      setLeaderboard(data || []);
    } catch (err) {
      console.error('Error fetching leaderboard:', err);
      setError(err.message || 'Failed to load leaderboard');
    } finally {
      setLoading(false);
    }
  };

  const handleSyncNow = async () => {
    setSyncing(true);
    try {
      const { success, error: syncError, isRedirecting, isCooldown } = await syncToCloud();
      if (success) {
        showNotification({
          type: 'success',
          title: 'Score Synced!',
          message: 'Your data has been sent to the cloud',
          duration: 2000,
        });
        await fetchLeaderboard();
      } else if (isRedirecting) {
        // OAuth redirect in progress - don't show error, just wait
        console.log('OAuth redirect initiated, waiting for callback...');
        // Keep syncing state - page will reload after auth
        return;
      } else if (isCooldown) {
        // Show cooldown message instead of error
        showNotification({
          type: 'info',
          title: 'Already Synced',
          message: syncError?.message || 'Please wait before syncing again',
          duration: 3000,
        });
      } else {
        throw syncError || new Error('Sync failed');
      }
    } catch (err) {
      showNotification({
        type: 'error',
        title: 'Sync Failed',
        message: err?.message || 'Could not sync your score',
        duration: 3000,
      });
    } finally {
      // Always reset syncing state (except for OAuth redirect which returns early)
      setSyncing(false);
    }
  };

  useEffect(() => {
    // Fetch leaderboard immediately
    fetchLeaderboard();

    // Optional: Set up real-time subscription after initial load
    // Delay subscription to not block initial render
    const subscriptionTimeout = setTimeout(() => {
      try {
        const channel = supabase
          .channel('profiles-changes')
          .on(
            'postgres_changes',
            { event: '*', schema: 'public', table: 'profiles' },
            () => {
              fetchLeaderboard();
            }
          )
          .subscribe((status) => {
            if (status === 'SUBSCRIBED') {
              console.log('Leaderboard real-time connected');
            }
          });
        
        // Store for cleanup
        window._leaderboardChannel = channel;
      } catch (err) {
        console.warn('Real-time subscription failed:', err);
      }
    }, 2000); // Delay 2 seconds to let initial fetch complete

    return () => {
      clearTimeout(subscriptionTimeout);
      if (window._leaderboardChannel) {
        supabase.removeChannel(window._leaderboardChannel);
        window._leaderboardChannel = null;
      }
    };
  }, [user?.id]); // Re-fetch when user signs in to ensure RLS policies are satisfied

  // Fetch user rank when user becomes available
  useEffect(() => {
    const fetchUserRank = async () => {
      if (!user?.id) return;
      
      try {
        const { data: userProfile, error: userError } = await supabase
          .from('profiles')
          .select('id, username, striven_score')
          .eq('id', user.id)
          .single();

        if (!userError && userProfile) {
          const { count, error: countError } = await supabase
            .from('profiles')
            .select('id', { count: 'exact', head: true })
            .gt('striven_score', userProfile.striven_score);

          if (!countError) {
            setUserRank({
              rank: (count || 0) + 1,
              score: userProfile.striven_score,
              username: userProfile.username,
            });
          }
        }
      } catch (err) {
        console.error('Error fetching user rank:', err);
      }
    };

    fetchUserRank();
  }, [user?.id]);

  const getMedalBadge = (rank) => {
    const badges = {
      1: { icon: <Crown className="w-5 h-5 text-yellow-400" /> },
      2: { icon: <Trophy className="w-5 h-5 text-gray-300" /> },
      3: { icon: <Trophy className="w-5 h-5 text-amber-700" /> },
    };
    return badges[rank];
  };

  const getDisplayName = (profile) => {
    // If profile has username from database, use it
    if (profile.username) {
      return profile.username;
    }
    // Otherwise, use the current user's Google name if available
    if (user?.name) {
      return user.name;
    }
    // Fallback to email if name not available
    if (user?.email) {
      return user.email.split('@')[0];
    }
    return 'Athlete';
  };

  if (loading) {
    return (
      <div className="w-full max-w-3xl mx-auto pb-24 px-4 pt-4">
        {/* Header Skeleton */}
        <div className="mb-6">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 bg-zinc-800 rounded-full animate-pulse" />
              <div className="h-8 w-48 bg-zinc-800 rounded-lg animate-pulse" />
            </div>
            <div className="h-10 w-28 bg-zinc-800 rounded-xl animate-pulse" />
          </div>
          <div className="h-4 w-64 bg-zinc-800 rounded animate-pulse" />
        </div>

        {/* Assurance Message */}
        <div className={`mb-6 transition-all duration-500 ease-out overflow-hidden ${showLongLoadingMessage ? 'max-h-20 opacity-100' : 'max-h-0 opacity-0'}`}>
          <div className="p-4 bg-emerald-900/20 border border-emerald-500/20 rounded-xl flex items-center gap-3">
            <div className="w-4 h-4 border-2 border-emerald-500 border-t-transparent rounded-full animate-spin" />
            <p className="text-emerald-400 text-sm font-medium">
              Connecting to the league... almost there!
            </p>
          </div>
        </div>

        {/* List Skeletons */}
        <div className="space-y-3">
          {[...Array(6)].map((_, i) => (
            <div key={i} className="bg-zinc-900/50 border border-white/5 rounded-2xl p-5 flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="w-10 h-10 bg-zinc-800 rounded-lg animate-pulse" />
                <div className="space-y-2">
                  <div className="h-5 w-32 bg-zinc-800 rounded animate-pulse" />
                  {i === 0 && <div className="h-3 w-12 bg-zinc-800/50 rounded animate-pulse" />}
                </div>
              </div>
              <div className="flex flex-col items-end gap-2">
                <div className="h-6 w-24 bg-zinc-800 rounded animate-pulse" />
                <div className="h-3 w-8 bg-zinc-800/50 rounded animate-pulse" />
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="w-full max-w-3xl mx-auto pb-24">
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=SF+Pro+Display:wght@400;500;600;700&display=swap');
        .font-apple { font-family: -apple-system, BlinkMacSystemFont, "SF Pro Display", "Segoe UI", Roboto, Helvetica, Arial, sans-serif; }
      `}</style>

      {/* Header */}
      <div className="mb-6 px-4 pt-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Crown className="w-8 h-8 text-yellow-400" />
            <h1 className="text-4xl font-bold text-white font-apple tracking-tight">Resolution League</h1>
          </div>
          <button
            onClick={handleSyncNow}
            disabled={syncing}
            className="flex items-center gap-2 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 disabled:bg-emerald-600/50 text-white font-semibold rounded-xl transition-colors disabled:cursor-not-allowed"
          >
            <RefreshCw className={`${syncing ? 'animate-spin' : ''} w-5 h-5`} />
            {syncing ? 'Syncing...' : 'Sync Now'}
          </button>
        </div>
        <p className="text-zinc-400 font-medium font-apple mt-1">Compete for the highest Striven Score</p>
      </div>

      {/* Error State */}
      {error && (
        <div className="px-4 mb-6">
          <div className="p-4 bg-zinc-900/90 border border-red-500/30 rounded-xl flex items-start gap-3">
            <AlertCircle className="w-5 h-5 text-red-400 mt-0.5 flex-shrink-0" />
            <div className="flex-1">
              <p className="text-white font-semibold">Error Loading Leaderboard</p>
              <p className="text-red-300/80 text-sm mt-1">{error}</p>
              <button
                onClick={fetchLeaderboard}
                className="mt-3 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-medium rounded-lg transition-colors"
              >
                Try Again
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Empty State */}
      {leaderboard.length === 0 && !error && (
        <div className="px-4">
          <div className="bg-zinc-900 rounded-2xl border border-white/5 p-8 text-center">
            <div className="w-16 h-16 bg-emerald-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
              <Zap className="w-8 h-8 text-emerald-400" />
            </div>
            <h2 className="text-2xl font-bold text-white mb-1 font-apple">The Resolution League Starts Jan 1st</h2>
            <p className="text-zinc-400 mb-4 font-apple">Be the first to sync your score and claim your place at the top of the leaderboard.</p>
            <button
              onClick={handleSyncNow}
              disabled={syncing || !user}
              className="px-6 py-3 bg-emerald-600 hover:bg-emerald-700 disabled:bg-emerald-600/50 text-white font-semibold rounded-xl transition-colors"
            >
              {user ? (syncing ? 'Syncing...' : 'Be First - Sync Now') : 'Sign In to Join'}
            </button>
          </div>
        </div>
      )}

      {/* Leaderboard List */}
      {leaderboard.length > 0 && (
        <div className="px-4 space-y-3">
          {leaderboard.map((profile, index) => {
            const rank = index + 1;
            const medal = getMedalBadge(rank);
            const isCurrentUser = userRank && userRank.rank === rank;

            if (rank <= 3 && medal) {
              return (
                <div
                  key={index}
                  className={`bg-zinc-900 rounded-2xl p-5 border border-white/10 flex items-center justify-between ${
                    isCurrentUser ? 'ring-2 ring-emerald-500' : ''
                  }`}
                >
                  <div className="flex items-center gap-4">
                    <div className="flex items-center justify-center w-10 h-10 rounded-lg bg-black/30 border border-white/10 text-white">
                      {medal.icon}
                    </div>
                    <div>
                      <p className="text-white font-semibold text-lg font-apple">{getDisplayName(profile)}</p>
                      {isCurrentUser && (
                        <p className="text-emerald-400 text-xs font-medium">You</p>
                      )}
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-white font-bold text-2xl font-apple">{profile.striven_score.toLocaleString()}</p>
                    <p className="text-zinc-500 text-xs">pts</p>
                  </div>
                </div>
              );
            }

            return (
              <div
                key={index}
                className={`bg-zinc-900 border border-white/10 rounded-2xl p-5 flex items-center justify-between hover:bg-zinc-800 transition-colors ${
                  isCurrentUser ? 'ring-2 ring-emerald-500' : ''
                }`}
              >
                <div className="flex items-center gap-4">
                  <div className="flex items-center justify-center w-10 h-10 rounded-lg bg-black/30 border border-white/10 text-white/70 font-bold text-lg">
                    #{rank}
                  </div>
                  <div>
                    <p className="text-white font-semibold font-apple">{getDisplayName(profile)}</p>
                    {isCurrentUser && (
                      <p className="text-emerald-400 text-xs font-medium">You</p>
                    )}
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-white font-bold text-xl font-apple">{profile.striven_score.toLocaleString()}</p>
                  <p className="text-zinc-500 text-xs">pts</p>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Sticky User Rank Bar */}
      {userRank && userRank.rank > 50 && user && (
        <div className="fixed bottom-4 left-0 right-0 z-40 flex justify-center px-4">
          <div className="bg-zinc-900/90 backdrop-blur-xl rounded-2xl p-4 max-w-3xl w-full border border-white/10 flex items-center justify-between">
            <div>
              <p className="text-zinc-400 text-xs">Your Rank</p>
              <p className="text-white font-bold text-lg font-apple">
                #{userRank.rank} • {userRank.username || user?.name || user?.email?.split('@')[0] || 'Athlete'}
              </p>
            </div>
            <div className="text-right">
              <p className="text-zinc-400 text-xs">Score</p>
              <p className="text-white font-bold text-2xl font-apple">{userRank.score.toLocaleString()}</p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Leaderboards;
