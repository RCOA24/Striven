import { supabase } from '../lib/supabaseClient';
import { getActivities, getFoodLogs, getTodayWorkout } from '../utils/db';

const SYNC_COOLDOWN_KEY = 'striven-sync-cooldown';
const SYNC_COOLDOWN_DURATION = 5 * 60 * 1000; // 5 minutes in milliseconds

/**
 * Calculate Striven Score based on local activity data
 * 
 * Scoring:
 * - 1 point per 100 steps
 * - 50 points per food entry
 * - 200 points per completed workout
 * 
 * @returns {Promise<number>} Total Striven score
 */
export const calculateStrivenScore = async () => {
  try {
    let score = 0;

    // Get all activities (steps)
    const activities = await getActivities();
    const totalSteps = activities.reduce((sum, activity) => sum + (activity.steps || 0), 0);
    const stepsScore = Math.floor(totalSteps / 100); // 1 point per 100 steps
    score += stepsScore;

    // Get food logs
    const foodLogs = await getFoodLogs();
    const foodScore = foodLogs.length * 50; // 50 points per food entry
    score += foodScore;

    // Get today's workout (completed exercises)
    const todayWorkout = await getTodayWorkout();
    const workoutScore = todayWorkout.length * 200; // 200 points per completed workout
    score += workoutScore;

    console.log(`Striven Score Calculated: ${score}`);
    console.log(`  Steps Score: ${stepsScore} (${totalSteps} steps)`);
    console.log(`  Food Score: ${foodScore} (${foodLogs.length} entries)`);
    console.log(`  Workout Score: ${workoutScore} (${todayWorkout.length} workouts)`);

    return score;
  } catch (error) {
    console.error('Error calculating Striven score:', error);
    return 0;
  }
};

/**
 * Check if sync is allowed based on cooldown
 * 
 * @returns {boolean} True if sync is allowed, false if within cooldown period
 */
const isSyncAllowed = () => {
  try {
    const lastSyncTime = localStorage.getItem(SYNC_COOLDOWN_KEY);
    
    if (!lastSyncTime) {
      return true; // First sync
    }

    const lastSync = parseInt(lastSyncTime, 10);
    const now = Date.now();
    const timeSinceLastSync = now - lastSync;

    if (timeSinceLastSync >= SYNC_COOLDOWN_DURATION) {
      return true; // Cooldown expired
    }

    console.log(
      `Sync cooldown active. Next sync in ${Math.ceil((SYNC_COOLDOWN_DURATION - timeSinceLastSync) / 1000)}s`
    );
    return false;
  } catch (error) {
    console.error('Error checking sync cooldown:', error);
    return true; // Allow sync on error
  }
};

/**
 * Set sync cooldown timer
 */
const setSyncCooldown = () => {
  try {
    localStorage.setItem(SYNC_COOLDOWN_KEY, Date.now().toString());
  } catch (error) {
    console.error('Error setting sync cooldown:', error);
  }
};

/**
 * Sync user data and Striven score to Supabase cloud
 * 
 * @param {Object} user - User object from auth context with id, email, name, avatar
 * @returns {Promise<{success: boolean, data: Object, error: Error|null}>}
 */
export const syncToCloud = async (userArg = null) => {
  try {
    // Step 1: Try to get the current session
    const { data: { session }, error: sessionError } = await supabase.auth.getSession();
    
    if (sessionError) {
      console.warn('Session retrieval warning:', sessionError.message);
    }

    let user = session?.user || userArg;

    // Step 2: If no session, guide user to sign in via OAuth
    if (!user) {
      console.log('No active session. Initiating Google sign-in...');
      // Dynamically import to avoid circular dependency
      const { signInWithGoogle } = await import('./authService');
      // This will redirect to Google - return immediately without awaiting
      signInWithGoogle();
      return {
        success: false,
        data: null,
        error: new Error('Signing in with Google...'),
        isRedirecting: true
      };
    }

  console.log('Syncing for user:', user.id);

  // Check cooldown after confirming authentication
  if (!isSyncAllowed()) {
    const remainingMs = getTimeUntilNextSync();
    const remainingSeconds = Math.ceil(remainingMs / 1000);
    return {
      success: false,
      data: null,
      error: new Error(`Already synced! Come back in ${remainingSeconds}s`),
      isCooldown: true
    };
  }

  try {
      // Calculate current score
      const strivenScore = await calculateStrivenScore();

      // Extract username from Google metadata (prefer full_name, then name)
      // Check both user_metadata (from Supabase session) and direct properties (from App context)
      const meta = user?.user_metadata || {};
      const derivedName = (meta.full_name && String(meta.full_name).trim())
        || (meta.name && String(meta.name).trim())
        || (user?.name && String(user.name).trim())
        || (user?.email ? String(user.email).split('@')[0] : '')
        || '';
      const username = derivedName || (user?.email ? user.email.split('@')[0] : 'athlete');
      console.log('Resolved username:', username, 'from metadata:', meta);

      // Prepare profile data - ONLY columns that exist in your profiles table
      // Schema: id, username, striven_score, last_sync
      const profileData = {
        id: user.id,
        username: username,
        striven_score: strivenScore,
        last_sync: new Date().toISOString()
      };

      console.log('Syncing to cloud:', profileData);

      // Upsert to Supabase profiles table
      const { data, error } = await supabase
        .from('profiles')
        .upsert(profileData, {
          onConflict: 'id' // Update if exists, insert if new
        })
        .select();

      if (error) {
        console.error('Supabase upsert error:', error);
        return {
          success: false,
          data: null,
          error
        };
      }

      // Set cooldown timer
      setSyncCooldown();

      console.log('Sync successful:', data);
      return {
        success: true,
        data: data || profileData,
        error: null
      };
    } catch (error) {
      console.error('Unexpected error during sync:', error);
      return {
        success: false,
        data: null,
        error
      };
    }
  } catch (error) {
    console.error('Error during sync process:', error);
    return {
      success: false,
      data: null,
      error
    };
  }
};

/**
 * Get remaining time until next sync is allowed
 * 
 * @returns {number} Milliseconds until next sync, or 0 if sync is allowed
 */
export const getTimeUntilNextSync = () => {
  try {
    const lastSyncTime = localStorage.getItem(SYNC_COOLDOWN_KEY);
    
    if (!lastSyncTime) {
      return 0; // Sync allowed now
    }

    const lastSync = parseInt(lastSyncTime, 10);
    const now = Date.now();
    const timeSinceLastSync = now - lastSync;
    const timeRemaining = SYNC_COOLDOWN_DURATION - timeSinceLastSync;

    return Math.max(0, timeRemaining);
  } catch (error) {
    console.error('Error getting time until next sync:', error);
    return 0;
  }
};

/**
 * Manually reset sync cooldown (for testing or forced sync)
 */
export const resetSyncCooldown = () => {
  try {
    localStorage.removeItem(SYNC_COOLDOWN_KEY);
    console.log('Sync cooldown reset');
  } catch (error) {
    console.error('Error resetting sync cooldown:', error);
  }
};

export default {
  calculateStrivenScore,
  syncToCloud,
  getTimeUntilNextSync,
  resetSyncCooldown
};
