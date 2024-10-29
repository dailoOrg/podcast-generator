import { useState } from 'react';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { useTranscriptProcessor } from '@/hooks/useTranscriptProcessor';
import type { Transcript } from '@/types/transcript';
import { Select, SelectTrigger, SelectValue, SelectItem } from "@/components/ui/select";
import { transcriptStorage } from '@/utils/transcriptStorage';

export default function TranscriptProcessor() {
  const [selectedTranscript, setSelectedTranscript] = useState<Transcript | null>(null);
  const { processing, progress, error, processTranscript } = useTranscriptProcessor();
  const transcripts = transcriptStorage.getTranscripts();

  return (
    <Card className="w-full max-w-2xl">
      <CardHeader>
        <CardTitle>Transcript Processor</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {transcripts.length === 0 ? (
          <p className="text-gray-500">No transcripts available. Create one using the Transcript Formatter.</p>
        ) : (
          <Select
            value={selectedTranscript?.id}
            onValueChange={(value) => {
              const transcript = transcriptStorage.getTranscript(value);
              setSelectedTranscript(transcript);
            }}
          >
            <SelectTrigger>
              <SelectValue placeholder="Select a transcript" />
            </SelectTrigger>
            <SelectContent>
              {transcripts.map((t) => (
                <SelectItem key={t.id} value={t.id}>
                  {t.title}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        )}
        
        {selectedTranscript && (
          <div className="space-y-4">
            <h3 className="font-semibold">{selectedTranscript.title}</h3>
            <Button
              onClick={() => processTranscript(selectedTranscript)}
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