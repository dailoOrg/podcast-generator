// Base expressions that are always low volume
export const lowVolumeExpressions = [
  "Whoa",
  "Awww",
  "Hmm",
  "Huh",
  "Yeah",
  "Ahhh",
  "Mhm",
  "Ugh",
  "Oh",
  "Right",
  "Sure",
  "I see",
];

// Patterns for identifying reactive expressions
const reactivePatterns = [
  // Basic reactions
  /^(ah+|oh+|uh+|hmm+|mhm+|mm+|er+|um+)\b/i,

  // Common acknowledgments
  /^(right|sure|okay|yep|yeah|yes|got it|i see)\b/i,

  // Expressions of surprise/interest
  /^(wow|whoa|cool|nice|great|awesome|amazing)\b/i,

  // Thinking sounds
  /^(hmm+|uhh+|err+|well+)\b/i,

  // Encouragement continuers
  /^(go on|tell me|and then)\b/i,

  // Expressions with ellipsis
  /^\.{3,}/,

  // Emotional reactions
  /^(haha|lol|oh my|gosh|geez)\b/i,
];

export const shouldLowerVolume = (text: string): boolean => {
  // Clean the text of punctuation and extra spaces
  const cleanText = text
    .trim()
    .toLowerCase()
    .replace(/[.,!?]+$/, "");

  // Check if it's exactly one of our expressions
  if (lowVolumeExpressions.includes(cleanText)) return true;

  // Check if it's 1-2 words
  const wordCount = cleanText.split(/\s+/).length;
  if (wordCount <= 2) {
    // Check against reactive patterns
    if (reactivePatterns.some((pattern) => pattern.test(cleanText))) {
      return true;
    }

    // Check for repeated letters indicating emphasis/reaction
    if (/(.)\1{2,}/.test(cleanText)) {
      // e.g., "ohhh", "wowww"
      return true;
    }
  }

  return false;
};
