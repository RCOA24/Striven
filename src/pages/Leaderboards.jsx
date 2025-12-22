import React, { useState, useEffect, useContext, useCallback } from 'react';
import { Trophy, Crown, Zap, RefreshCw, AlertCircle } from 'lucide-react';
import { supabase } from '../lib/supabaseClient';
import { syncToCloud } from '../services/syncService';
import { AppContext } from '../App';

const Leaderboards = () => {
  const { user, session, showNotification, authLoading } = useContext(AppContext);

  const [leaderboard, setLeaderboard] = useState([]);
  const [userRank, setUserRank] = useState(null);
  const [loading, setLoading] = useState(true);
  const [syncing, setSyncing] = useState(false);
  const [error, setError] = useState(null);
  const [showLongLoadingMessage, setShowLongLoadingMessage] = useState(false);

  // Memoize fetchLeaderboard so it doesn't change on every render
  const fetchLeaderboard = useCallback(async (isInitial = false) => {
    if (isInitial) setLoading(true);
    // Don't clear error immediately to avoid flashing if we have data
    
    try {
      // 1. Fetch the top 50 profiles
      const { data, error: fetchError } = await supabase
        .from('profiles')
        .select('username, striven_score')
        .order('striven_score', { ascending: false })
        .limit(50);

      if (fetchError) throw fetchError;

      setLeaderboard(data || []);
      setError(null); // Clear error only on success
      
      // 2. If user is logged in, fetch their specific rank
      // Use session from context instead of calling getSession again
      const currentUserId = session?.user?.id || user?.id;

      if (currentUserId) {
        const { data: userProfile } = await supabase
          .from('profiles')
          .select('striven_score, username')
          .eq('id', currentUserId)
          .single();

        if (userProfile) {
          const { count } = await supabase
            .from('profiles')
            .select('id', { count: 'exact', head: true })
            .gt('striven_score', userProfile.striven_score);

          setUserRank({
            rank: (count || 0) + 1,
            score: userProfile.striven_score,
            username: userProfile.username,
          });
        }
      }
    } catch (err) {
      console.error('Leaderboard Fetch Error:', err);
      setError(err.message || 'Failed to connect to the league');
    } finally {
      setLoading(false);
    }
  }, [session, user]);

  // Handle Sync Logic
  const handleSyncNow = async () => {
    setSyncing(true);
    try {
      const result = await syncToCloud();
      
      if (result.success) {
        showNotification({
          type: 'success',
          title: 'Score Synced!',
          message: 'Your rank has been updated',
          duration: 3000,
        });
        await fetchLeaderboard(false);
      } else if (result.isRedirecting) {
        return; // Page will reload from OAuth
      } else if (result.isCooldown) {
        showNotification({
          type: 'info',
          title: 'Already Synced',
          message: result.error?.message,
          duration: 3000,
        });
      } else {
        throw result.error;
      }
    } catch (err) {
      showNotification({
        type: 'error',
        title: 'Sync Failed',
        message: err?.message || 'Check your connection',
        duration: 3000,
      });
    } finally {
      setSyncing(false);
    }
  };

  // Effect 1: Loading state assurance timer
  useEffect(() => {
    let timer;
    if (loading) {
      timer = setTimeout(() => setShowLongLoadingMessage(true), 2500);
    } else {
      setShowLongLoadingMessage(false);
    }
    return () => clearTimeout(timer);
  }, [loading]);

  // Effect 2: Initial Fetch & Subscription
  useEffect(() => {
    // Start fetching immediately - don't wait for auth to complete
    // The leaderboard is public data, auth only affects showing "You" badge
    fetchLeaderboard(true);

    // Setup real-time listener
    const channel = supabase
      .channel('leaderboard-updates')
      .on('postgres_changes', 
          { event: '*', schema: 'public', table: 'profiles' }, 
          () => fetchLeaderboard(false)
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [fetchLeaderboard]);

  // Effect 3: Refetch user rank when auth state changes
  useEffect(() => {
    // When user/session becomes available, refetch to get user rank
    if (!authLoading && (user || session)) {
      fetchLeaderboard(false);
    }
  }, [authLoading, user, session]);

  const getMedalBadge = (rank) => {
    if (rank === 1) return <Crown className="w-5 h-5 text-yellow-400" />;
    if (rank === 2) return <Trophy className="w-5 h-5 text-zinc-300" />;
    if (rank === 3) return <Trophy className="w-5 h-5 text-amber-600" />;
    return null;
  };

  if (loading) {
    return (
      <div className="w-full max-w-3xl mx-auto pb-24 px-4 pt-4">
        <div className="flex items-center justify-between mb-8">
           <div className="h-10 w-48 bg-zinc-800 rounded-lg animate-pulse" />
           <div className="h-10 w-28 bg-zinc-800 rounded-xl animate-pulse" />
        </div>
        {showLongLoadingMessage && (
          <div className="mb-6 p-4 bg-emerald-900/20 border border-emerald-500/20 rounded-xl flex items-center gap-3">
            <RefreshCw className="w-4 h-4 text-emerald-500 animate-spin" />
            <p className="text-emerald-400 text-sm">Connecting to the league...</p>
          </div>
        )}
        <div className="space-y-3">
          {[...Array(5)].map((_, i) => (
            <div key={i} className="h-20 bg-zinc-900/50 rounded-2xl animate-pulse" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="w-full max-w-3xl mx-auto pb-32 px-4 font-apple">
      
      {/* Header */}
      <div className="flex items-center justify-between pt-6 mb-6">
        <div>
          <h1 className="text-3xl font-bold text-white tracking-tight flex items-center gap-2">
            <Crown className="w-8 h-8 text-yellow-400" />
            Resolution League
          </h1>
          <p className="text-zinc-400 text-sm mt-1">Global Leaderboard</p>
        </div>
        <button
          onClick={handleSyncNow}
          disabled={syncing}
          className="flex items-center gap-2 px-4 py-2.5 bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white font-bold rounded-xl transition-all shadow-lg shadow-emerald-900/20"
        >
          <RefreshCw className={`w-4 h-4 ${syncing ? 'animate-spin' : ''}`} />
          {syncing ? 'Syncing...' : 'Sync Score'}
        </button>
      </div>

      {/* Error View */}
      {error && (
        <div className="p-4 bg-red-900/20 border border-red-500/30 rounded-xl mb-6 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <AlertCircle className="w-5 h-5 text-red-400" />
            <p className="text-red-200 text-sm">{error}</p>
          </div>
          <button onClick={() => fetchLeaderboard(true)} className="text-xs font-bold text-white bg-red-500/40 px-3 py-1 rounded-md">Retry</button>
        </div>
      )}

      {/* Empty State */}
      {leaderboard.length === 0 && !error && (
        <div className="bg-zinc-900 border border-white/5 rounded-3xl p-12 text-center">
          <Zap className="w-12 h-12 text-emerald-400 mx-auto mb-4" />
          <h2 className="text-xl font-bold text-white">The League is Empty</h2>
          <p className="text-zinc-400 mt-2 mb-6">Be the first to sync your score and claim #1!</p>
          <button onClick={handleSyncNow} className="bg-emerald-600 text-white px-8 py-3 rounded-xl font-bold">Sync Now</button>
        </div>
      )}

      {/* List */}
      <div className="space-y-3">
        {leaderboard.map((profile, index) => {
          const rank = index + 1;
          const isMe = userRank && userRank.username === profile.username && userRank.score === profile.striven_score;

          return (
            <div
              key={index}
              className={`flex items-center justify-between p-4 rounded-2xl border transition-all ${
                isMe ? 'bg-emerald-950/30 border-emerald-500/50 ring-1 ring-emerald-500/20' : 'bg-zinc-900/50 border-white/5'
              }`}
            >
              <div className="flex items-center gap-4">
                <div className="w-10 h-10 flex items-center justify-center rounded-xl bg-black/40 font-bold text-zinc-400">
                  {getMedalBadge(rank) || `#${rank}`}
                </div>
                <div>
                  <p className={`font-bold ${isMe ? 'text-emerald-400' : 'text-white'}`}>
                    {profile.username || 'Anonymous Athlete'}
                    {isMe && <span className="ml-2 text-[10px] bg-emerald-500/20 px-1.5 py-0.5 rounded uppercase tracking-wider">You</span>}
                  </p>
                </div>
              </div>
              <div className="text-right">
                <p className="text-xl font-black text-white">{profile.striven_score.toLocaleString()}</p>
                <p className="text-[10px] text-zinc-500 font-bold uppercase tracking-widest">Points</p>
              </div>
            </div>
          );
        })}
      </div>

      {/* Fixed Sticky footer for your specific rank if you are not in top 50 */}
      {userRank && userRank.rank > 50 && (
        <div className="fixed bottom-24 left-4 right-4 max-w-3xl mx-auto z-40">
           <div className="bg-emerald-600 p-4 rounded-2xl flex items-center justify-between shadow-2xl shadow-black">
              <div className="flex items-center gap-3">
                <div className="bg-white/20 px-2 py-1 rounded text-white font-bold">#{userRank.rank}</div>
                <p className="text-white font-bold">Your Rank</p>
              </div>
              <p className="text-white font-black text-xl">{userRank.score.toLocaleString()} pts</p>
           </div>
        </div>
      )}
    </div>
  );
};

export default Leaderboards;