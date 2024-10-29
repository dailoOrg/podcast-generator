import { useState, useRef, useCallback } from 'react';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { sampleTranscript } from '@/data/transcripts/sample-conversation';
import { mergeAudioFiles } from '@/utils/audioMerger';

interface AudioFile {
  speakerId: string;
  path: string;
}

interface AudioFileCheck {
  fileName: string;
  exists: boolean;
  path: string;
}

export default function TranscriptPlayer() {
  const [processing, setProcessing] = useState(false);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [audioFiles, setAudioFiles] = useState<AudioFile[]>([]);
  const [mergedAudioPath, setMergedAudioPath] = useState<string | null>(null);
  const [merging, setMerging] = useState(false);
  const audioRef = useRef<HTMLAudioElement>(null);

  const checkExistingFiles = async () => {
    const fileNames = sampleTranscript.dialogue.map((line, index) => {
      const speaker = sampleTranscript.speakers.find(s => s.id === line.speakerId);
      return `${sampleTranscript.id}_${speaker?.id}_${index}.mp3`;
    });

    const response = await fetch('/api/check-audio', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ fileNames }),
    });

    if (!response.ok) {
      throw new Error('Failed to check existing files');
    }

    const { files } = await response.json();
    return files as AudioFileCheck[];
  };

  const generateAndSaveAudio = async (missingFiles: string[]) => {
    setProcessing(true);
    const files: AudioFile[] = [];

    try {
      for (let i = 0; i < sampleTranscript.dialogue.length; i++) {
        const fileName = `${sampleTranscript.id}_${sampleTranscript.dialogue[i].speakerId}_${i}.mp3`;
        
        if (!missingFiles.includes(fileName)) {
          // File exists, just add it to the list
          files.push({
            speakerId: sampleTranscript.dialogue[i].speakerId,
            path: `/audio/${fileName}`
          });
          continue;
        }

        const line = sampleTranscript.dialogue[i];
        const speaker = sampleTranscript.speakers.find(s => s.id === line.speakerId);
        
        // Generate speech for missing file
        const response = await fetch('/api/text-to-speech', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            text: line.text,
            voice: speaker?.voice
          }),
        });

        if (!response.ok) {
          throw new Error(`Failed to generate speech for line ${i + 1}`);
        }

        const audioBlob = await response.blob();
        const audioFile = new File([audioBlob], fileName, { type: 'audio/mpeg' });

        // Save file
        const formData = new FormData();
        formData.append('file', audioFile);

        const saveResponse = await fetch('/api/save-audio', {
          method: 'POST',
          body: formData,
        });

        if (!saveResponse.ok) {
          throw new Error(`Failed to save audio file ${fileName}`);
        }

        const { path } = await saveResponse.json();
        files.push({ speakerId: line.speakerId, path });
      }

      setAudioFiles(files);
    } catch (error) {
      console.error('Error processing audio:', error);
    } finally {
      setProcessing(false);
    }
  };

  const initializeAudio = async () => {
    try {
      setProcessing(true);
      const existingFiles = await checkExistingFiles();
      
      const missingFiles = existingFiles
        .filter(file => !file.exists)
        .map(file => file.fileName);

      if (missingFiles.length > 0) {
        await generateAndSaveAudio(missingFiles);
      } else {
        // All files exist, just set the paths
        const files = existingFiles.map(file => ({
          speakerId: sampleTranscript.dialogue[existingFiles.indexOf(file)].speakerId,
          path: file.path
        }));
        setAudioFiles(files);
      }
    } catch (error) {
      console.error('Error initializing audio:', error);
    } finally {
      setProcessing(false);
    }
  };

  const playSequence = useCallback(() => {
    if (audioRef.current && currentIndex < audioFiles.length) {
      audioRef.current.src = audioFiles[currentIndex].path;
      audioRef.current.play();
      audioRef.current.onended = () => setCurrentIndex(prev => prev + 1);
    }
  }, [audioFiles, currentIndex]);

  const handleMergeAudio = async () => {
    if (audioFiles.length === 0) return;
    
    setMerging(true);
    try {
      // Check if merged file already exists
      const mergedFileName = `${sampleTranscript.id}_merged.wav`;
      const response = await fetch('/api/check-audio', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ fileNames: [mergedFileName] }),
      });

      const { files } = await response.json();
      
      if (files[0].exists) {
        setMergedAudioPath(files[0].path);
        return;
      }

      // Merge audio files
      const audioUrls = audioFiles.map(file => file.path);
      const mergedBlob = await mergeAudioFiles(audioUrls);

      // Save merged file
      const formData = new FormData();
      formData.append('file', new File([mergedBlob], mergedFileName, { type: 'audio/wav' }));
      formData.append('transcriptId', sampleTranscript.id);

      const saveResponse = await fetch('/api/save-merged-audio', {
        method: 'POST',
        body: formData,
      });

      if (!saveResponse.ok) {
        throw new Error('Failed to save merged audio');
      }

      const { path } = await saveResponse.json();
      setMergedAudioPath(path);
    } catch (error) {
      console.error('Error merging audio files:', error);
    } finally {
      setMerging(false);
    }
  };

  const playMergedAudio = () => {
    if (audioRef.current && mergedAudioPath) {
      audioRef.current.src = mergedAudioPath;
      audioRef.current.play();
    }
  };

  return (
    <Card className="w-full max-w-2xl">
      <CardHeader>
        <CardTitle>{sampleTranscript.title}</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <Button 
          onClick={initializeAudio}
          disabled={processing}
        >
          {processing ? 'Processing...' : 'Initialize Audio'}
        </Button>

        {audioFiles.length > 0 && (
          <div className="space-y-2">
            <Button 
              onClick={playSequence}
              disabled={currentIndex >= audioFiles.length}
            >
              Play Sequence
            </Button>

            <Button
              onClick={handleMergeAudio}
              disabled={merging}
              className="ml-2"
            >
              {merging ? 'Merging...' : 'Merge Audio'}
            </Button>

            {mergedAudioPath && (
              <Button
                onClick={playMergedAudio}
                className="ml-2"
              >
                Play Merged Audio
              </Button>
            )}
          </div>
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