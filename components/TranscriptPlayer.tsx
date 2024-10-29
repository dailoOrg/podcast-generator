import { useState, useRef } from 'react';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { sampleTranscript } from '@/data/transcripts/sample-conversation';

interface AudioFile {
  speakerId: string;
  path: string;
}

export default function TranscriptPlayer() {
  const [processing, setProcessing] = useState(false);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [audioFiles, setAudioFiles] = useState<AudioFile[]>([]);
  const audioRef = useRef<HTMLAudioElement>(null);

  const generateAndSaveAudio = async () => {
    setProcessing(true);
    const files: AudioFile[] = [];

    try {
      for (let i = 0; i < sampleTranscript.dialogue.length; i++) {
        console.log(`Processing dialogue line ${i + 1}`);
        
        const line = sampleTranscript.dialogue[i];
        const speaker = sampleTranscript.speakers.find(s => s.id === line.speakerId);
        
        console.log(`Generating speech for speaker: ${speaker?.name}`);
        
        // Generate speech
        const response = await fetch('/api/text-to-speech', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            text: line.text,
            voice: speaker?.voice
          }),
        });

        if (!response.ok) {
          console.error(`Speech generation failed with status: ${response.status}`);
          throw new Error(`Failed to generate speech for line ${i + 1}`);
        }

        // Get audio blob and create file
        const audioBlob = await response.blob();
        const fileName = `${sampleTranscript.id}_${speaker?.id}_${i}.mp3`;
        const audioFile = new File([audioBlob], fileName, { type: 'audio/mpeg' });

        console.log(`Saving audio file: ${fileName}`);

        // Save file
        const formData = new FormData();
        formData.append('file', audioFile);

        const saveResponse = await fetch('/api/save-audio', {
          method: 'POST',
          body: formData,
        });

        if (!saveResponse.ok) {
          console.error(`File save failed with status: ${saveResponse.status}`);
          const errorData = await saveResponse.json();
          console.error('Error details:', errorData);
          throw new Error(`Failed to save audio file ${fileName}`);
        }

        const { path } = await saveResponse.json();
        console.log(`File saved successfully with path: ${path}`);
        files.push({ speakerId: line.speakerId, path });
      }

      setAudioFiles(files);
    } catch (error) {
      console.error('Error processing audio:', error);
    } finally {
      setProcessing(false);
    }
  };

  const playSequence = () => {
    if (audioRef.current && currentIndex < audioFiles.length) {
      audioRef.current.src = audioFiles[currentIndex].path;
      audioRef.current.play();
      audioRef.current.onended = () => setCurrentIndex(prev => prev + 1);
    }
  };

  return (
    <Card className="w-full max-w-2xl">
      <CardHeader>
        <CardTitle>{sampleTranscript.title}</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <Button 
          onClick={generateAndSaveAudio}
          disabled={processing}
        >
          {processing ? 'Processing...' : 'Generate Audio'}
        </Button>

        {audioFiles.length > 0 && (
          <Button 
            onClick={playSequence}
            disabled={currentIndex >= audioFiles.length}
          >
            Play Conversation
          </Button>
        )}

        <div className="space-y-2">
          {sampleTranscript.dialogue.map((line, index) => {
            const speaker = sampleTranscript.speakers.find(s => s.id === line.speakerId);
            return (
              <div 
                key={index}
                className={`p-2 rounded ${
                  currentIndex === index ? 'bg-blue-100' : ''
                }`}
              >
                <span className="font-bold">{speaker?.name}: </span>
                {line.text}
              </div>
            );
          })}
        </div>
        <audio ref={audioRef} className="hidden" />
      </CardContent>
    </Card>
  );
} 