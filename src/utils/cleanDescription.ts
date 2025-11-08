/**
 * Removes AI quest ID metadata and related patterns from submission descriptions
 * @param description - The description text to clean
 * @returns Cleaned description without AI quest ID metadata
 */
export function cleanDescription(description: string | null | undefined): string {
  if (!description) return '';
  
  let cleaned = description;
  
  // Method 1: Use regex to remove [AI_QUEST_ID:...] pattern
  cleaned = cleaned.replace(/\[AI_QUEST_ID:[^\]]+\]/gi, '');
  
  // Method 2: Also handle cases with optional whitespace around the brackets
  cleaned = cleaned.replace(/\s*\[AI_QUEST_ID:[^\]]+\]\s*/gi, ' ');
  
  // Method 3: Fallback - find and remove using indexOf as a safety net
  const aiQuestIdIndex = cleaned.indexOf('[AI_QUEST_ID:');
  if (aiQuestIdIndex !== -1) {
    const closingBracketIndex = cleaned.indexOf(']', aiQuestIdIndex);
    if (closingBracketIndex !== -1) {
      cleaned = (
        cleaned.substring(0, aiQuestIdIndex).trim() + 
        ' ' + 
        cleaned.substring(closingBracketIndex + 1).trim()
      ).trim();
    }
  }
  
  // Remove "AI Quest id" or "AI Quest ID" patterns (case insensitive)
  cleaned = cleaned.replace(/AI\s+Quest\s+id:?\s*[a-fA-F0-9-]*/gi, '').trim();
  // Remove "Quest id:" patterns
  cleaned = cleaned.replace(/Quest\s+id:?\s*[a-fA-F0-9-]+/gi, '').trim();
  // Remove "Quest id [uuid]" patterns
  cleaned = cleaned.replace(/Quest\s+id\s+[a-fA-F0-9-]+/gi, '').trim();
  // Remove any remaining "AI Quest id" text
  cleaned = cleaned.replace(/AI\s+Quest\s*id/gi, '').trim();
  
  // Clean up any double spaces or newlines
  cleaned = cleaned.replace(/\s+/g, ' ').trim();
  
  return cleaned;
}

