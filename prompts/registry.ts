import { Prompt } from "@/types/prompt";
import { bookClubDiscussionPrompt } from "./bookClubDiscussionPrompt";
import { discussionStylePrompt } from "./discussionStylePrompt";

export const promptRegistry: Record<string, Prompt> = {
  bookClubDiscussion: bookClubDiscussionPrompt,
  discussionStylePrompt: discussionStylePrompt,
}; 