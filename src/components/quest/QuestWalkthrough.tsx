import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Camera, MapPin, FileText, Sparkles } from 'lucide-react';

interface WalkthroughStep {
  icon: React.ReactNode;
  title: string;
  description: string;
}

const steps: WalkthroughStep[] = [
  {
    icon: <Camera className="h-8 w-8" />,
    title: 'Take a Photo',
    description: 'Capture the moment! Take a clear photo that matches the quest requirements.'
  },
  {
    icon: <MapPin className="h-8 w-8" />,
    title: 'Add Location',
    description: 'Your GPS location is automatically captured to verify you completed the quest at the right place.'
  },
  {
    icon: <FileText className="h-8 w-8" />,
    title: 'Write Description',
    description: 'Share your experience! Tell others about your adventure and what made it special.'
  },
  {
    icon: <Sparkles className="h-8 w-8" />,
    title: 'AI Verification',
    description: 'Our AI will verify your submission automatically. You\'ll get instant feedback and earn rewards!'
  }
];

interface QuestWalkthroughProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export const QuestWalkthrough = ({ open, onOpenChange }: QuestWalkthroughProps) => {
  const [currentStep, setCurrentStep] = useState(0);

  const handleNext = () => {
    if (currentStep < steps.length - 1) {
      setCurrentStep(currentStep + 1);
    } else {
      onOpenChange(false);
      setCurrentStep(0);
    }
  };

  const handleSkip = () => {
    onOpenChange(false);
    setCurrentStep(0);
  };

  if (!open) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center">
        {/* Backdrop */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="absolute inset-0 bg-background/80 backdrop-blur-sm"
          onClick={handleSkip}
        />

        {/* Walkthrough Card */}
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.9 }}
          className="relative z-10"
        >
          <Card className="w-[90vw] max-w-lg p-8">
            <AnimatePresence mode="wait">
              <motion.div
                key={currentStep}
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="space-y-6"
              >
                {/* Icon */}
                <div className="flex justify-center">
                  <div className="p-4 rounded-full bg-primary/10 text-primary">
                    {steps[currentStep].icon}
                  </div>
                </div>

                {/* Content */}
                <div className="text-center space-y-2">
                  <h3 className="text-2xl font-bold">
                    {steps[currentStep].title}
                  </h3>
                  <p className="text-muted-foreground">
                    {steps[currentStep].description}
                  </p>
                </div>

                {/* Progress Dots */}
                <div className="flex justify-center gap-2">
                  {steps.map((_, index) => (
                    <button
                      key={index}
                      onClick={() => setCurrentStep(index)}
                      className={`h-2 rounded-full transition-all ${
                        index === currentStep
                          ? 'w-8 bg-primary'
                          : 'w-2 bg-muted hover:bg-muted-foreground/50'
                      }`}
                      aria-label={`Go to step ${index + 1}`}
                    />
                  ))}
                </div>

                {/* Actions */}
                <div className="flex gap-3">
                  <Button variant="outline" onClick={handleSkip} className="flex-1">
                    Skip
                  </Button>
                  <Button onClick={handleNext} className="flex-1">
                    {currentStep === steps.length - 1 ? 'Get Started' : 'Next'}
                  </Button>
                </div>
              </motion.div>
            </AnimatePresence>
          </Card>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};
