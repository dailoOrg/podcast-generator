import { useState } from 'react';
import { Prompt } from '@/types/prompt';

export function usePrompt() {
  const [result, setResult] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const generateWithPrompt = async (
    promptConfig: Prompt,
    inputs: Record<string, string>
  ) => {
    setLoading(true);
    setError(null);

    try {
      const response = await fetch('/api/prompt', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: promptConfig.model,
          max_tokens: promptConfig.max_tokens,
          temperature: promptConfig.temperature,
          systemPrompt: promptConfig.systemPrompt,
          prompt: promptConfig.userPrompt(inputs),
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to generate response');
      }

      const data = await response.json();
      setResult(data.result);
      return data.result;
    } catch (err) {
      setError('Error generating response');
      throw err;
    } finally {
      setLoading(false);
    }
  };

  return {
    result,
    loading,
    error,
    generateWithPrompt,
  };
} 