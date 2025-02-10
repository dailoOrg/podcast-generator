export interface VoiceConfig {
  id: string;
  name: string;
  provider: 'openai' | 'elevenlabs';
  gender: 'male' | 'female' | 'neutral';
  voiceId?: string; // The actual API voice ID (for ElevenLabs)
  modelId?: string; // The model ID for ElevenLabs voices
}

// OpenAI voice configurations
export const OPENAI_VOICES: VoiceConfig[] = [
  { id: 'alloy', name: 'OpenAI Alloy', provider: 'openai', gender: 'neutral' },
  { id: 'echo', name: 'OpenAI Echo', provider: 'openai', gender: 'male' },
  { id: 'fable', name: 'OpenAI Fable', provider: 'openai', gender: 'female' },
  { id: 'onyx', name: 'OpenAI Onyx', provider: 'openai', gender: 'male' },
  { id: 'nova', name: 'OpenAI Nova', provider: 'openai', gender: 'female' },
  { id: 'shimmer', name: 'OpenAI Shimmer', provider: 'openai', gender: 'female' },
];

// ElevenLabs voice configurations
export const ELEVENLABS_VOICES: VoiceConfig[] = [
  { 
    id: 'aria-multilingual', 
    name: 'Aria (Multilingual)', 
    provider: 'elevenlabs', 
    gender: 'female',
    voiceId: '9BWtsMINqrJLrRacOk9x',
    modelId: 'eleven_multilingual_v2'
  },
  { 
    id: 'bill-multilingual', 
    name: 'Bill (Multilingual)', 
    provider: 'elevenlabs', 
    gender: 'male',
    voiceId: 'T5cu6IU92Krx4mh43osx',
    modelId: 'eleven_multilingual_v2'
  },
  { 
    id: 'bill-turbo', 
    name: 'Bill (Turbo)', 
    provider: 'elevenlabs', 
    gender: 'male',
    voiceId: 'T5cu6IU92Krx4mh43osx',
    modelId: 'eleven_turbo_v2'
  },
  { 
    id: 'rachel-multilingual', 
    name: 'Rachel (Multilingual)', 
    provider: 'elevenlabs', 
    gender: 'female',
    voiceId: '21m00Tcm4TlvDq8ikWAM',
    modelId: 'eleven_multilingual_v2'
  },
  { 
    id: 'rachel-turbo', 
    name: 'Rachel (Turbo)', 
    provider: 'elevenlabs', 
    gender: 'female',
    voiceId: '21m00Tcm4TlvDq8ikWAM',
    modelId: 'eleven_turbo_v2'
  }
];

// Combined list of all available voices
export const ALL_VOICES = [...OPENAI_VOICES, ...ELEVENLABS_VOICES];

// Helper function to get voice by ID
export function getVoiceById(id: string): VoiceConfig | undefined {
  return ALL_VOICES.find(voice => voice.id === id);
}

// Helper function to get ElevenLabs voice ID and model
export function getElevenLabsConfig(voiceId: string): { voiceId: string; modelId: string } | undefined {
  const voice = ELEVENLABS_VOICES.find(v => v.id === voiceId);
  if (!voice || !voice.voiceId || !voice.modelId) return undefined;
  return { voiceId: voice.voiceId, modelId: voice.modelId };
} 