import { supabase } from '../lib/supabaseClient';
import { getActivities, getFoodLogs, getTodayWorkout } from '../utils/db';

const SYNC_COOLDOWN_KEY = 'striven-sync-cooldown';
const SYNC_COOLDOWN_DURATION = 0; // Instant sync (disabled cooldown)

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
      
      // Save current page so we can restore it after OAuth redirect
      try {
        const currentPage = localStorage.getItem('striven_last_page') || 'leaderboards';
        localStorage.setItem('striven_pending_page', currentPage);
        console.log('📌 Saved pending page:', currentPage);
      } catch (e) {
        console.warn('Could not save pending page:', e);
      }
      
      // Dynamically import to avoid circular dependency
      const { signInWithGoogle } = await import('./authService');
      // This will redirect to Google - return immediately without awaiting
      await signInWithGoogle(); // Added await to ensure redirect starts before returning
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

      // Check if profile exists first to preserve username
      const { data: existingProfile } = await supabase
        .from('profiles')
        .select('username')
        .eq('id', user.id)
        .single();

      let username;
      
      if (existingProfile?.username) {
        // Keep existing username
        username = existingProfile.username;
      } else {
        // Generate new unique username
        const meta = user?.user_metadata || {};
        const baseName = (meta.full_name && String(meta.full_name).trim())
          || (meta.name && String(meta.name).trim())
          || (user?.name && String(user.name).trim())
          || (user?.email ? String(user.email).split('@')[0] : 'athlete');
        
        // Clean the name
        const cleanName = baseName.replace(/[^a-zA-Z0-9]/g, '').substring(0, 15);
        // Append random digits to ensure uniqueness
        username = `${cleanName}${Math.floor(1000 + Math.random() * 9000)}`;
      }

      // Prepare profile data
      // NOTE: Do NOT include 'email' - it may not exist in the profiles table schema
      // Only include columns that are confirmed to exist in your Supabase table
      const profileData = {
        id: user.id,
        username: username,
        striven_score: strivenScore,
        last_sync: new Date().toISOString()
      };

      console.log('📤 Syncing to cloud:', profileData);

      // Upsert to Supabase profiles table with robust error handling
      const { data, error } = await supabase
        .from('profiles')
        .upsert(profileData, {
          onConflict: 'id',
          ignoreDuplicates: false // We want to update existing records
        })
        .select();

      if (error) {
        console.error('❌ Supabase upsert error:', error);
        
        // Handle specific error codes
        if (error.code === '42501') {
          console.error('RLS Policy Error: Please ensure you have INSERT/UPDATE policies on the profiles table.');
          console.error('Run this SQL in Supabase:\n');
          console.error(`
CREATE POLICY "Self Insert" ON profiles FOR INSERT WITH CHECK (auth.uid() = id);
CREATE POLICY "Self Update" ON profiles FOR UPDATE USING (auth.uid() = id);
CREATE POLICY "Public Read" ON profiles FOR SELECT USING (true);
          `);
        } else if (error.code === 'PGRST204' || error.message?.includes('schema cache')) {
          console.error('Schema Cache Error: A column in your query does not exist.');
          console.error('Check that your profiles table has: id, username, striven_score, last_sync');
        } else if (error.code === '23505') {
          // Duplicate key - try update instead
          console.log('Profile exists, attempting direct update...');
          const { data: updateData, error: updateError } = await supabase
            .from('profiles')
            .update({ striven_score: strivenScore, last_sync: new Date().toISOString() })
            .eq('id', user.id)
            .select();
          
          if (!updateError) {
            setSyncCooldown();
            return { success: true, data: updateData, error: null };
          }
        }
        
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
