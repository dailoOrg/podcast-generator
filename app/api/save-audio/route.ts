import { writeFile, mkdir } from 'fs/promises';
import { NextResponse } from 'next/server';
import path from 'path';
import { existsSync } from 'fs';

export async function POST(request: Request) {
  try {
    const formData = await request.formData();
    const audioFile = formData.get('audio') as Blob;
    const transcriptId = formData.get('transcriptId') as string;
    
    if (!audioFile || !transcriptId) {
      return NextResponse.json({ error: 'Missing audio file or transcript ID' }, { status: 400 });
    }

    // Create audio directory if it doesn't exist
    const audioDir = path.join(process.cwd(), 'public', 'audio');
    if (!existsSync(audioDir)) {
      await mkdir(audioDir, { recursive: true });
    }

    // Convert Blob to Buffer
    const arrayBuffer = await audioFile.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    // Save file
    const filePath = path.join(audioDir, audioFile.name);
    await writeFile(filePath, buffer);

    // Return success response with file path
    return NextResponse.json({
      path: `/audio/${audioFile.name}`,
      message: 'Audio file saved successfully'
    });

  } catch (error) {
    console.error('Error saving audio file:', error);
    return NextResponse.json({ 
      error: 'Failed to save audio file',
      details: error.message 
    }, { status: 500 });
  }
}