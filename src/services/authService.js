import { supabase } from '../lib/supabaseClient';
import { Capacitor } from '@capacitor/core';

/**
 * Authentication Service for Striven
 * Handles Google OAuth and session management
 */

/**
 * Sign in with Google OAuth
 * @param {string} redirectTo - Optional redirect URL after login
 * @returns {Promise<{data, error}>}
 */
export const signInWithGoogle = async (redirectTo = null) => {
  try {
    console.log('\n========================================');
    console.log('🔐 SIGN IN WITH GOOGLE - DEBUG START');
    console.log('========================================');
    
    // Check if running on native mobile platform
    const isNativePlatform = Capacitor.isNativePlatform();
    const platform = Capacitor.getPlatform();
    
    console.log('📱 Capacitor.getPlatform():', platform);
    console.log('📱 Capacitor.isNativePlatform():', isNativePlatform);
    console.log('🌐 window.Capacitor exists:', !!window.Capacitor);
    console.log('🌐 Current window.location.href:', window.location.href);
    console.log('🌐 Current window.location.origin:', window.location.origin);
    
    // Determine the best redirect URL for PWA compatibility
    // Use the current origin to ensure we return to the installed PWA
    const isPWA = window.matchMedia('(display-mode: standalone)').matches ||
                  window.navigator.standalone === true;
    
    console.log('📲 isPWA (display-mode check):', isPWA);
    
    // For native mobile apps, use custom scheme deep link
    // For PWAs/web, use the origin
    let finalRedirectTo;
    if (isNativePlatform) {
      finalRedirectTo = 'leaderboardapp://google-auth';
      console.log('✅ NATIVE PLATFORM DETECTED - Using deep link');
      console.log('📱 Platform:', platform);
      console.log('🔗 Deep Link URL:', finalRedirectTo);
    } else {
      finalRedirectTo = redirectTo || window.location.origin;
      console.log('⚠️ WEB PLATFORM DETECTED - Using web redirect');
      console.log('🌐 Platform:', platform);
      console.log('🔗 Web URL:', finalRedirectTo);
    }
    
    console.log('\n🎯 FINAL REDIRECT URL BEING SENT TO SUPABASE:');
    console.log('   ', finalRedirectTo);
    console.log('========================================\n');
    
    const { data, error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: finalRedirectTo,
        queryParams: {
          access_type: 'offline',
          prompt: 'consent',
        },
        scopes: 'email profile',
        // Skip the browser tab for PWAs if supported
        skipBrowserRedirect: false // Set to true if using custom in-app browser
      }
    });

    if (error) {
      console.error('Google sign-in error:', error);
      return { data: null, error };
    }

    return { data, error: null };
  } catch (error) {
    console.error('Unexpected error during Google sign-in:', error);
    return { data: null, error };
  }
};

/**
 * Sign out the current user
 * @returns {Promise<{error}>}
 */
export const signOut = async () => {
  try {
    const { error } = await supabase.auth.signOut();
    
    if (error) {
      console.error('Sign out error:', error);
      return { error };
    }

    // Clear local storage except for app data
    const authKeys = ['striven-auth-token'];
    authKeys.forEach(key => {
      Object.keys(localStorage).forEach(storageKey => {
        if (storageKey.includes(key)) {
          localStorage.removeItem(storageKey);
        }
      });
    });

    return { error: null };
  } catch (error) {
    console.error('Unexpected error during sign out:', error);
    return { error };
  }
};

/**
 * Get the current session
 * @returns {Promise<{session, error}>}
 */
export const getSession = async () => {
  try {
    const { data: { session }, error } = await supabase.auth.getSession();
    return { session, error };
  } catch (error) {
    console.error('Error getting session:', error);
    return { session: null, error };
  }
};

/**
 * Sign up with Email & Password
 * Uses emailRedirectTo set to the current origin so confirmation works in dev (localhost:5173) and prod (Netlify).
 * @param {string} email
 * @param {string} password
 * @param {string} redirectTo - optional override; defaults to window.location.origin
 * @returns {Promise<{data, error}>}
 */
export const signUpWithEmail = async (email, password, redirectTo = window.location.origin) => {
  try {
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        emailRedirectTo: redirectTo || window.location.origin,
      },
    });

    if (error) {
      console.error('Email sign-up error:', error);
      return { data: null, error };
    }

    return { data, error: null };
  } catch (error) {
    console.error('Unexpected error during email sign-up:', error);
    return { data: null, error };
  }
};

/**
 * Get the current user profile
 * @returns {Promise<{user, error}>}
 */
export const getUserProfile = async () => {
  try {
    const { data: { user }, error } = await supabase.auth.getUser();
    
    if (error || !user) {
      return { user: null, error };
    }

    // Return formatted user data
    return {
      user: {
        id: user.id,
        email: user.email,
        name: user.user_metadata?.full_name || user.user_metadata?.name,
        avatar: user.user_metadata?.avatar_url || user.user_metadata?.picture,
        provider: user.app_metadata?.provider,
        createdAt: user.created_at
      },
      error: null
    };
  } catch (error) {
    console.error('Error getting user profile:', error);
    return { user: null, error };
  }
};

/**
 * Subscribe to auth state changes
 * @param {Function} callback - Function to call when auth state changes
 * @returns {Object} - Subscription object with unsubscribe method
 */
export const onAuthStateChange = (callback) => {
  const { data: { subscription } } = supabase.auth.onAuthStateChange(
    async (event, session) => {
      console.log('Auth event:', event);
      
      // Get full user profile when signed in
      if (session?.user) {
        const { user } = await getUserProfile();
        callback(event, session, user);
      } else {
        callback(event, null, null);
      }
    }
  );

  return subscription;
};

/**
 * Handle PKCE callback from OAuth redirect
 * Checks if there's an auth code in the URL and exchanges it for a session
 * Call this once on app mount to finalize OAuth flow
 * @returns {Promise<{session, error}>}
 */
export const handleAuthCallback = async () => {
  try {
    // Check if there's a code in the URL that needs to be exchanged (PKCE flow)
    const params = new URLSearchParams(window.location.search);
    const code = params.get('code');
    
    if (code) {
      console.log('Found auth code in URL, exchanging for session...');
      // Explicitly exchange the code for a session
      const { data, error } = await supabase.auth.exchangeCodeForSession(code);
      
      if (error) {
        console.error('Error exchanging code for session:', error);
        return { session: null, error };
      }
      
      console.log('✓ PKCE code exchanged, session retrieved:', data.session?.user?.id);
      return { session: data.session, error: null };
    }
    
    // Check for hash-based tokens (implicit flow fallback)
    const hashParams = new URLSearchParams(window.location.hash.substring(1));
    if (hashParams.has('access_token')) {
      // Let Supabase handle the hash-based session
      const { data: { session }, error } = await supabase.auth.getSession();
      if (session) {
        console.log('✓ Hash-based session retrieved:', session.user?.id);
      }
      return { session, error };
    }
    
    // No auth callback params, just get existing session
    const { data: { session }, error } = await supabase.auth.getSession();
    return { session, error };
  } catch (error) {
    console.error('Unexpected error in auth callback:', error);
    return { session: null, error };
  }
};

/**
 * Refresh the current session
 * @returns {Promise<{session, error}>}
 */
export const refreshSession = async () => {
  try {
    const { data: { session }, error } = await supabase.auth.refreshSession();
    return { session, error };
  } catch (error) {
    console.error('Error refreshing session:', error);
    return { session: null, error };
  }
};
