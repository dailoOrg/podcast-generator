import { NextResponse } from 'next/server';
import Anthropic from '@anthropic-ai/sdk';

export async function POST(request: Request) {
  try {
    const { model, max_tokens, temperature, prompt, systemPrompt } = await request.json();

    if (!prompt) {
      return NextResponse.json(
        { error: 'Prompt is required' },
        { status: 400 }
      );
    }

    const anthropic = new Anthropic({
      apiKey: process.env.ANTHROPIC_API_KEY,
    });

    // Create message options with required parameters
    const messageOptions: any = {
      model,
      max_tokens,
      temperature,
      messages: [{ role: "user", content: prompt }],
    };

    // Only add system if it exists
    if (systemPrompt) {
      messageOptions.system = systemPrompt;
    }

    const message = await anthropic.messages.create(messageOptions);

    const content = message.content[0];
    if ('text' in content) {
      return NextResponse.json({ result: content.text });
    } else {
      throw new Error('Unexpected response format from Anthropic API');
    }
  } catch (error) {
    console.error('Anthropic API error:', error);
    return NextResponse.json(
      { error: 'Failed to generate response' },
      { status: 500 }
    );
  }
} 