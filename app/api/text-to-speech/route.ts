import { NextResponse } from 'next/server';
import OpenAI from 'openai';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

// Add interface for request body
interface TTSRequest {
  text: string;
  voice: string;
  model: 'openai' | 'elevenlabs';
  modelId: string;
}

// Update the voice mapping to be more explicit
const ELEVENLABS_VOICES = {
  'eleven-multilingual-male': 'T5cu6IU92Krx4mh43osx',  // Bill Oxley
  'eleven-multilingual-female': '21m00Tcm4TlvDq8ikWAM',  // Rachel
  'eleven-flash-male': 'T5cu6IU92Krx4mh43osx',  // Bill Oxley
  'eleven-flash-female': 'EXAVITQu4vr4xnSDxMaL'  // Bella
};

// Map gender to default OpenAI voices
const OPENAI_VOICE_MAPPING = {
  'male': 'echo',
  'female': 'nova',
  'neutral': 'alloy'
};

export async function POST(request: Request) {
  const { text, voice, model, modelId } = await request.json() as TTSRequest;

  try {
    if (model === 'elevenlabs') {
      // Get the voice ID directly from the modelId and gender combination
      const voiceId = ELEVENLABS_VOICES[`${modelId}-${voice}`];
      
      if (!voiceId) {
        throw new Error(`Invalid voice selection: ${modelId}-${voice}`);
      }

      // ElevenLabs API call with correct voice ID
      const response = await fetch(
        `https://api.elevenlabs.io/v1/text-to-speech/${voiceId}`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'xi-api-key': process.env.ELEVENLABS_API_KEY || '',
          },
          body: JSON.stringify({
            text,
            model_id: modelId === 'eleven-multilingual' ? 'eleven_multilingual_v2' : 'eleven_turbo_v2',
            voice_settings: {
              stability: 0.5,
              similarity_boost: 0.75,
            }
          }),
        }
      );

      if (!response.ok) {
        throw new Error('ElevenLabs API error');
      }

      const audioBuffer = Buffer.from(await response.arrayBuffer());
      return new NextResponse(audioBuffer, {
        headers: {
          'Content-Type': 'audio/mpeg',
          'Content-Length': audioBuffer.length.toString(),
        },
      });
    } else {
      // For OpenAI, use the modelId directly if it's a valid voice, otherwise map from gender
      const openaiVoice = ['alloy', 'echo', 'fable', 'onyx', 'nova', 'shimmer'].includes(modelId) 
        ? modelId 
        : OPENAI_VOICE_MAPPING[voice as keyof typeof OPENAI_VOICE_MAPPING] || 'alloy';

      // OpenAI logic
      const mp3 = await openai.audio.speech.create({
        model: "tts-1",
        voice: openaiVoice,
        input: text,
      });

      const audioBuffer = Buffer.from(await mp3.arrayBuffer());
      return new NextResponse(audioBuffer, {
        headers: {
          'Content-Type': 'audio/mpeg',
          'Content-Length': audioBuffer.length.toString(),
        },
      });
    }
  } catch (error) {
    console.error('Text-to-speech error:', error);
    return NextResponse.json({ error: 'Failed to generate speech' }, { status: 500 });
  }
} 