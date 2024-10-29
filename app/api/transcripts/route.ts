import { NextResponse } from 'next/server';
import { transcriptStorage } from '@/utils/transcriptStorage';

export async function POST(request: Request) {
  try {
    const transcript = await request.json();
    await transcriptStorage.saveTranscript(transcript);
    return NextResponse.json({ success: true });
  } catch (err) {
    return NextResponse.json({ error: err.message }, { status: 400 });
  }
}

export async function GET() {
  try {
    const transcripts = await transcriptStorage.getTranscripts();
    return NextResponse.json(transcripts);
  } catch (err) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
} 