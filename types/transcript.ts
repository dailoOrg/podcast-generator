interface Speaker {
  id: string;
  name: string;
  voice: "alloy" | "echo" | "fable" | "onyx" | "nova" | "shimmer";
}

interface DialogueLine {
  speakerId: string;
  text: string;
  timestamp?: string;
  audioUrl?: string;
}

interface Transcript {
  id: string;
  title: string;
  speakers: Speaker[];
  dialogue: DialogueLine[];
} 