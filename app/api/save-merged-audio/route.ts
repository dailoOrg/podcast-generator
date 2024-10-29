import { writeFile, mkdir } from 'fs/promises';
import { NextResponse } from 'next/server';
import path from 'path';
import { existsSync } from 'fs';

export async function POST(req: Request) {
  try {
    const data = await req.formData();
    const file: File | null = data.get('file') as unknown as File;
    const transcriptId = data.get('transcriptId') as string;
    
    if (!file) {
      return NextResponse.json({ error: 'No file received' }, { status: 400 });
    }

    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);

    // Ensure audio directory exists
    const audioDir = path.join(process.cwd(), 'public', 'audio');
    if (!existsSync(audioDir)) {
      await mkdir(audioDir, { recursive: true });
    }

    // Save merged file with transcript ID
    const filename = `${transcriptId}_merged.wav`;
    const filepath = path.join(audioDir, filename);
    await writeFile(filepath, buffer);

    return NextResponse.json({ 
      success: true, 
      path: `/audio/${filename}` 
    });
  } catch (error) {
    console.error('Error saving merged file:', error);
    return NextResponse.json({ error: 'Failed to save merged file' }, { status: 500 });
  }
} 