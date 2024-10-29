import type { Transcript } from '@/types/transcript';

export const transcriptStorage = {
  async saveTranscript(transcript: Transcript) {
    const response = await fetch('/api/transcripts', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(transcript)
    });

    if (!response.ok) {
      throw new Error('Failed to save transcript');
    }

    return response.json();
  },

  async getTranscripts(): Promise<Transcript[]> {
    const response = await fetch('/api/transcripts');
    
    if (!response.ok) {
      console.error('Error getting transcripts');
      return [];
    }

    return response.json();
  },

  async getTranscript(id: string): Promise<Transcript | null> {
    const response = await fetch(`/api/transcripts/${id}`);
    
    if (!response.ok) {
      console.error('Error getting transcript');
      return null;
    }

    return response.json();
  }
}; 