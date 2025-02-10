import { NextResponse } from 'next/server';
import OpenAI from 'openai';
import { getElevenLabsConfig, getVoiceById } from '@/config/voices';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

// OpenAI voice type
type OpenAIVoice = 'alloy' | 'echo' | 'fable' | 'onyx' | 'nova' | 'shimmer';

// Add interface for request body
interface TTSRequest {
  text: string;
  voiceId: string;
  provider: 'openai' | 'elevenlabs';
}

export async function POST(request: Request) {
  const { text, voiceId, provider } = await request.json() as TTSRequest;

  try {
    if (provider === 'elevenlabs') {
      // Get the voice ID and model using the helper function
      const config = getElevenLabsConfig(voiceId);
      
      if (!config) {
        throw new Error(`Invalid ElevenLabs voice selection: ${voiceId}`);
      }

      // ElevenLabs API call with correct voice ID and model
      const response = await fetch(
        `https://api.elevenlabs.io/v1/text-to-speech/${config.voiceId}`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'xi-api-key': process.env.ELEVENLABS_API_KEY || '',
          },
          body: JSON.stringify({
            text,
            model_id: config.modelId,
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
    }

    // For OpenAI, get the voice configuration
    const voiceConfig = getVoiceById(voiceId);
    const openaiVoice = (voiceConfig?.id || 'alloy') as OpenAIVoice;

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

  } catch (error) {
    console.error('Text-to-speech error:', error);
    return NextResponse.json({ error: 'Failed to generate speech' }, { status: 500 });
  }
} 