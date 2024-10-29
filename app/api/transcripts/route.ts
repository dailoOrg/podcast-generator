import { NextResponse } from 'next/server';
import { promises as fs } from 'fs';
import path from 'path';

export async function GET() {
  try {
    const transcriptsDir = path.join(process.cwd(), 'public', 'transcripts');
    const files = await fs.readdir(transcriptsDir);
    
    const transcripts = await Promise.all(
      files
        .filter(file => file.endsWith('.json'))
        .map(async file => {
          const content = await fs.readFile(path.join(transcriptsDir, file), 'utf-8');
          return JSON.parse(content);
        })
    );
    
    return NextResponse.json(transcripts);
  } catch (err) {
    return NextResponse.json({ error: 'Failed to load transcripts' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const transcript = await request.json();
    const transcriptPath = path.join(
      process.cwd(), 
      'public', 
      'transcripts', 
      `${transcript.id}.json`
    );
    
    await fs.writeFile(transcriptPath, JSON.stringify(transcript, null, 2));
    return NextResponse.json({ success: true });
  } catch (err) {
    return NextResponse.json({ error: 'Failed to save transcript' }, { status: 400 });
  }
} 