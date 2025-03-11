export type PromptInput = {
  key: string;
  label: string;
  type: 'text' | 'textarea';
  placeholder: string;
  required: boolean;
};

export type ToolSchema = {
  name: string;
  description: string;
  input_schema: {
    type: string;
    properties: Record<string, any>;
    required: string[];
  };
};

export type ThinkingConfig = {
  type: 'enabled';
  budget_tokens: number;
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
  tools?: ToolSchema[];
  thinking?: ThinkingConfig;
}; 