import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { X, ChevronRight, ChevronLeft } from 'lucide-react';
import { useOnboarding } from '@/hooks/useOnboarding';
import { cn } from '@/lib/utils';

export const OnboardingTutorial = () => {
  const { isActive, currentStep, steps, nextStep, skipOnboarding, currentStepData } = useOnboarding();
  const [targetElement, setTargetElement] = useState<HTMLElement | null>(null);

  useEffect(() => {
    if (isActive && currentStepData?.target) {
      const element = document.querySelector(currentStepData.target) as HTMLElement;
      setTargetElement(element);
      
      // Scroll element into view
      if (element) {
        element.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }
    } else {
      setTargetElement(null);
    }
  }, [isActive, currentStepData]);

  if (!isActive) return null;

  const progress = ((currentStep + 1) / steps.length) * 100;

  return (
    <>
      {/* Overlay */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 bg-background/80 backdrop-blur-sm z-[100]"
        onClick={skipOnboarding}
        aria-hidden="true"
      />

      {/* Highlight target element */}
      {targetElement && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="fixed z-[101] pointer-events-none"
          style={{
            top: targetElement.getBoundingClientRect().top - 8,
            left: targetElement.getBoundingClientRect().left - 8,
            width: targetElement.getBoundingClientRect().width + 16,
            height: targetElement.getBoundingClientRect().height + 16,
          }}
        >
          <div className="w-full h-full rounded-lg border-4 border-primary shadow-[0_0_0_9999px_rgba(0,0,0,0.5)]" />
        </motion.div>
      )}

      {/* Tutorial Card */}
      <AnimatePresence mode="wait">
        <motion.div
          key={currentStep}
          initial={{ opacity: 0, scale: 0.9, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.9, y: -20 }}
          transition={{ duration: 0.3 }}
          className={cn(
            "fixed z-[102]",
            targetElement ? "top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2" : "top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2"
          )}
        >
          <Card className="w-[90vw] max-w-md p-6 shadow-2xl" role="dialog" aria-labelledby="onboarding-title">
            {/* Header */}
            <div className="flex items-start justify-between mb-4">
              <div className="flex-1">
                <h2 id="onboarding-title" className="text-2xl font-bold mb-2">
                  {currentStepData.title}
                </h2>
                <p className="text-muted-foreground">
                  {currentStepData.description}
                </p>
              </div>
              <Button
                variant="ghost"
                size="icon"
                onClick={skipOnboarding}
                className="ml-2"
                aria-label="Close tutorial"
              >
                <X className="h-4 w-4" />
              </Button>
            </div>

            {/* Progress Bar */}
            <div className="mb-6">
              <div className="flex justify-between text-sm text-muted-foreground mb-2">
                <span>Step {currentStep + 1} of {steps.length}</span>
                <span>{Math.round(progress)}%</span>
              </div>
              <div className="w-full h-2 bg-muted rounded-full overflow-hidden">
                <motion.div
                  className="h-full bg-primary"
                  initial={{ width: 0 }}
                  animate={{ width: `${progress}%` }}
                  transition={{ duration: 0.3 }}
                />
              </div>
            </div>

            {/* Actions */}
            <div className="flex gap-3">
              {currentStep > 0 && (
                <Button
                  variant="outline"
                  onClick={() => {}}
                  className="flex-1"
                  aria-label="Previous step"
                >
                  <ChevronLeft className="h-4 w-4 mr-2" />
                  Back
                </Button>
              )}
              <Button
                onClick={nextStep}
                className="flex-1"
                aria-label={currentStepData.action || 'Next step'}
              >
                {currentStepData.action || 'Next'}
                {currentStep < steps.length - 1 && <ChevronRight className="h-4 w-4 ml-2" />}
              </Button>
            </div>

            {/* Skip Link */}
            <button
              onClick={skipOnboarding}
              className="w-full mt-3 text-sm text-muted-foreground hover:text-foreground transition-colors"
              aria-label="Skip tutorial"
            >
              Skip tutorial
            </button>
          </Card>
        </motion.div>
      </AnimatePresence>
    </>
  );
};
