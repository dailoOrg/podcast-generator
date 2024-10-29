import { useState } from 'react';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { useTranscriptProcessor } from '@/hooks/useTranscriptProcessor';
import type { Transcript } from '@/types/transcript';

export default function TranscriptProcessor() {
  const [transcript, setTranscript] = useState<Transcript | null>(null);
  const { processing, progress, error, processTranscript } = useTranscriptProcessor();

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const content = JSON.parse(e.target?.result as string);
        setTranscript(content);
      } catch (err) {
        console.error('Failed to parse transcript file:', err);
      }
    };
    reader.readAsText(file);
  };

  return (
    <Card className="w-full max-w-2xl">
      <CardHeader>
        <CardTitle>Transcript Processor</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <input
          type="file"
          accept=".json"
          onChange={handleFileUpload}
          disabled={processing}
        />
        
        {transcript && (
          <div className="space-y-4">
            <h3 className="font-semibold">{transcript.title}</h3>
            <Button
              onClick={() => processTranscript(transcript)}
              disabled={processing}
            >
              {processing ? 'Processing...' : 'Process Transcript'}
            </Button>
            
            {processing && (
              <Progress value={progress} className="w-full" />
            )}
          </div>
        )}

        {error && (
          <p className="text-red-500">{error}</p>
        )}
      </CardContent>
    </Card>
  );
} 