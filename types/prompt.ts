export type PromptInput = {
  key: string;
  label: string;
  type: 'text' | 'textarea';
  placeholder: string;
  required: boolean;
};

export type Prompt = {
  id: string;
  model: string;
  max_tokens: number;
  temperature: number;
  name: string;
  description: string;
  inputs: PromptInput[];
  systemPrompt?: string;
  userPrompt: (inputs: Record<string, string>) => string;
}; 