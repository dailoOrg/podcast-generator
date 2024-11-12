interface Speaker {
  id: string;
  name: string;
  voice: "alloy" | "echo" | "fable" | "onyx" | "nova" | "shimmer";
}

interface DialogueLine {
  speakerId: string;
  text: string;
  fillers?: FillerLine[];
}

interface FillerLine {
  speakerId: string;
  text: string;
  category?: string;
}

interface Transcript {
  id: string;
  title: string;
  speakers: Speaker[];
  dialogue: DialogueLine[];
} 