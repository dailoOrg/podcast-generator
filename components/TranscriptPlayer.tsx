import { useState, useRef, useCallback, useEffect } from 'react';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem, SelectGroup, SelectLabel, SelectSeparator } from "@/components/ui/select";
import { transcriptStorage } from '@/utils/transcriptStorage';
import type { Transcript, DialogueLine } from '@/types/transcript';
import { mergeAudioFiles } from '@/utils/audioMerger';
import { shouldLowerVolume, lowVolumeExpressions } from '@/utils/dialogueUtils';
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip"
import { X } from "lucide-react";
import { ALL_VOICES, OPENAI_VOICES, ELEVENLABS_VOICES, type VoiceConfig } from '@/config/voices';

interface AudioFile {
  speakerId: string;
  path: string;
}

interface AudioFileCheck {
  fileName: string;
  exists: boolean;
  path: string;
}

interface ExcludedLine {
  id: string;
  text: string;
}

interface ExtraLoweredLine {
  id: string;
  text: string;
}

interface TTSModel {
  id: string;
  name: string;
  provider: 'openai' | 'elevenlabs';
  gender: 'male' | 'female' | 'neutral';
}

interface SpeakerTTSSelection {
  speakerId: string;
  modelId: string;
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
  const [smartVolumeEnabled, setSmartVolumeEnabled] = useState(false);
  const [isInitialized, setIsInitialized] = useState(false);
  const [excludedLines, setExcludedLines] = useState<ExcludedLine[]>([]);
  const [extraLoweredLines, setExtraLoweredLines] = useState<ExtraLoweredLine[]>([]);
  const [lastRemovedLineId, setLastRemovedLineId] = useState<string | null>(null);
  const [tooltipOpen, setTooltipOpen] = useState(false);
  const [speakerTTSSelections, setSpeakerTTSSelections] = useState<SpeakerTTSSelection[]>([]);

  const availableTTSModels = ALL_VOICES;

  useEffect(() => {
    const loadTranscripts = async () => {
      try {
        const response = await fetch('/api/transcripts');
        if (!response.ok) throw new Error('Failed to load transcripts');
        const data = await response.json();
        console.log('Available transcripts:', data);
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
    if (!selectedTranscript) return [];

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
    if (!selectedTranscript) return;

    setProcessing(true);
    const files: AudioFile[] = [];

    try {
      for (let i = 0; i < selectedTranscript.dialogue.length; i++) {
        const line = selectedTranscript.dialogue[i];
        const speaker = selectedTranscript.speakers.find(s => s.id === line.speakerId);
        const fileName = `${selectedTranscript.id}_${speaker?.id}_${i}.mp3`;

        if (!missingFiles.includes(fileName)) {
          files.push({
            speakerId: line.speakerId,
            path: `/audio/${fileName}`
          });
          continue;
        }

        // Get the selected TTS model for this speaker
        const speakerTTSModel = speakerTTSSelections.find(
          sel => sel.speakerId === line.speakerId
        );
        const selectedModel = availableTTSModels.find(
          model => model.id === speakerTTSModel?.modelId
        );

        // Generate speech with the selected model
        const response = await fetch('/api/text-to-speech', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            text: line.text,
            voiceId: selectedModel?.id || 'alloy',
            provider: selectedModel?.provider || 'openai'
          }),
        });

        if (!response.ok) {
          throw new Error(`Failed to generate speech for line ${i + 1}`);
        }

        const audioBlob = await response.blob();
        const formData = new FormData();
        formData.append('audio', audioBlob, fileName);
        formData.append('transcriptId', selectedTranscript.id);

        const saveResponse = await fetch('/api/save-audio', {
          method: 'POST',
          body: formData
        });

        if (!saveResponse.ok) {
          const errorText = await saveResponse.text();
          throw new Error(`Failed to save audio file ${fileName}: ${errorText}`);
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


  const handleTranscriptSelect = async (value: string) => {
    try {
      const response = await fetch(`/api/transcripts/${value}`);
      if (!response.ok) throw new Error('Failed to load transcript');
      const transcript = await response.json();

      // Add unique IDs to dialogue lines if they don't exist
      const transcriptWithIds = {
        ...transcript,
        dialogue: transcript.dialogue.map((line: DialogueLine, index: number) => ({
          ...line,
          id: line.id || `${transcript.id}_line_${index}`
        }))
      };

      setSelectedTranscript(transcriptWithIds);
      // Reset all states
      setCurrentIndex(0);
      setAudioFiles([]);
      setMergedAudioPath(null);
      setIsInitialized(false); // Reset initialization state
      setSmartVolumeEnabled(false); // Optionally reset smart volume too
      setLastRemovedLineId(null); // Reset last removed line
      setExcludedLines([]); // Reset excluded lines
      setExtraLoweredLines([]); // Reset extra lowered lines
      setSpeakerTTSSelections([]); // Reset TTS selections
    } catch (error) {
      console.error('Error loading transcript:', error);
    }
  };

  const initializeAudio = async () => {
    if (!selectedTranscript) return;

    try {
      console.log('Initializing audio for transcript:', selectedTranscript.id);
      setProcessing(true);
      // Reset only audio-related states when reinitializing
      setAudioFiles([]);
      setMergedAudioPath(null);
      setCurrentIndex(0);

      const existingFiles = await checkExistingFiles();
      console.log('Existing audio files:', existingFiles);
      const missingFiles = existingFiles
        .filter(f => !f.exists)
        .map(f => f.fileName);
      await generateAndSaveAudio(missingFiles);
      setIsInitialized(true);
    } catch (error) {
      console.error('Error processing audio:', error);
    } finally {
      setProcessing(false);
    }
  };

  const isLineLowVolume = (lineText: string, lineId: string) => {
    const isLineAutomaticallyLowered = shouldLowerVolume(lineText);
    const isLineExcluded = excludedLines.some(line => line.id === lineId);
    const isLineExtraLowered = extraLoweredLines.some(line => line.id === lineId);

    return smartVolumeEnabled &&
      ((isLineAutomaticallyLowered && !isLineExcluded) || isLineExtraLowered);
  };

  const playSequence = useCallback(() => {
    if (audioRef.current && currentIndex < audioFiles.length) {
      audioRef.current.src = audioFiles[currentIndex].path;

      const currentLine = selectedTranscript?.dialogue[currentIndex];
      if (currentLine && isLineLowVolume(currentLine.text, currentLine.id)) {
        audioRef.current.volume = 0.65;
      } else {
        audioRef.current.volume = 1.0;
      }

      audioRef.current.play();
      audioRef.current.onended = () => setCurrentIndex(prev => prev + 1);
    }
  }, [audioFiles, currentIndex, selectedTranscript, smartVolumeEnabled, excludedLines, extraLoweredLines]);

  const handleMergeAudio = async () => {
    if (!selectedTranscript || audioFiles.length === 0) return;

    setMerging(true);
    try {
      const audioUrls = audioFiles.map(file => file.path);
      const mergedBlob = await mergeAudioFiles(
        audioUrls,
        selectedTranscript.dialogue,
        smartVolumeEnabled // Pass the flag to mergeAudioFiles
      );

      // Create FormData and append the merged file
      const formData = new FormData();
      formData.append('file', new File([mergedBlob], `${selectedTranscript.id}_merged.wav`, { type: 'audio/wav' }));
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

  const handleExcludeLine = (id: string, text: string) => {
    setExcludedLines(prev => [...prev, { id, text }]);
    setLastRemovedLineId(id);
    if (isInitialized) {
      initializeAudio();
    }
  };

  const handleAddLoweredLine = (id: string, text: string) => {
    // Remove from excluded lines when adding back
    setExcludedLines(prev => prev.filter((line: ExcludedLine) => line.id !== id));
    setExtraLoweredLines(prev => [...prev, { id, text }]);
    setLastRemovedLineId(null);
    if (isInitialized) {
      initializeAudio();
    }
  };

  const handleTTSModelChange = (speakerId: string, modelId: string) => {
    setSpeakerTTSSelections(prev => {
      const filtered = prev.filter(sel => sel.speakerId !== speakerId);
      return [...filtered, { speakerId, modelId }];
    });
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
            <div className="flex flex-col gap-4">
              <div className="flex items-center gap-4">
                <Button
                  onClick={initializeAudio}
                  disabled={processing}
                >
                  {processing ? 'Processing...' : isInitialized ? 'Restart Audio' : 'Initialize Audio'}
                </Button>

                <div className="flex items-center space-x-2">
                  <Switch
                    id="smart-volume"
                    checked={smartVolumeEnabled}
                    onCheckedChange={(checked) => {
                      setSmartVolumeEnabled(checked);
                      if (isInitialized) {
                        // Automatically reinitialize when toggling after initialization
                        initializeAudio();
                      }
                    }}
                  />
                  <Label htmlFor="smart-volume" className="flex items-center gap-2">
                    Smart Volume Control
                    <Tooltip open={tooltipOpen} onOpenChange={setTooltipOpen}>
                      <TooltipTrigger
                        className="text-xs text-blue-500 hover:underline cursor-pointer ml-2"
                        onClick={() => setTooltipOpen(true)}
                      >
                        (more info)
                      </TooltipTrigger>
                      <TooltipContent className="w-80 p-3">
                        <p className="mb-2">Automatically lowers volume for:</p>
                        <ul className="list-disc pl-4 space-y-1 text-sm">
                          <li>Short reactions (1-2 words)</li>
                          <li>Common acknowledgments</li>
                          <li>Current expressions detected:</li>
                        </ul>
                        <div className="mt-2 flex flex-wrap gap-1">
                          {lowVolumeExpressions.map((expr) => (
                            <span key={expr} className="text-xs bg-gray-100 px-2 py-1 rounded">
                              {expr}
                            </span>
                          ))}
                        </div>
                        <p className="mt-2 text-xs text-gray-500">
                          Edit these in dialogueUtils.ts
                        </p>
                      </TooltipContent>
                    </Tooltip>
                  </Label>
                </div>
              </div>

              <div className="space-y-3 border rounded-lg p-4">
                <h3 className="font-medium">Speaker Voice Settings</h3>
                <div className="space-y-2">
                  {selectedTranscript.speakers.map(speaker => {
                    const currentSelection = speakerTTSSelections.find(
                      sel => sel.speakerId === speaker.id
                    )?.modelId || 'alloy';

                    return (
                      <div key={speaker.id} className="flex items-center gap-2">
                        <span className="w-24">{speaker.name}:</span>
                        <Select
                          value={currentSelection}
                          onValueChange={(value) => handleTTSModelChange(speaker.id, value)}
                        >
                          <SelectTrigger className="w-[280px]">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectGroup>
                              <SelectLabel>OpenAI Voices</SelectLabel>
                              {OPENAI_VOICES.map(voice => (
                                <SelectItem key={voice.id} value={voice.id}>
                                  {voice.name} ({voice.gender})
                                </SelectItem>
                              ))}
                            </SelectGroup>
                            <SelectSeparator />
                            <SelectGroup>
                              <SelectLabel>ElevenLabs Voices</SelectLabel>
                              {ELEVENLABS_VOICES.map(voice => (
                                <SelectItem key={voice.id} value={voice.id}>
                                  {voice.name} ({voice.gender})
                                </SelectItem>
                              ))}
                            </SelectGroup>
                          </SelectContent>
                        </Select>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>

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
                  <div className="flex gap-2">
                    <Button onClick={playMergedAudio}>
                      Play Merged Audio
                    </Button>
                    <Button
                      onClick={() => {
                        const link = document.createElement('a');
                        link.href = mergedAudioPath;
                        link.download = `${selectedTranscript.title}_merged.wav`;
                        document.body.appendChild(link);
                        link.click();
                        document.body.removeChild(link);
                      }}
                      variant="outline"
                    >
                      Download Merged Audio
                    </Button>
                  </div>
                )}
              </div>
            )}

            <div className="space-y-2">
              {selectedTranscript.dialogue.map((line: DialogueLine, index: number) => {
                const lineId = line.id || `${selectedTranscript.id}_line_${index}`;
                const speaker = selectedTranscript.speakers.find(s => s.id === line.speakerId);

                // Determine volume states
                const wasAutoLowered = shouldLowerVolume(line.text);
                const isExcluded = excludedLines.some(e => e.id === lineId);
                const isExtraLowered = extraLoweredLines.some(e => e.id === lineId);
                const isLowVolume = smartVolumeEnabled &&
                  ((wasAutoLowered && !isExcluded) || isExtraLowered);

                // Only show add button for the last removed line
                const showAddButton =
                  smartVolumeEnabled &&
                  lineId === lastRemovedLineId &&
                  !isLowVolume;

                return (
                  <div
                    key={lineId}
                    className={`p-2 rounded ${currentIndex === index ? 'bg-blue-100' : ''
                      } ${isLowVolume ? 'opacity-75' : ''}`}
                  >
                    <div className="flex items-center justify-between">
                      <div>
                        <span className="font-bold">{speaker?.name}: </span>
                        {line.text}
                        {smartVolumeEnabled && isLowVolume && (
                          <span className="inline-flex items-center">
                            <span className="ml-2 text-xs text-gray-500">(lower volume)</span>
                            <button
                              className="ml-1 p-1 text-gray-400 hover:text-red-500 rounded-full hover:bg-gray-100"
                              onClick={() => handleExcludeLine(lineId, line.text)}
                              title="Remove lower volume"
                            >
                              <X className="h-3 w-3" />
                            </button>
                          </span>
                        )}
                        {showAddButton && (
                          <button
                            className="ml-2 text-xs text-blue-500 hover:underline"
                            onClick={() => handleAddLoweredLine(lineId, line.text)}
                            title="Add lower volume"
                          >
                            + add lower volume
                          </button>
                        )}
                      </div>
                    </div>
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