import { useState, useCallback } from 'react';
import { getBackendUrl } from '../apiConfig';

/**
 * Client-side safe: This component contains no secrets.
 * API calls are proxied through Netlify Functions.
 */
const useAiTips = () => {
  const [loading, setLoading] = useState(false);
  const [tips, setTips] = useState('');
  const [error, setError] = useState('');

  const generateTips = useCallback(async (payload) => {
    setLoading(true);
    setError('');
    
    try {
      // Call the secure Netlify function
      const baseUrl = getBackendUrl();
      const resp = await fetch(`${baseUrl}/.netlify/functions/get-personalized-tips`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      if (!resp.ok) {
        const errData = await resp.json().catch(() => ({}));
        console.error("AI Service Error:", errData);
        throw new Error(errData.error || 'AI service unavailable');
      }

      const data = await resp.json();
      const cleanTips = (data.text || '').trim();
      
      setTips(cleanTips);
      return cleanTips;

    } catch (err) {
      console.error(err);
      setError('Could not load AI tips.');
      setTips('');
      return null;
    } finally {
      setLoading(false);
    }
  }, []);

  return { generateTips, loading, tips, setTips, error };
};

export default useAiTips;
