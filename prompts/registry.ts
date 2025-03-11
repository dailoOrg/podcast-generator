import { Prompt } from "@/types/prompt";
import { bookClubDiscussionPrompt } from "./bookClubDiscussionPrompt";
import { discussionStylePrompt } from "./discussionStylePrompt";
import { directTranscriptPrompt } from "./directTranscriptPrompt";

export const promptRegistry: Record<string, Prompt> = {
  bookClubDiscussion: bookClubDiscussionPrompt,
  discussionStylePrompt: discussionStylePrompt,
  directTranscript: directTranscriptPrompt,
}; 