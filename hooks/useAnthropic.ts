import { useState } from 'react';
import Anthropic from '@anthropic-ai/sdk';

export function useAnthropic<T>() {
  const [result, setResult] = useState<T | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const generateResponse = async (prompt: string) => {
    setLoading(true);
    setError(null);

    try {
      const response = await fetch('/api/anthropic', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ prompt }),
      });

      if (!response.ok) {
        throw new Error('Failed to generate response');
      }

      const data = await response.json();
      setResult(data.result);
    } catch (err) {
      setError('Error generating response');
    } finally {
      setLoading(false);
    }
  };

  return { result, loading, error, generateResponse };
} 