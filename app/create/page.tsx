"use client";

import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useState } from "react";
import { usePrompt } from "@/hooks/usePrompt";
import { promptRegistry } from "@/prompts/registry";
import { PromptInput } from "@/types/prompt";

export default function PromptGenerator() {
  const [selectedPrompt, setSelectedPrompt] = useState<string | null>(null);
  const [inputs, setInputs] = useState<Record<string, string>>({});
  const [showResult, setShowResult] = useState(false);
  const { generateWithPrompt, loading, error, result } = usePrompt();

  const handlePromptSelect = (promptId: string) => {
    setSelectedPrompt(promptId);
    setInputs({});
    setShowResult(false);
  };

  const handleInputChange = (key: string, value: string) => {
    setInputs(prev => ({ ...prev, [key]: value }));
  };

  const handleGenerate = async () => {
    if (!selectedPrompt) return;
    
    try {
      await generateWithPrompt(promptRegistry[selectedPrompt], inputs);
      setShowResult(true);
    } catch (err) {
      console.error("Failed to generate content:", err);
    }
  };

  const handleRegenerate = async () => {
    setShowResult(false);
    await handleGenerate();
  };

  const currentPrompt = selectedPrompt ? promptRegistry[selectedPrompt] : null;
  const isFormValid = currentPrompt?.inputs.every(input => 
    !input.required || (inputs[input.key] && inputs[input.key].trim() !== '')
  ) ?? false;

  return (
    <div className="container mx-auto py-8 max-w-4xl">
      <h1 className="text-3xl font-bold mb-8">AI Content Generator</h1>

      <Card className="p-6">
        <div className="space-y-6">
          {/* Prompt Selection */}
          <div className="space-y-2">
            <Label>Prompt Type</Label>
            <Select onValueChange={handlePromptSelect} value={selectedPrompt || undefined}>
              <SelectTrigger>
                <SelectValue placeholder="Select a prompt type" />
              </SelectTrigger>
              <SelectContent>
                {Object.entries(promptRegistry).map(([id, prompt]) => (
                  <SelectItem key={id} value={id}>
                    {prompt.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {currentPrompt && (
              <p className="text-sm text-gray-600 mt-1">{currentPrompt.description}</p>
            )}
          </div>

          {/* Dynamic Inputs based on selected prompt */}
          {currentPrompt && (
            <div className="space-y-4">
              {currentPrompt.inputs.map((input: PromptInput) => (
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
          )}

          {/* Generated Result */}
          {showResult && result && (
            <div className="space-y-4">
              <div className="bg-gray-50 p-4 rounded-lg">
                <h3 className="text-lg font-semibold mb-4">Generated Content</h3>
                <div className="space-y-4">
                  <div className="bg-white p-4 rounded border whitespace-pre-wrap">
                    {result}
                  </div>
                  <div className="flex justify-end">
                    <Button 
                      variant="outline" 
                      className="mr-2" 
                      onClick={handleRegenerate}
                      disabled={loading}
                    >
                      Regenerate
                    </Button>
                    <Button>Download</Button>
                  </div>
                </div>
              </div>
            </div>
          )}

          {error && (
            <div className="text-red-500 text-sm">
              Failed to generate content. Please try again.
            </div>
          )}

          {/* Generate Button */}
          {!showResult && selectedPrompt && (
            <div className="flex justify-end mt-8">
              <Button 
                onClick={handleGenerate} 
                disabled={loading || !isFormValid}
              >
                {loading ? 'Generating...' : 'Generate Content'}
              </Button>
            </div>
          )}
        </div>
      </Card>
    </div>
  );
} 