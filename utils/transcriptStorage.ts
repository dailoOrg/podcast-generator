import fs from 'fs/promises';
import path from 'path';

export const transcriptStorage = {
  async saveTranscript(transcript: Transcript) {
    if (!transcript || !transcript.id || !transcript.title) {
      throw new Error('Invalid transcript data');
    }

    const transcriptPath = path.join(process.cwd(), 'public', 'transcripts', `${transcript.id}.json`);
    
    try {
      // Check if file already exists
      try {
        await fs.access(transcriptPath);
        throw new Error('Transcript already exists');
      } catch (err) {
        // File doesn't exist, continue with save
      }

      await fs.writeFile(transcriptPath, JSON.stringify(transcript, null, 2));
    } catch (err) {
      console.error('Error saving transcript:', err);
      throw err;
    }
  },

  async getTranscripts(): Promise<Transcript[]> {
    const transcriptsDir = path.join(process.cwd(), 'public', 'transcripts');
    
    try {
      const files = await fs.readdir(transcriptsDir);
      const transcripts = await Promise.all(
        files
          .filter(file => file.endsWith('.json'))
          .map(async file => {
            const content = await fs.readFile(path.join(transcriptsDir, file), 'utf-8');
            return JSON.parse(content) as Transcript;
          })
      );
      return transcripts;
    } catch (err) {
      console.error('Error getting transcripts:', err);
      return [];
    }
  },

  async getTranscript(id: string): Promise<Transcript | null> {
    const transcriptPath = path.join(process.cwd(), 'public', 'transcripts', `${id}.json`);
    
    try {
      const content = await fs.readFile(transcriptPath, 'utf-8');
      return JSON.parse(content) as Transcript;
    } catch (err) {
      console.error('Error getting transcript:', err);
      return null;
    }
  }
}; 