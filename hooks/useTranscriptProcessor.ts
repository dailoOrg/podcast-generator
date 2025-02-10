import { useState } from 'react';
import { Transcript } from '../types/transcript';

export function useTranscriptProcessor() {
  const [processing, setProcessing] = useState(false);
  const [progress, setProgress] = useState(0);
  const [error, setError] = useState<string | null>(null);

  const processTranscript = async (transcript: Transcript) => {
    setProcessing(true);
    setProgress(0);
    setError(null);

    try {
      const totalLines = transcript.dialogue.length;
      
      for (let i = 0; i < transcript.dialogue.length; i++) {
        const line = transcript.dialogue[i];
        const speaker = transcript.speakers.find(s => s.id === line.speakerId);
        
        if (!speaker) continue;

        const response = await fetch('/api/text-to-speech', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            text: line.text,
            voice: speaker.voice,
          }),
        });

        if (!response.ok) throw new Error(`Failed to process line ${i + 1}`);

        // Store the audio file
        const audioBlob = await response.blob();
        const fileName = `${transcript.id}_${speaker.id}_${i}.mp3`;
        
        // You'll need to implement this API endpoint
        await uploadAudio(fileName, audioBlob);

        setProgress(((i + 1) / totalLines) * 100);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to process transcript');
    } finally {
      setProcessing(false);
    }
  };

  return { processing, progress, error, processTranscript };
}

async function uploadAudio(fileName: string, audioBlob: Blob) {
  const formData = new FormData();
  formData.append('file', audioBlob, fileName);
  
  const response = await fetch('/api/upload-audio', {
    method: 'POST',
    body: formData,
  });

  if (!response.ok) {
    throw new Error('Failed to upload audio file');
  }
} 