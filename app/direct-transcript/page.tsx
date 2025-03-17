'use client';

import { useState, useRef } from 'react';
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { promptRegistry } from "@/prompts/registry";
import { usePromptWithTools } from '@/hooks/usePromptWithTools';
import { Transcript, Speaker } from '@/types/transcript';
import { Switch } from "@/components/ui/switch";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { ALL_VOICES } from '@/config/voices';
import { shouldLowerVolume } from '@/utils/dialogueUtils';
import { mergeAudioFiles } from '@/utils/audioMerger';

interface AudioFile {
  speakerId: string;
  path: string;
}

interface SpeakerTTSSelection {
  speakerId: string;
  modelId: string;
}

export default function DirectTranscriptPage() {
  const [inputs, setInputs] = useState<Record<string, string>>({});
  const [showResult, setShowResult] = useState(false);
  const [apiError, setApiError] = useState<string | null>(null);
  const [thinking, setThinking] = useState<string | null>(null);
  const [showThinking, setShowThinking] = useState(false);
  const [audioEnabled, setAudioEnabled] = useState(false);
  const [smartVolumeEnabled, setSmartVolumeEnabled] = useState(false);
  const [speakerTTSSelections, setSpeakerTTSSelections] = useState<SpeakerTTSSelection[]>([]);
  const [processing, setProcessing] = useState(false);
  const [isInitialized, setIsInitialized] = useState(false);
  const [audioFiles, setAudioFiles] = useState<AudioFile[]>([]);
  const [mergedAudioPath, setMergedAudioPath] = useState<string | null>(null);
  const [merging, setMerging] = useState(false);
  const audioRef = useRef<HTMLAudioElement>(null);
  const [currentIndex, setCurrentIndex] = useState(0);
  
  const { generateWithPrompt, loading, error, result } = usePromptWithTools<Transcript>();
  const directPrompt = promptRegistry.directTranscript;

  const handleInputChange = (key: string, value: string) => {
    setInputs(prev => ({ ...prev, [key]: value }));
  };

  const handleGenerate = async () => {
    setApiError(null);
    setThinking(null);
    console.log("Starting generation with audio enabled:", audioEnabled);
    
    try {
      const response = await generateWithPrompt(directPrompt, inputs);
      setShowResult(true);
      
      // Reset audio state when generating new transcript
      setIsInitialized(false);
      setAudioFiles([]);
      setMergedAudioPath(null);
      setCurrentIndex(0);
      
      // Initialize default TTS selections for speakers
      if (response && typeof response === 'object' && 'speakers' in response) {
        const defaultSelections = response.speakers.map((speaker: Speaker, index: number) => ({
          speakerId: speaker.id,
          // Use pre-selected voices if available, otherwise fallback to gender-based default
          modelId: index === 0 
            ? (inputs["host1Voice"] || (speaker.gender === 'male' ? 'onyx' : 'shimmer'))
            : (inputs["host2Voice"] || (speaker.gender === 'male' ? 'onyx' : 'shimmer'))
        }));
        setSpeakerTTSSelections(defaultSelections);
      }
      
      // Check if the response includes thinking process
      if (response && typeof response === 'object' && 'thinking' in response) {
        setThinking(response.thinking);
      }
      
      // Store if this is a valid transcript response
      const isValidResponse = response && typeof response === 'object' && 'dialogue' in response;
      console.log("Response received - Audio enabled:", audioEnabled, "Valid response:", isValidResponse);
      
      // Check if the response is a string (error case) or a proper transcript
      if (typeof response === 'string') {
        setApiError("Claude returned text instead of a structured transcript. Please try again.");
      } else if (audioEnabled && isValidResponse) {
        // Automatically generate audio if audio is enabled
        console.log("Starting automatic audio generation");
        // Pass the response directly to avoid state timing issues
        generateAndSaveAudio(response);
      }
    } catch (err) {
      console.error("Failed to generate content:", err);
    }
  };

  const handleTTSModelChange = (speakerId: string, modelId: string) => {
    setSpeakerTTSSelections(prev => {
      const filtered = prev.filter(sel => sel.speakerId !== speakerId);
      return [...filtered, { speakerId, modelId }];
    });
  };

  const generateAndSaveAudio = async (transcriptToUse = null) => {
    // Use provided transcript or fall back to the result state
    const transcript = transcriptToUse || result;
    
    if (!transcript || !('dialogue' in transcript)) {
      console.error("No valid transcript available for audio generation");
      return;
    }

    console.log("Generate and save audio called with transcript:", transcript.id);
    console.log("Current speaker TTS selections:", speakerTTSSelections);
    console.log("Input host voices:", { host1: inputs["host1Voice"], host2: inputs["host2Voice"] });
    
    setProcessing(true);
    const files: AudioFile[] = [];

    try {
      for (let i = 0; i < transcript.dialogue.length; i++) {
        const line = transcript.dialogue[i];
        const speaker = transcript.speakers.find(s => s.id === line.speakerId);
        const fileName = `${transcript.id}_${speaker?.id}_${i}.mp3`;

        // Determine which voice to use for this speaker
        let voiceId;
        
        // Find the speaker's index (0 for first speaker, 1 for second, etc.)
        const speakerIndex = transcript.speakers.findIndex(s => s.id === line.speakerId);
        
        if (speakerIndex === 0) {
          // First speaker uses host1Voice if available
          voiceId = inputs["host1Voice"] || "onyx";
        } else {
          // Other speakers use host2Voice if available
          voiceId = inputs["host2Voice"] || "shimmer";
        }
        
        // Find the voice model details
        const selectedModel = ALL_VOICES.find(model => model.id === voiceId);
        
        console.log(`Using voice ${voiceId} for speaker ${speaker?.name} (index ${speakerIndex})`);

        // Generate speech with the selected model
        const response = await fetch('/api/text-to-speech', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            text: line.text,
            voiceId: voiceId || 'alloy',
            provider: selectedModel?.provider || 'openai'
          }),
        });

        if (!response.ok) {
          throw new Error(`Failed to generate speech for line ${i + 1}`);
        }

        const audioBlob = await response.blob();
        const formData = new FormData();
        formData.append('audio', audioBlob, fileName);
        formData.append('transcriptId', transcript.id);

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
      setIsInitialized(true);
    } catch (error) {
      console.error('Error processing audio:', error);
    } finally {
      setProcessing(false);
    }
  };

  const playSequence = () => {
    if (!audioRef.current || !result || currentIndex >= audioFiles.length) return;
    
    audioRef.current.src = audioFiles[currentIndex].path;

    const currentLine = result.dialogue[currentIndex];
    if (currentLine && smartVolumeEnabled && shouldLowerVolume(currentLine.text)) {
      audioRef.current.volume = 0.65;
    } else {
      audioRef.current.volume = 1.0;
    }

    audioRef.current.play();
    audioRef.current.onended = () => setCurrentIndex(prev => prev + 1);
  };

  const handleMergeAudio = async () => {
    if (!result || audioFiles.length === 0) return;

    setMerging(true);
    try {
      const audioUrls = audioFiles.map(file => file.path);
      const mergedBlob = await mergeAudioFiles(
        audioUrls,
        result.dialogue,
        smartVolumeEnabled
      );

      // Create FormData and append the merged file
      const formData = new FormData();
      formData.append('file', new File([mergedBlob], `${result.id}_merged.wav`, { type: 'audio/wav' }));
      formData.append('transcriptId', result.id);

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

            <div className="flex items-center space-x-2">
              <Switch
                id="audio-enabled"
                checked={audioEnabled}
                onCheckedChange={setAudioEnabled}
              />
              <Label htmlFor="audio-enabled">Enable Audio Generation</Label>
            </div>

            {audioEnabled && !showResult && (
              <div className="mt-4 border rounded-md p-4 bg-gray-50">
                <h4 className="text-sm font-medium mb-3">Voice Configuration</h4>
                <div className="grid grid-cols-1 gap-4">
                  <div className="space-y-2">
                    <Label className="text-xs">Host 1 (Default)</Label>
                    <Select
                      defaultValue="onyx"
                      onValueChange={(value) => {
                        // Store selected voice in local state or inputs
                        setInputs(prev => ({ ...prev, "host1Voice": value }));
                      }}
                    >
                      <SelectTrigger className="w-full">
                        <SelectValue placeholder="Select voice" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="alloy">OpenAI Alloy (Neutral)</SelectItem>
                        <SelectItem value="echo">OpenAI Echo (Male)</SelectItem>
                        <SelectItem value="fable">OpenAI Fable (Female)</SelectItem>
                        <SelectItem value="onyx">OpenAI Onyx (Male)</SelectItem>
                        <SelectItem value="nova">OpenAI Nova (Female)</SelectItem>
                        <SelectItem value="shimmer">OpenAI Shimmer (Female)</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  
                  <div className="space-y-2">
                    <Label className="text-xs">Host 2 (Default)</Label>
                    <Select
                      defaultValue="shimmer"
                      onValueChange={(value) => {
                        // Store selected voice in local state or inputs
                        setInputs(prev => ({ ...prev, "host2Voice": value }));
                      }}
                    >
                      <SelectTrigger className="w-full">
                        <SelectValue placeholder="Select voice" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="alloy">OpenAI Alloy (Neutral)</SelectItem>
                        <SelectItem value="echo">OpenAI Echo (Male)</SelectItem>
                        <SelectItem value="fable">OpenAI Fable (Female)</SelectItem>
                        <SelectItem value="onyx">OpenAI Onyx (Male)</SelectItem>
                        <SelectItem value="nova">OpenAI Nova (Female)</SelectItem>
                        <SelectItem value="shimmer">OpenAI Shimmer (Female)</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </div>
            )}
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
                      <h4 className="font-semibold text-lg mb-2">{result.title}</h4>
                      
                      {/* Display speakers and dialogue */}
                      <div className="space-y-4">
                        {/* Speakers section */}
                        <div className="mb-4">
                          <h5 className="font-medium text-sm text-gray-500 mb-2">Speakers:</h5>
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            {result.speakers.map((speaker: Speaker) => (
                              <div key={speaker.id} className="border rounded p-3 bg-gray-50">
                                <div className="flex justify-between items-center mb-2">
                                  <span className="font-medium">{speaker.name}</span>
                                  <span className="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded-full">
                                    {speaker.gender}
                                  </span>
                                </div>
                                {/* Voice selection is now handled before generation */}
                              </div>
                            ))}
                          </div>
                        </div>
                        
                        {/* Dialogue section */}
                        <div>
                          <h5 className="font-medium text-sm text-gray-500 mb-2">Dialogue:</h5>
                          <div className="space-y-2">
                            {result.dialogue.map((line, index) => {
                              const speaker = result.speakers.find(s => s.id === line.speakerId);
                              return (
                                <div 
                                  key={line.id || index} 
                                  className={`p-2 rounded ${line.speakerId === result.speakers[0].id ? 'bg-blue-50' : 'bg-green-50'}`}
                                >
                                  <span className="font-semibold">{speaker?.name}: </span>
                                  <span>{line.text}</span>
                                </div>
                              );
                            })}
                          </div>
                        </div>
                      </div>
                    </div>
                    
                    <div className="flex flex-col gap-4">
                      {audioEnabled && (
                        <div className="border rounded p-4 bg-gray-50">
                          <h4 className="font-semibold mb-3">Audio Generation</h4>
                          
                          <div className="flex items-center space-x-2 mb-4">
                            <Switch
                              id="smart-volume"
                              checked={smartVolumeEnabled}
                              onCheckedChange={setSmartVolumeEnabled}
                              disabled={isInitialized}
                            />
                            <Label htmlFor="smart-volume">Smart Volume Control</Label>
                            <Tooltip>
                              <TooltipTrigger className="text-xs text-blue-500 hover:underline cursor-pointer ml-2">
                                (more info)
                              </TooltipTrigger>
                              <TooltipContent className="w-80 p-3">
                                <p>Automatically lowers volume for short reactions and acknowledgments</p>
                              </TooltipContent>
                            </Tooltip>
                          </div>
                          
                          <div className="flex flex-wrap gap-2">
                            {processing && !isInitialized && (
                              <div className="flex items-center space-x-2">
                                <div className="w-4 h-4 rounded-full border-2 border-t-blue-500 animate-spin"></div>
                                <span>Generating audio files...</span>
                              </div>
                            )}
                            
                            {!processing && !isInitialized && (
                              <Button 
                                onClick={() => generateAndSaveAudio()} 
                                variant="outline"
                              >
                                Generate Audio Manually
                              </Button>
                            )}
                            
                            {isInitialized && (
                              <>
                                <Button
                                  onClick={playSequence}
                                  disabled={processing || merging}
                                  variant="outline"
                                >
                                  Play Sequence
                                </Button>
                                
                                <Button
                                  onClick={handleMergeAudio}
                                  disabled={processing || merging || mergedAudioPath !== null}
                                  variant="outline"
                                >
                                  {merging ? 'Merging...' : 'Merge Audio'}
                                </Button>
                                
                                {mergedAudioPath && (
                                  <>
                                    <Button
                                      onClick={playMergedAudio}
                                      disabled={processing}
                                      variant="outline"
                                    >
                                      Play Merged
                                    </Button>
                                    
                                    <Button
                                      onClick={() => {
                                        if (mergedAudioPath) {
                                          window.open(mergedAudioPath, '_blank');
                                        }
                                      }}
                                      disabled={processing}
                                      variant="outline"
                                    >
                                      Download
                                    </Button>
                                  </>
                                )}
                              </>
                            )}
                          </div>
                          
                          <audio ref={audioRef} style={{ display: 'none' }} />
                        </div>
                      )}

                      <div className="flex justify-end space-x-2">
                        <Button 
                          variant="outline" 
                          onClick={() => {
                            setShowResult(false);
                            setAudioFiles([]);
                            setMergedAudioPath(null);
                            setIsInitialized(false);
                          }}
                          disabled={loading}
                        >
                          New Generation
                        </Button>
                        <Button 
                          onClick={() => {
                            navigator.clipboard.writeText(JSON.stringify(result));
                          }}
                        >
                          Copy to Clipboard
                        </Button>
                      </div>
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