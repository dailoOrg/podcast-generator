import { existsSync } from 'fs';
import path from 'path';
import { NextResponse } from 'next/server';

export async function POST(req: Request) {
  try {
    const { fileNames } = await req.json();
    const audioDir = path.join(process.cwd(), 'public', 'audio');
    
    const existingFiles = fileNames.map((fileName: string) => {
      const filePath = path.join(audioDir, fileName);
      return {
        fileName,
        exists: existsSync(filePath),
        path: `/audio/${fileName}`
      };
    });

    return NextResponse.json({ files: existingFiles });
  } catch (error) {
    console.error('Error checking files:', error);
    return NextResponse.json({ error: 'Failed to check files' }, { status: 500 });
  }
} 