import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { CheckCircle2, Loader2 } from 'lucide-react';

interface VerificationStep {
  label: string;
  completed: boolean;
  active: boolean;
}

interface VerificationProgressProps {
  currentStep: number;
  progress: number;
  message: string;
}

export const VerificationProgress: React.FC<VerificationProgressProps> = ({
  currentStep,
  progress,
  message,
}) => {
  const steps: VerificationStep[] = [
    { label: 'Checking context', completed: currentStep > 0, active: currentStep === 0 },
    { label: 'Validating geolocation', completed: currentStep > 1, active: currentStep === 1 },
    { label: 'Detecting fakes', completed: currentStep > 2, active: currentStep === 2 },
    { label: 'Computing confidence', completed: currentStep > 3, active: currentStep === 3 },
  ];

  return (
    <Card className="border-primary/20 bg-card/50 backdrop-blur">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-lg">
          <Loader2 className="h-5 w-5 animate-spin text-primary" />
          AI Photo Verification
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Progress Bar */}
        <div className="space-y-2">
          <div className="flex items-center justify-between text-sm">
            <span className="text-muted-foreground">{message}</span>
            <span className="font-medium text-primary">{progress}%</span>
          </div>
          <Progress value={progress} className="h-2" />
        </div>

        {/* Step Indicators */}
        <div className="space-y-3">
          {steps.map((step, index) => (
            <div
              key={index}
              className={`flex items-center gap-3 transition-all duration-300 ${
                step.active ? 'scale-105' : ''
              }`}
            >
              <div className="flex-shrink-0">
                {step.completed ? (
                  <CheckCircle2 className="h-5 w-5 text-green-500" />
                ) : step.active ? (
                  <div className="h-5 w-5 rounded-full border-2 border-primary bg-primary/20 animate-pulse" />
                ) : (
                  <div className="h-5 w-5 rounded-full border-2 border-muted" />
                )}
              </div>
              <span
                className={`text-sm transition-colors ${
                  step.completed
                    ? 'text-green-500 font-medium'
                    : step.active
                    ? 'text-primary font-medium'
                    : 'text-muted-foreground'
                }`}
              >
                {step.label}
                {step.completed && ' ✅'}
              </span>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
};
