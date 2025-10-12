import { supabase } from "@/integrations/supabase/client";

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

export interface VerificationStatus {
  step: 'checking_context' | 'validating_location' | 'detecting_fakes' | 'computing_confidence' | 'complete';
  message: string;
  progress: number;
}

export class AIPhotoVerificationService {
  private static readonly VERIFICATION_STEPS: VerificationStatus[] = [
    { step: 'checking_context', message: 'Analyzing photo authenticity...', progress: 25 },
    { step: 'validating_location', message: 'Validating geolocation...', progress: 50 },
    { step: 'detecting_fakes', message: 'Detecting synthetic images...', progress: 75 },
    { step: 'computing_confidence', message: 'Computing confidence score...', progress: 90 },
    { step: 'complete', message: 'Verification complete!', progress: 100 },
  ];

  /**
   * Submit a photo for AI verification
   */
  static async verifyPhoto(
    request: VerificationRequest,
    onProgress?: (status: VerificationStatus) => void
  ): Promise<VerificationResult> {
    try {
      // Simulate progressive status updates
      if (onProgress) {
        for (let i = 0; i < this.VERIFICATION_STEPS.length - 1; i++) {
          onProgress(this.VERIFICATION_STEPS[i]);
          await new Promise(resolve => setTimeout(resolve, 800));
        }
      }

      // Call the Edge Function
      const { data, error } = await supabase.functions.invoke('ai-photo-verification', {
        body: request,
      });

      if (error) {
        console.error('Verification error:', error);
        throw new Error(error.message || 'Failed to verify photo');
      }

      if (!data?.success || !data?.verification) {
        throw new Error('Invalid verification response');
      }

      // Final progress update
      if (onProgress) {
        onProgress(this.VERIFICATION_STEPS[this.VERIFICATION_STEPS.length - 1]);
      }

      return data.verification;
    } catch (error: any) {
      console.error('Photo verification failed:', error);
      throw error;
    }
  }

  /**
   * Fetch verification result for a submission
   */
  static async getVerificationResult(submissionId: string): Promise<VerificationResult | null> {
    try {
      const { data, error } = await supabase
        .from('ai_verifications' as any)
        .select('*')
        .eq('submission_id', submissionId)
        .maybeSingle();

      if (error) {
        console.error('Error fetching verification:', error);
        return null;
      }

      return data as any;
    } catch (error) {
      console.error('Failed to fetch verification result:', error);
      return null;
    }
  }

  /**
   * Get confidence level label
   */
  static getConfidenceLabel(confidence: number): string {
    if (confidence >= 0.85) return 'High Confidence';
    if (confidence >= 0.60) return 'Medium Confidence';
    return 'Low Confidence';
  }

  /**
   * Get verdict badge color
   */
  static getVerdictColor(verdict: 'verified' | 'uncertain' | 'rejected'): string {
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
  }

  /**
   * Get verdict icon
   */
  static getVerdictIcon(verdict: 'verified' | 'uncertain' | 'rejected'): string {
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
  }
}
