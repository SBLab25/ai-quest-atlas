import React, { useState, useEffect, useCallback } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { CheckCircle2, Sparkles, Trophy, Check } from 'lucide-react';
import { motion } from 'framer-motion';
import { usePoints } from '@/hooks/usePoints';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { Checkbox } from '@/components/ui/checkbox';

interface Exercise {
  id: string;
  name: string;
  description: string;
  icon: string;
}

const EASY_EXERCISES: Exercise[] = [
  {
    id: '1',
    name: 'Jumping Jacks',
    description: 'Stand straight, jump while spreading legs and raising arms overhead. Do for 30 seconds.',
    icon: '🤸'
  },
  {
    id: '2',
    name: 'Deep Breathing',
    description: 'Take 5 deep breaths in and out slowly. Focus on your breathing rhythm.',
    icon: '🧘'
  },
  {
    id: '3',
    name: 'Arm Circles',
    description: 'Rotate your arms in large circles forward and backward. 10 circles each direction.',
    icon: '💪'
  },
  {
    id: '4',
    name: 'Leg Stretches',
    description: 'Stretch each leg forward, hold for 10 seconds. Repeat 3 times per leg.',
    icon: '🦵'
  },
  {
    id: '5',
    name: 'Neck Rolls',
    description: 'Gently roll your neck in a circular motion. 5 circles clockwise, 5 counter-clockwise.',
    icon: '👤'
  },
  {
    id: '6',
    name: 'Shoulder Shrugs',
    description: 'Lift and lower your shoulders 10 times. Hold for 2 seconds at the top.',
    icon: '🤷'
  },
  {
    id: '7',
    name: 'Side Bends',
    description: 'Bend to each side, stretching your torso. Hold each side for 10 seconds.',
    icon: '🧘‍♀️'
  },
  {
    id: '8',
    name: 'March in Place',
    description: 'March in place for 30 seconds. Lift your knees high and swing your arms.',
    icon: '🚶'
  },
  {
    id: '9',
    name: 'Wall Push-ups',
    description: 'Do 10 push-ups against a wall. Keep your body straight and core engaged.',
    icon: '💪'
  },
  {
    id: '10',
    name: 'Toe Touches',
    description: 'Bend forward and try to touch your toes. Hold for 10 seconds, repeat 3 times.',
    icon: '🤸‍♀️'
  }
];

interface DailyExercisePopupProps {
  open: boolean;
  onClose: () => void;
  onComplete: () => void;
}

export const DailyExercisePopup: React.FC<DailyExercisePopupProps> = ({ open, onClose, onComplete }) => {
  const [selectedExercises, setSelectedExercises] = useState<Exercise[]>([]);
  const [completedExercises, setCompletedExercises] = useState<Set<string>>(new Set());
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { addExerciseQuotaPoints } = usePoints();
  const { toast } = useToast();
  const { user } = useAuth();

  // Select 3 random exercises on mount
  useEffect(() => {
    if (open && selectedExercises.length === 0) {
      const shuffled = [...EASY_EXERCISES].sort(() => Math.random() - 0.5);
      setSelectedExercises(shuffled.slice(0, 3));
      setCompletedExercises(new Set());
    }
  }, [open, selectedExercises.length]);

  const handleToggleExercise = (exerciseId: string) => {
    setCompletedExercises((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(exerciseId)) {
        newSet.delete(exerciseId);
      } else {
        newSet.add(exerciseId);
      }
      return newSet;
    });
  };

  const handleSubmitCompletion = useCallback(async () => {
    // Check if all exercises are completed
    if (completedExercises.size !== selectedExercises.length) {
      toast({
        title: 'Incomplete',
        description: 'Please mark all 3 exercises as completed before submitting.',
        variant: 'destructive',
      });
      return;
    }

    setIsSubmitting(true);

    try {
      // Award exercise quota points
      addExerciseQuotaPoints();

      // Save completion to database
      if (user) {
        const today = new Date().toISOString().split('T')[0];
        const { error } = await supabase
          .from('daily_exercises')
          .upsert({
            user_id: user.id,
            date: today,
            exercises_completed: Array.from(completedExercises),
            completed_at: new Date().toISOString()
          }, {
            onConflict: 'user_id,date'
          });

        if (error) {
          console.error('Error saving exercise completion:', error);
          throw error;
        }
      }

      toast({
        title: '🎉 Exercises Completed!',
        description: 'You\'ve earned your daily exercise quota points!',
      });

      onComplete();
      onClose();
    } catch (error) {
      console.error('Error completing exercises:', error);
      toast({
        title: 'Error',
        description: 'Failed to save exercise completion. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setIsSubmitting(false);
    }
  }, [user, selectedExercises.length, completedExercises, addExerciseQuotaPoints, toast, onComplete, onClose]);

  const progress = selectedExercises.length > 0 
    ? (completedExercises.size / selectedExercises.length) * 100 
    : 0;
  const allCompleted = completedExercises.size === selectedExercises.length && selectedExercises.length > 0;

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-2xl flex items-center gap-2">
            <Sparkles className="h-6 w-6 text-yellow-500" />
            Daily Exercise Challenge
          </DialogTitle>
          <DialogDescription>
            Read through each exercise, complete them, and mark them as done to earn your daily exercise quota points!
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 mt-4">
          {/* Progress Bar */}
          <div className="space-y-2">
            <div className="flex justify-between items-center">
              <span className="text-sm font-medium">Progress</span>
              <span className="text-sm text-muted-foreground">
                {completedExercises.size} / {selectedExercises.length} completed
              </span>
            </div>
            <Progress value={progress} className="h-3" />
          </div>

          {/* Exercise List with Checkboxes */}
          <div className="space-y-4">
            {selectedExercises.map((exercise, index) => {
              const isCompleted = completedExercises.has(exercise.id);
              
              return (
                <motion.div
                  key={exercise.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.1 }}
                >
                  <Card className={`transition-all cursor-pointer ${
                    isCompleted 
                      ? 'bg-green-500/10 border-green-500/30 hover:border-green-500/50' 
                      : 'hover:border-primary/50 hover:bg-primary/5'
                  }`}
                  onClick={() => handleToggleExercise(exercise.id)}
                  >
                    <CardContent className="p-6">
                      <div className="flex items-start gap-4">
                        <div className="mt-1">
                          <Checkbox
                            checked={isCompleted}
                            onCheckedChange={() => handleToggleExercise(exercise.id)}
                            className="h-5 w-5"
                            onClick={(e) => e.stopPropagation()}
                          />
                        </div>
                        <div className="flex-1">
                          <div className="flex items-center gap-3 mb-2">
                            <span className="text-3xl">{exercise.icon}</span>
                            <CardTitle className="text-lg font-semibold">
                              {exercise.name}
                            </CardTitle>
                            {isCompleted && (
                              <CheckCircle2 className="h-5 w-5 text-green-500 flex-shrink-0" />
                            )}
                          </div>
                          <CardDescription className="text-sm mt-2">
                            {exercise.description}
                          </CardDescription>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>
              );
            })}
          </div>

          {/* Submit Button */}
          <div className="flex flex-col items-center gap-4 pt-4">
            {allCompleted ? (
              <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                className="w-full space-y-4"
              >
                <div className="text-center">
                  <div className="text-5xl mb-3">🎉</div>
                  <h3 className="text-xl font-bold mb-1">All Exercises Completed!</h3>
                  <p className="text-sm text-muted-foreground">
                    Ready to claim your daily exercise quota points?
                  </p>
                </div>
                <Button
                  onClick={handleSubmitCompletion}
                  disabled={isSubmitting}
                  className="w-full bg-gradient-to-r from-primary to-purple-600 hover:from-primary/90 hover:to-purple-600/90"
                  size="lg"
                >
                  {isSubmitting ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                      Submitting...
                    </>
                  ) : (
                    <>
                      <Trophy className="h-5 w-5 mr-2" />
                      Claim Points (+5)
                    </>
                  )}
                </Button>
              </motion.div>
            ) : (
              <div className="text-center text-sm text-muted-foreground">
                Complete all exercises above to claim your points
              </div>
            )}
          </div>

          {/* Close Button */}
          <div className="flex justify-end pt-2">
            <Button variant="ghost" onClick={onClose}>
              Maybe Later
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};
