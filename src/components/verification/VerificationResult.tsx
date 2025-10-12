import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Brain, CheckCircle2, AlertTriangle, XCircle } from 'lucide-react';
import { AIPhotoVerificationService, VerificationResult as VerificationData } from '@/services/aiPhotoVerification';

interface VerificationResultProps {
  verification: VerificationData;
  showDetailed?: boolean;
}

export const VerificationResult: React.FC<VerificationResultProps> = ({
  verification,
  showDetailed = true,
}) => {
  const getVerdictIcon = () => {
    switch (verification.verdict) {
      case 'verified':
        return <CheckCircle2 className="h-6 w-6 text-green-500" />;
      case 'uncertain':
        return <AlertTriangle className="h-6 w-6 text-yellow-500" />;
      case 'rejected':
        return <XCircle className="h-6 w-6 text-red-500" />;
    }
  };

  const getVerdictLabel = () => {
    switch (verification.verdict) {
      case 'verified':
        return 'Verified';
      case 'uncertain':
        return 'Uncertain';
      case 'rejected':
        return 'Rejected';
    }
  };

  const confidencePercentage = Math.round(verification.final_confidence * 100);

  return (
    <Card className="border-primary/20 bg-card/50 backdrop-blur">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Brain className="h-5 w-5 text-primary" />
          Verification Results
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Verdict Display */}
        <div className="flex items-center justify-between p-4 rounded-lg border bg-muted/30">
          <div className="flex items-center gap-3">
            {getVerdictIcon()}
            <div>
              <div className="font-semibold text-lg">{getVerdictLabel()}</div>
              <div className="text-sm text-muted-foreground">
                {AIPhotoVerificationService.getConfidenceLabel(verification.final_confidence)}
              </div>
            </div>
          </div>
          <Badge
            className={`${AIPhotoVerificationService.getVerdictColor(
              verification.verdict
            )} border font-semibold`}
          >
            {confidencePercentage}%
          </Badge>
        </div>

        {/* Reason */}
        <div className="space-y-2">
          <div className="text-sm font-medium">Analysis Summary</div>
          <p className="text-sm text-muted-foreground leading-relaxed">
            {verification.reason}
          </p>
        </div>

        {/* AI Verified Badge */}
        {verification.verdict === 'verified' && (
          <div className="flex items-center gap-2 text-sm text-green-500 bg-green-500/10 border border-green-500/20 rounded-lg p-3">
            <Brain className="h-4 w-4" />
            <span className="font-medium">🧠 AI Verified</span>
          </div>
        )}

        {/* Detailed Scores */}
        {showDetailed && (
          <div className="space-y-4 pt-4 border-t">
            <div className="text-sm font-medium mb-3">Detailed Analysis</div>
            
            <div className="space-y-3">
              <ScoreItem
                label="Quest Match"
                score={verification.quest_match_score}
              />
              <ScoreItem
                label="Geolocation Match"
                score={verification.geolocation_match_score}
              />
              <ScoreItem
                label="Authenticity"
                score={verification.authenticity_score}
              />
              <ScoreItem
                label="Scene Relevance"
                score={verification.scene_relevance_score}
              />
            </div>
          </div>
        )}

        {/* Execution Time */}
        {verification.execution_time_ms && (
          <div className="text-xs text-muted-foreground text-center pt-2 border-t">
            Verified in {(verification.execution_time_ms / 1000).toFixed(2)}s
          </div>
        )}
      </CardContent>
    </Card>
  );
};

interface ScoreItemProps {
  label: string;
  score: number;
}

const ScoreItem: React.FC<ScoreItemProps> = ({ label, score }) => {
  const percentage = Math.round(score * 100);
  
  return (
    <div className="space-y-1.5">
      <div className="flex items-center justify-between text-sm">
        <span className="text-muted-foreground">{label}</span>
        <span className="font-medium">{percentage}%</span>
      </div>
      <Progress value={percentage} className="h-1.5" />
    </div>
  );
};
