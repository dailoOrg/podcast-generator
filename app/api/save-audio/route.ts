import { NextResponse } from 'next/server';
import { writeFile } from 'fs/promises';
import { join } from 'path';
import { mkdir } from 'fs/promises';

export async function POST(request: Request) {
  try {
    const formData = await request.formData();
    const file = formData.get('file') as File;
    
    if (!file) {
      return NextResponse.json({ error: 'No file provided' }, { status: 400 });
    }

    // Ensure the audio directory exists
    const audioDir = join(process.cwd(), 'public', 'audio');
    await mkdir(audioDir, { recursive: true });

    // Convert File to Buffer
    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);

    // Save the file
    const filePath = join(audioDir, file.name);
    await writeFile(filePath, buffer);

    return NextResponse.json({ 
      path: `/audio/${file.name}`,
      message: 'File saved successfully' 
    });
  } catch (error) {
    console.error('Error saving audio file:', error);
    return NextResponse.json({ error: 'Failed to save file' }, { status: 500 });
  }
}

export const config = {
  api: {
    bodyParser: false,
  },
}; 