// Speaker definition
export interface Speaker {
  id: string;
  name?: string;
  voice: string;
  gender: 'male' | 'female' | 'neutral';
}

// Dialogue line in a transcript
export interface DialogueLine {
  speakerId: string;
  text: string;
  id: string;
}

// Complete transcript structure
export interface Transcript {
  id: string;
  title: string;
  speakers: Speaker[];
  dialogue: DialogueLine[];
}

// Voice configuration
export interface VoiceConfig {
  id: string;
  name: string;
  gender: 'male' | 'female' | 'neutral';
  provider?: 'openai' | 'elevenlabs';
}

// Prompt configuration
export interface PromptConfig {
  model: string;
  max_tokens: number;
  temperature: number;
  systemPrompt?: string;
}

// Audio format configuration
export interface AudioFormatConfig {
  default: 'wav' | 'mp3';
  mp3Quality: string;
}

// Audio configuration
export interface AudioConfig {
  defaultVoices: {
    speaker1: string;
    speaker2: string;
  };
  format: AudioFormatConfig;
}

// Output configuration
export interface OutputConfig {
  scriptDir: string;
  audioDir: string;
}

// Complete application configuration
export interface AppConfig {
  output: OutputConfig;
  script: PromptConfig;
  audio: AudioConfig;
  voices: {
    openai: VoiceConfig[];
    elevenlabs?: VoiceConfig[];
  };
}

// Command-line options for the generate command
export interface GenerateOptions {
  content?: string;
  file?: string;
  output?: string;
  model?: string;
  maxTokens?: number;
  temperature?: number;
}

// Command-line options for the audio command
export interface AudioOptions {
  input: string;
  output?: string;
  voice1?: string;
  voice2?: string;
  format?: 'wav' | 'mp3';
  bitrate?: string;
} 