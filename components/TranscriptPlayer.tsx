import { useState, useRef, useCallback, useEffect } from 'react';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from "@/components/ui/select";
import { transcriptStorage } from '@/utils/transcriptStorage';
import type { Transcript } from '@/types/transcript';
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
  const [selectedTranscript, setSelectedTranscript] = useState<Transcript | null>(null);
  const audioRef = useRef<HTMLAudioElement>(null);
  const [transcripts, setTranscripts] = useState<Transcript[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadTranscripts = async () => {
      try {
        const response = await fetch('/api/transcripts');
        if (!response.ok) throw new Error('Failed to load transcripts');
        const data = await response.json();
        setTranscripts(data);
      } catch (error) {
        console.error('Error loading transcripts:', error);
      } finally {
        setLoading(false);
      }
    };

    loadTranscripts();
  }, []);

  const checkExistingFiles = async () => {
    const fileNames = selectedTranscript.dialogue.map((line, index) => {
      const speaker = selectedTranscript.speakers.find(s => s.id === line.speakerId);
      return `${selectedTranscript.id}_${speaker?.id}_${index}.mp3`;
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
      for (let i = 0; i < selectedTranscript.dialogue.length; i++) {
        const fileName = `${selectedTranscript.id}_${selectedTranscript.dialogue[i].speakerId}_${i}.mp3`;
        
        if (!missingFiles.includes(fileName)) {
          // File exists, just add it to the list
          files.push({
            speakerId: selectedTranscript.dialogue[i].speakerId,
            path: `/audio/${fileName}`
          });
          continue;
        }

        const line = selectedTranscript.dialogue[i];
        const speaker = selectedTranscript.speakers.find(s => s.id === line.speakerId);
        
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
          speakerId: selectedTranscript.dialogue[existingFiles.indexOf(file)].speakerId,
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
      const mergedFileName = `${selectedTranscript.id}_merged.wav`;
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

      // Create FormData and append the merged file
      const formData = new FormData();
      formData.append('file', new File([mergedBlob], mergedFileName, { type: 'audio/wav' }));
      formData.append('transcriptId', selectedTranscript.id);

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

  const handleTranscriptSelect = async (value: string) => {
    try {
      const response = await fetch(`/api/transcripts/${value}`);
      if (!response.ok) throw new Error('Failed to load transcript');
      const transcript = await response.json();
      setSelectedTranscript(transcript);
      // Reset states
      setCurrentIndex(0);
      setAudioFiles([]);
      setMergedAudioPath(null);
    } catch (error) {
      console.error('Error loading transcript:', error);
    }
  };

  return (
    <Card className="w-full max-w-2xl">
      <CardHeader>
        <CardTitle>Transcript Player</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {loading ? (
          <p>Loading transcripts...</p>
        ) : transcripts.length === 0 ? (
          <p className="text-gray-500">No transcripts available. Create one using the Transcript Formatter.</p>
        ) : (
          <Select
            value={selectedTranscript?.id}
            onValueChange={handleTranscriptSelect}
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
          <>
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
              {selectedTranscript.dialogue.map((line, index) => {
                const speaker = selectedTranscript.speakers.find(s => s.id === line.speakerId);
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
          </>
        )}
      </CardContent>
    </Card>
  );
} 