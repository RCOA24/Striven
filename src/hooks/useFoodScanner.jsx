import { useState, useCallback } from 'react';

const useFoodScanner = () => {
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState(null);

  const scanFood = useCallback(async (base64Image) => {
    setLoading(true);
    setError(null);
    setResult(null);

    try {
      // Call the secure Netlify function
      const response = await fetch('/.netlify/functions/analyze-food', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ image: base64Image }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || `API Error: ${response.status}`);
      }

      const data = await response.json();
      
      // The Netlify function returns the parsed JSON directly in the body, or a text field?
      // Let's check analyze-food.js again. It returns { result: parsedJson } or similar?
      // Wait, I need to be sure about the response format of analyze-food.js.
      // Let me check analyze-food.js content again.
      
      // Assuming it returns the parsed JSON directly or in a property.
      // I'll check the file content in the next step before committing this change.
      // But for now, I'll assume it returns the JSON object directly as the body.
      
      setResult(data);

      return parsedResult;

    } catch (err) {
      console.error("Food Scanner Error:", err);
      setError(err.message);
      return null;
    } finally {
      setLoading(false);
    }
  }, []);

  return { scanFood, loading, result, error };
};

export default useFoodScanner;
