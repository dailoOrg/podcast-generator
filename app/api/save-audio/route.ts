import { writeFile, mkdir } from 'fs/promises';
import { NextResponse } from 'next/server';
import path from 'path';
import { existsSync } from 'fs';

export async function POST(req: Request) {
  try {
    const data = await req.formData();
    const file: File | null = data.get('file') as unknown as File;
    
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

    // Save file to public/audio directory
    const filename = file.name;
    const filepath = path.join(audioDir, filename);
    await writeFile(filepath, buffer);

    console.log(`File saved successfully at: ${filepath}`);

    return NextResponse.json({ 
      success: true, 
      path: `/audio/${filename}` 
    });
  } catch (error) {
    console.error('Error saving file:', error);
    return NextResponse.json({ error: 'Failed to save file' }, { status: 500 });
  }
} 