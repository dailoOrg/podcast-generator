import { useState } from 'react';
import { Prompt } from '@/types/prompt';

export function usePromptWithTools<T>() {
  const [result, setResult] = useState<T | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const generateWithPrompt = async (prompt: Prompt, inputs: Record<string, string>) => {
    setLoading(true);
    setError(null);

    try {
      const userPrompt = prompt.userPrompt(inputs);
      
      console.log("Sending request with tools:", prompt.tools?.length);
      
      const response = await fetch('/api/prompt-with-tools', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: prompt.model,
          max_tokens: prompt.max_tokens,
          temperature: prompt.temperature,
          prompt: userPrompt,
          systemPrompt: prompt.systemPrompt,
          tools: prompt.tools,
          thinking: prompt.thinking,
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to generate response');
      }

      const data = await response.json();
      
      // Check if there was an error from the API
      if (data.error) {
        setError(data.error);
        if (data.result) {
          // If we have a result even with an error, still show it
          setResult(data.result as T);
          
          // Include thinking process if available
          if (data.thinking) {
            return {
              ...data.result,
              thinking: data.thinking
            };
          }
          
          return data.result;
        }
        throw new Error(data.error);
      }
      
      setResult(data.result as T);
      
      // If there's thinking data, add it to the result
      if (data.thinking) {
        return {
          ...data.result,
          thinking: data.thinking
        };
      }
      
      return data.result;
    } catch (err: any) {
      const message = err.message || 'Error generating response';
      setError(message);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  return { result, loading, error, generateWithPrompt };
} 