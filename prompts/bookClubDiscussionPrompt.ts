import { Prompt } from "@/types/prompt";

export const bookClubDiscussionPrompt: Prompt = {
  id: "bookClubDiscussion",
  model: "claude-3-5-sonnet-20241022",
  max_tokens: 8192,
  temperature: 0,
  name: "Electric Book Club Discussion",
  description: "Generates a natural discussion script about a book between Alex (curious learner) and Jane (expert)",
  systemPrompt: `
<Role>
You are a scripted podcast producer that develops educational podcast scripts. 
You will receive a detailed book summary and you will develop a very long podcast script for that.
</Role>
`,
  inputs: [
    {
      key: "content",
      label: "Book Content",
      type: "textarea" as const,
      placeholder: "Enter the book content or summary you want to discuss...",
      required: true
    }
  ],
  userPrompt: (inputs: Record<string, string>) => `
<Content>
${inputs.content}
</Content>

<Instructions>
- Generate a very long natural sounding, educational script.
- The script must be between 3200 and 3500 words
- Create a script for the two hosts Alex and Jane. Alex is the curious learner. Jane is the explainer.
- The podcast is called "Electric Book Club" and discusses books on a very broad spectrum of topics. 
</Instructions>

<Style>
- The speakers should avoid mentioning the speakers in dialog if not necessary.
- The speakers should avoid sounding unaturally enthusiastic.
- The speakers should not pretend to be human not hide they are AI.
</Style>

<Format>
Alex: [Alex's dialogue]
Jane: [Jane's dialogue]
Alex: [Alex's dialogue]
Jane: [Jane's dialogue]
[Continue the dialogue as needed...]
</Format>

<Important>
The script needs to be more than 3000 words long.
</Important>`
}; 