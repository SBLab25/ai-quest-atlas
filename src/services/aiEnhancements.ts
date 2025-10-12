import { supabase } from "@/integrations/supabase/client";

// ============================================
// AI PHOTO VERIFICATION SERVICE
// ============================================
export interface VerificationRequest {
  submissionId: string;
  photoUrl: string;
  questTitle: string;
  questDescription: string;
  questLocation: string;
  questLatitude?: number;
  questLongitude?: number;
  userLatitude?: number;
  userLongitude?: number;
}

export interface VerificationResult {
  id: string;
  quest_match_score: number;
  geolocation_match_score: number;
  authenticity_score: number;
  scene_relevance_score: number;
  final_confidence: number;
  verdict: 'verified' | 'uncertain' | 'rejected';
  reason: string;
  execution_time_ms?: number;
}

export const verifyPhotoProof = async (
  request: VerificationRequest,
  onProgress?: (message: string, progress: number) => void
): Promise<VerificationResult> => {
  try {
    onProgress?.('Starting AI verification...', 20);
    
    const { data, error } = await supabase.functions.invoke('ai-photo-verification', {
      body: request,
    });

    if (error) throw new Error(error.message);
    if (!data?.success || !data?.verification) {
      throw new Error('Invalid verification response');
    }

    onProgress?.('Verification complete!', 100);
    return data.verification;
  } catch (error: any) {
    console.error('Photo verification failed:', error);
    throw error;
  }
};

// ============================================
// AI CONTENT MODERATION SERVICE
// ============================================
export interface ModerationRequest {
  content: string;
  contentType: 'post' | 'comment' | 'description';
  userId: string;
}

export interface ModerationResult {
  isAllowed: boolean;
  flagged: boolean;
  categories: string[];
  confidence: number;
  reason?: string;
}

export const moderateContent = async (
  request: ModerationRequest
): Promise<ModerationResult> => {
  try {
    const { data, error } = await supabase.functions.invoke('ai-content-moderation', {
      body: request,
    });

    if (error) throw new Error(error.message);
    return data;
  } catch (error: any) {
    console.error('Content moderation failed:', error);
    // Fail open - allow content if moderation fails
    return {
      isAllowed: true,
      flagged: false,
      categories: [],
      confidence: 0,
      reason: 'Moderation service unavailable',
    };
  }
};

// ============================================
// NATURAL LANGUAGE QUEST SEARCH SERVICE
// ============================================
export interface NLSearchRequest {
  query: string;
  userId: string;
  location?: { lat: number; lng: number };
}

export interface NLSearchResult {
  quests: any[];
  interpretation: string;
  confidence: number;
}

export const searchQuestsNLP = async (
  request: NLSearchRequest
): Promise<NLSearchResult> => {
  try {
    const { data, error } = await supabase.functions.invoke('ai-quest-search', {
      body: request,
    });

    if (error) throw new Error(error.message);
    return data;
  } catch (error: any) {
    console.error('NLP search failed:', error);
    throw error;
  }
};

// ============================================
// AI QUEST IMAGE GENERATION SERVICE
// ============================================
export interface ImageGenerationRequest {
  questTitle: string;
  questDescription: string;
  questType: string;
  questId: string;
}

export interface ImageGenerationResult {
  imageUrl: string;
  storagePath: string;
}

export const generateQuestImage = async (
  request: ImageGenerationRequest,
  onProgress?: (message: string) => void
): Promise<ImageGenerationResult> => {
  try {
    onProgress?.('✨ AI creating your quest image...');
    
    const { data, error } = await supabase.functions.invoke('ai-generate-quest-image', {
      body: request,
    });

    if (error) throw new Error(error.message);
    
    onProgress?.('✅ Image generated successfully!');
    return data;
  } catch (error: any) {
    console.error('Image generation failed:', error);
    throw error;
  }
};

// ============================================
// AI QUEST SUGGESTIONS SERVICE (Enhanced)
// ============================================
export interface QuestSuggestion {
  title: string;
  description: string;
  difficulty: number;
  estimatedDuration: string;
  category: string;
  location: string;
}

export const generateQuestSuggestions = async (
  userId: string,
  location?: { lat: number; lng: number }
): Promise<QuestSuggestion[]> => {
  try {
    const { data, error } = await supabase.functions.invoke('generate-quest-suggestions', {
      body: { userId, location },
    });

    if (error) throw new Error(error.message);
    return data.suggestions || [];
  } catch (error: any) {
    console.error('Quest suggestion generation failed:', error);
    return [];
  }
};

// ============================================
// UTILITY FUNCTIONS
// ============================================
export const getConfidenceLabel = (confidence: number): string => {
  if (confidence >= 0.85) return 'High Confidence';
  if (confidence >= 0.60) return 'Medium Confidence';
  return 'Low Confidence';
};

export const getVerdictColor = (verdict: 'verified' | 'uncertain' | 'rejected'): string => {
  switch (verdict) {
    case 'verified':
      return 'bg-green-500/10 text-green-500 border-green-500/20';
    case 'uncertain':
      return 'bg-yellow-500/10 text-yellow-500 border-yellow-500/20';
    case 'rejected':
      return 'bg-red-500/10 text-red-500 border-red-500/20';
    default:
      return 'bg-muted text-muted-foreground';
  }
};

export const getVerdictIcon = (verdict: 'verified' | 'uncertain' | 'rejected'): string => {
  switch (verdict) {
    case 'verified':
      return '✅';
    case 'uncertain':
      return '⚠️';
    case 'rejected':
      return '❌';
    default:
      return '🔍';
  }
};
