'use client';
import { useState, useRef } from 'react';
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Label } from "@/components/ui/label"

export default function OneLinerPage() {
  const [sentence, setSentence] = useState('');
  const [loading, setLoading] = useState(false);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  const generateSpeech = async () => {
    if (!sentence.trim()) return;

    setLoading(true);
    try {
      const response = await fetch('/api/text-to-speech', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ text: sentence }),
      });

      if (!response.ok) throw new Error('Failed to generate speech');

      const audioBlob = await response.blob();
      const audioUrl = URL.createObjectURL(audioBlob);
      
      if (audioRef.current) {
        audioRef.current.src = audioUrl;
        audioRef.current.play();
      }
    } catch (error) {
      console.error('Error generating speech:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="flex min-h-screen flex-col items-center justify-center p-24">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle className="text-2xl font-semibold text-center">
            Text to Speech Converter
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="sentence">Enter a sentence</Label>
            <Input
              id="sentence"
              value={sentence}
              onChange={(e) => setSentence(e.target.value)}
              placeholder="Type your sentence here..."
              className="w-full"
            />
          </div>
          <Button 
            onClick={generateSpeech}
            className="w-full"
            disabled={loading || !sentence.trim()}
          >
            {loading ? 'Generating Audio...' : 'Generate Speech'}
          </Button>
          <audio ref={audioRef} className="hidden" />
        </CardContent>
      </Card>
    </main>
  );
} 