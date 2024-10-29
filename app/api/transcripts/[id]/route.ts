import { NextResponse } from 'next/server';
import { promises as fs } from 'fs';
import path from 'path';

export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const transcriptPath = path.join(process.cwd(), 'public', 'transcripts', `${params.id}.json`);
    const content = await fs.readFile(transcriptPath, 'utf-8');
    return NextResponse.json(JSON.parse(content));
  } catch (err) {
    return NextResponse.json({ error: 'Transcript not found' }, { status: 404 });
  }
} 