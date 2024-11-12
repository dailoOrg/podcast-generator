import { NextResponse } from 'next/server';
import OpenAI from 'openai';

const openai = new OpenAI();

const FILLER_RESPONSES = {
  laughter: ["(laughs) (laughs)"],
  amazement: ["ooooooohhh, wow!", "whoa"],
  realization: ["ahh-ha!"],
  sympathy: ["awww"],
  contemplation: ["hmm, yeah", "hmm, yeah, I think so"],
  surprise: ["huh"],
  attentive: ["uh-huh", "Yeah, absolutely", "Yeah, I agree"],
  contentment: ["ahhh", "ahhh, yeah"],
  agreement: ["mhm"],
  alarm: ["Ugh, yikes", "ugh, really?"]
};

export async function POST(request: Request) {
  try {
    const { text, context } = await request.json();

    const prompt = `Analyze the following statement in the context of a conversation and select the most appropriate type of listener response.
    Statement: "${text}"
    Previous context: "${context}"

    Consider the emotional tone and content of the statement. Choose one of these response types:
    - laughter: For humorous or lighthearted moments
    - amazement: For impressive or surprising information
    - realization: For moments of understanding or insight
    - sympathy: For emotional or touching moments
    - contemplation: For complex or thought-provoking ideas
    - surprise: For unexpected information
    - attentive: For moments requiring active listening
    - contentment: For satisfying or agreeable moments
    - agreement: For points that align with the listener's perspective
    - alarm: For concerning or awkward information

    Respond with just the category name that best matches the appropriate emotional response.`;

    const completion = await openai.chat.completions.create({
      messages: [{ role: "user", content: prompt }],
      model: "gpt-4",
      temperature: 0.7,
      max_tokens: 50
    });

    const category = completion.choices[0].message.content?.toLowerCase().trim() as keyof typeof FILLER_RESPONSES;
    const responses = FILLER_RESPONSES[category] || FILLER_RESPONSES.attentive;
    const selectedResponse = responses[Math.floor(Math.random() * responses.length)];

    return NextResponse.json({ 
      filler: selectedResponse,
      category: category 
    });
  } catch (error) {
    console.error('Error generating filler:', error);
    return NextResponse.json({ error: 'Failed to generate filler' }, { status: 500 });
  }
} 