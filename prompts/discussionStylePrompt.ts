import { Prompt } from "@/types/prompt";

export const discussionStylePrompt: Prompt = {
  id: "discussionStylePrompt",
  model: "claude-3-5-sonnet-20241022",
  max_tokens: 8192,
  temperature: 0,
  name: "Discussion Style Transformer",
  description: "Transforms an existing script into different speaking styles while preserving the core content and discussion flow",
  systemPrompt: `You are a dialogue style transformer specializing in adapting podcast scripts.
Your task is to transform ONLY the speaking style and personality of the speakers while preserving the exact content and insights.

Key principles:
- Keep all content and insights intact
- Only change HOW things are said, not WHAT is said
- Maintain the natural flow of conversation
- Avoid unnecessary speaker mentions
- Keep a balanced, natural tone without artificial enthusiasm
- Be transparent about being AI-generated content

Your goal is to enhance the script's style while keeping its substance unchanged.`,
  inputs: [
    {
      key: "script",
      label: "Original Script",
      type: "textarea" as const,
      placeholder: "Paste the existing discussion script you want to transform...",
      required: true
    }
  ],
  userPrompt: (inputs: Record<string, string>) => `
<Original Script>
${inputs.script}
</Original Script>

<Instructions>
- The speakers should avoid mentioning the speakers in dialog if not necessary.
- The speakers should avoid sounding unaturally enthusiastic.
- The speakers should not pretend to be human not hide they are AI.
</Instructions>

<Important>
- Keep ALL the same content, points, and insights from the original script
- Only transform HOW things are said, not WHAT is said.
</Important>

!ADAPT THE ENTIRE SCRIPT.`
}; 