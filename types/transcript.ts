export interface Speaker {
  id: string;
  name: string;
  voice: string;
  gender: 'male' | 'female';
}

export interface DialogueLine {
  speakerId: string;
  text: string;
  id: string;
}

export interface Transcript {
  id: string;
  title: string;
  speakers: Speaker[];
  dialogue: DialogueLine[];
}
