'use client';

import { useState } from 'react';
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { promptRegistry } from "@/prompts/registry";
import { usePromptWithTools } from '@/hooks/usePromptWithTools';
import { Transcript } from '@/types/transcript';
import { Switch } from "@/components/ui/switch";

export default function DirectTranscriptPage() {
  const [inputs, setInputs] = useState<Record<string, string>>({});
  const [showResult, setShowResult] = useState(false);
  const [apiError, setApiError] = useState<string | null>(null);
  const [thinking, setThinking] = useState<string | null>(null);
  const [showThinking, setShowThinking] = useState(false);
  const { generateWithPrompt, loading, error, result } = usePromptWithTools<Transcript>();
  const directPrompt = promptRegistry.directTranscript;

  const handleInputChange = (key: string, value: string) => {
    setInputs(prev => ({ ...prev, [key]: value }));
  };

  const handleGenerate = async () => {
    setApiError(null);
    setThinking(null);
    try {
      const response = await generateWithPrompt(directPrompt, inputs);
      setShowResult(true);
      
      // Check if the response includes thinking process
      if (response && typeof response === 'object' && 'thinking' in response) {
        setThinking(response.thinking);
      }
      
      // Check if the response is a string (error case) or a proper transcript
      if (typeof response === 'string') {
        setApiError("Claude returned text instead of a structured transcript. Please try again.");
      }
    } catch (err) {
      console.error("Failed to generate content:", err);
    }
  };

  const isFormValid = directPrompt.inputs.every(input => 
    !input.required || (inputs[input.key] && inputs[input.key].trim() !== '')
  );

  // Check if result is valid transcript format
  const isValidTranscript = result && 
    typeof result === 'object' && 
    'speakers' in result && 
    'dialogue' in result;

  return (
    <div className="container mx-auto py-8 max-w-4xl">
      <h1 className="text-3xl font-bold mb-8">Direct Transcript Generator</h1>

      <Card className="p-6">
        <div className="space-y-6">
          <div className="space-y-4">
            {directPrompt.inputs.map((input) => (
              <div key={input.key} className="space-y-2">
                <Label>{input.label}</Label>
                {input.type === 'textarea' ? (
                  <Textarea
                    placeholder={input.placeholder}
                    className="h-32"
                    value={inputs[input.key] || ''}
                    onChange={(e) => handleInputChange(input.key, e.target.value)}
                    disabled={loading}
                  />
                ) : (
                  <Input
                    placeholder={input.placeholder}
                    value={inputs[input.key] || ''}
                    onChange={(e) => handleInputChange(input.key, e.target.value)}
                    disabled={loading}
                  />
                )}
              </div>
            ))}
          </div>

          {/* Generated Result */}
          {showResult && result && (
            <div className="space-y-4">
              {thinking && (
                <div className="flex items-center space-x-2 mb-4">
                  <Switch 
                    id="show-thinking" 
                    checked={showThinking}
                    onCheckedChange={setShowThinking}
                  />
                  <Label htmlFor="show-thinking">Show Claude's reasoning process</Label>
                </div>
              )}
              
              {thinking && showThinking && (
                <div className="bg-blue-50 p-4 rounded-lg mb-4">
                  <h3 className="text-lg font-semibold mb-2 text-blue-800">Claude's Reasoning Process</h3>
                  <pre className="whitespace-pre-wrap text-sm text-blue-700 font-mono bg-blue-100 p-3 rounded">
                    {thinking}
                  </pre>
                </div>
              )}
              
              <div className="bg-gray-50 p-4 rounded-lg">
                <h3 className="text-lg font-semibold mb-4">Generated Transcript</h3>
                
                {isValidTranscript ? (
                  <div className="space-y-4">
                    <div className="bg-white p-4 rounded border overflow-auto max-h-96">
                      <pre className="whitespace-pre-wrap text-sm">
                        {JSON.stringify(result, null, 2)}
                      </pre>
                    </div>
                    <div className="flex justify-end space-x-2">
                      <Button 
                        variant="outline" 
                        onClick={() => setShowResult(false)}
                        disabled={loading}
                      >
                        New Generation
                      </Button>
                      <Button 
                        onClick={() => {
                          // Copy to clipboard
                          navigator.clipboard.writeText(JSON.stringify(result));
                        }}
                      >
                        Copy to Clipboard
                      </Button>
                    </div>
                  </div>
                ) : (
                  <div className="bg-white p-4 rounded border">
                    <p className="text-red-500 mb-4">Received an invalid response format instead of a transcript:</p>
                    <pre className="whitespace-pre-wrap text-sm bg-gray-100 p-3 rounded">
                      {typeof result === 'string' ? result : JSON.stringify(result, null, 2)}
                    </pre>
                    <div className="mt-4">
                      <Button 
                        variant="outline" 
                        onClick={() => setShowResult(false)}
                      >
                        Try Again
                      </Button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          {(error || apiError) && (
            <div className="text-red-500 text-sm p-3 bg-red-50 rounded-md">
              {error || apiError || 'Failed to generate content. Please try again.'}
            </div>
          )}

          {/* Generate Button */}
          {!showResult && (
            <div className="flex justify-end mt-8">
              <Button 
                onClick={handleGenerate} 
                disabled={loading || !isFormValid}
              >
                {loading ? 'Generating...' : 'Generate Transcript'}
              </Button>
            </div>
          )}
        </div>
      </Card>
    </div>
  );
} 