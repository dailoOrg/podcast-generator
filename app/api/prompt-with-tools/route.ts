import { NextResponse } from 'next/server';
import Anthropic from '@anthropic-ai/sdk';

export async function POST(request: Request) {
  try {
    const { model, max_tokens, temperature, prompt, systemPrompt, tools, thinking } = await request.json();

    if (!prompt) {
      return NextResponse.json(
        { error: 'Prompt is required' },
        { status: 400 }
      );
    }

    const anthropic = new Anthropic({
      apiKey: process.env.ANTHROPIC_API_KEY,
    });

    // Create message options with required parameters
    const messageOptions: any = {
      model,
      max_tokens,
      temperature,
      messages: [{ role: "user", content: prompt }],
      tool_choice: { type: "auto" }, // Changed from "any" to "auto" to allow extended thinking
    };

    // Only add system if it exists
    if (systemPrompt) {
      messageOptions.system = systemPrompt;
    }

    // Add tools if they exist
    if (tools && tools.length > 0) {
      messageOptions.tools = tools;
    }

    // Add thinking if it exists
    if (thinking) {
      messageOptions.thinking = thinking;
    }

    console.log("Sending request to Anthropic API with options:", JSON.stringify({
      model: messageOptions.model,
      hasSystem: !!messageOptions.system,
      hasTools: !!messageOptions.tools,
      toolCount: messageOptions.tools?.length || 0,
      toolChoice: messageOptions.tool_choice,
      thinking: messageOptions.thinking
    }));

    // Make the API call to Anthropic
    const response = await anthropic.messages.create(messageOptions);
    
    console.log("Response stop reason:", response.stop_reason);
    console.log("Response content types:", response.content.map(c => c.type));
    
    // Extract thinking blocks for logging/debugging
    const thinkingBlocks = response.content.filter(block => block.type === 'thinking');
    if (thinkingBlocks.length > 0) {
      console.log("Thinking process:", thinkingBlocks.map((block: any) => block.thinking).join("\n\n"));
    }
    
    // Check if Claude stopped because of a tool use request
    if (response.stop_reason === 'tool_use') {
      // Find all tool_use blocks
      const toolUseBlocks = response.content.filter(block => block.type === 'tool_use');
      
      if (toolUseBlocks.length > 0) {
        // We're handling the first tool use for simplicity
        const toolUseBlock = toolUseBlocks[0] as any;
        
        console.log("Found tool_use block:", JSON.stringify(toolUseBlock, null, 2));
        
        // Use Claude's tool schema input directly as our transcript
        if (toolUseBlock.name === 'generate_transcript') {
          const input = toolUseBlock.input;
          
          // Create a proper transcript with all the required fields
          const transcript = {
            id: `transcript-${Date.now()}`,
            title: input.title || "Untitled Conversation",
            speakers: input.speakers.map((speaker: any) => ({
              id: speaker.id,
              name: speaker.name,
              voice: speaker.voice,
              gender: speaker.voice === 'echo' ? 'male' : 'female'
            })),
            dialogue: input.dialogue.map((line: any, index: number) => ({
              speakerId: line.speakerId,
              text: line.text,
              id: `line-${index}`
            }))
          };
          
          // Get the base URL from the request
          const requestUrl = new URL(request.url);
          const baseUrl = requestUrl.origin;
          
          // Try to save the transcript using absolute URL
          try {
            const saveResponse = await fetch(`${baseUrl}/api/transcripts`, {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
              },
              body: JSON.stringify(transcript),
            });
            
            if (!saveResponse.ok) {
              console.error("Failed to store transcript:", await saveResponse.text());
            }
          } catch (e) {
            console.error("Failed to store transcript:", e);
          }
          
          // Return the transcript and any thinking process
          return NextResponse.json({ 
            result: transcript,
            isToolCall: true,
            thinking: thinkingBlocks.length > 0 ? thinkingBlocks.map((block: any) => block.thinking).join("\n\n") : null
          });
        }
      }
    }
    
    // If we get here, we didn't get a tool use response or the expected tool
    // Extract any text content as a fallback
    const textContent = response.content.find(block => block.type === 'text');
    if (textContent && 'text' in textContent) {
      return NextResponse.json({ 
        result: textContent.text,
        error: "Claude did not use the tool properly. Received text response instead.",
        thinking: thinkingBlocks.length > 0 ? thinkingBlocks.map((block: any) => block.thinking).join("\n\n") : null
      });
    }
    
    return NextResponse.json({ 
      error: 'Failed to generate proper transcript format. Please try again.',
      thinking: thinkingBlocks.length > 0 ? thinkingBlocks.map((block: any) => block.thinking).join("\n\n") : null
    }, { status: 500 });
    
  } catch (error) {
    console.error('Anthropic API error:', error);
    return NextResponse.json(
      { error: 'Failed to generate response' },
      { status: 500 }
    );
  }
} 