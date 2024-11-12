import { NextResponse } from 'next/server';
import { promises as fs } from 'fs';
import path from 'path';

// Helper function to ensure transcripts directory exists
async function ensureTranscriptsDirectory() {
  const transcriptsDir = path.join(process.cwd(), 'public', 'transcripts');
  try {
    await fs.access(transcriptsDir);
  } catch {
    await fs.mkdir(transcriptsDir, { recursive: true });
  }
  return transcriptsDir;
}

export async function GET() {
  try {
    const transcriptsDir = await ensureTranscriptsDirectory();
    
    // Read all files in the transcripts directory
    const files = await fs.readdir(transcriptsDir);
    const jsonFiles = files.filter(file => file.endsWith('.json'));
    
    // Read and parse each transcript file
    const transcripts = await Promise.all(
      jsonFiles.map(async (file) => {
        const content = await fs.readFile(path.join(transcriptsDir, file), 'utf-8');
        return JSON.parse(content);
      })
    );
    
    return NextResponse.json(transcripts);
  } catch (error) {
    console.error('Error reading transcripts:', error);
    return NextResponse.json({ error: 'Failed to load transcripts' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const newTranscript = await request.json();
    const transcriptsDir = await ensureTranscriptsDirectory();
    
    // Save the new transcript to a file
    const filePath = path.join(transcriptsDir, `${newTranscript.id}.json`);
    await fs.writeFile(filePath, JSON.stringify(newTranscript, null, 2));
    
    return NextResponse.json({ message: 'Transcript saved successfully' }, { status: 201 });
  } catch (error) {
    console.error('Error saving transcript:', error);
    return NextResponse.json({ error: 'Failed to save transcript' }, { status: 500 });
  }
} 