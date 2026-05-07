/**
 * Robustly extracts and parses JSON from a string that might contain
 * conversational chatter, markdown blocks, or other non-JSON text.
 */
export function parseRobustJson(text: string): any {
  if (!text) throw new Error('Empty response from LLM');

  // Remove markdown blocks if present (the lazy way)
  let cleaned = text.replace(/```json/g, '').replace(/```/g, '').trim();

  try {
    return JSON.parse(cleaned);
  } catch (initialError) {
    // If simple parse fails, try to find the JSON structure using boundaries
    const firstBrace = cleaned.indexOf('{');
    const firstBracket = cleaned.indexOf('[');
    
    let startIdx = -1;
    let endChar = '';

    if (firstBrace !== -1 && (firstBracket === -1 || firstBrace < firstBracket)) {
      startIdx = firstBrace;
      endChar = '}';
    } else if (firstBracket !== -1) {
      startIdx = firstBracket;
      endChar = ']';
    }

    if (startIdx === -1) {
      throw new Error(`Could not find JSON start ({ or [). Content: ${text.substring(0, 100)}...`);
    }

    const lastIdx = cleaned.lastIndexOf(endChar);
    if (lastIdx === -1 || lastIdx < startIdx) {
      throw new Error(`Could not find JSON end (${endChar}). Content: ${text.substring(0, 100)}...`);
    }

    const jsonCandidate = cleaned.substring(startIdx, lastIdx + 1);
    
    try {
      return JSON.parse(jsonCandidate);
    } catch (nestedError) {
      throw new Error(`Failed to parse extracted JSON. Error: ${nestedError.message}. Candidate: ${jsonCandidate.substring(0, 100)}...`);
    }
  }
}
