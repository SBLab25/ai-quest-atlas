import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Card } from '@/components/ui/card';
import { Star, Sparkles } from 'lucide-react';

interface LevelUpAnimationProps {
  level: number;
  onClose: () => void;
}

export const LevelUpAnimation = ({ level, onClose }: LevelUpAnimationProps) => {
  const [show, setShow] = useState(true);

  useEffect(() => {
    const timer = setTimeout(() => {
      setShow(false);
      setTimeout(onClose, 500);
    }, 3000);

    return () => clearTimeout(timer);
  }, [onClose]);

  return (
    <AnimatePresence>
      {show && (
        <motion.div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
        >
          <motion.div
            initial={{ scale: 0, rotate: -180 }}
            animate={{ scale: 1, rotate: 0 }}
            exit={{ scale: 0, rotate: 180 }}
            transition={{ type: "spring", duration: 0.6 }}
          >
            <Card className="p-8 bg-gradient-to-br from-primary/20 via-primary/10 to-background border-primary/30 shadow-2xl">
              <div className="text-center space-y-4">
                <motion.div
                  animate={{
                    scale: [1, 1.2, 1],
                    rotate: [0, 360, 0],
                  }}
                  transition={{
                    duration: 2,
                    repeat: Infinity,
                    ease: "easeInOut"
                  }}
                  className="inline-block"
                >
                  <Star className="h-20 w-20 text-primary fill-primary" />
                </motion.div>

                <div>
                  <h2 className="text-4xl font-bold mb-2">Level Up!</h2>
                  <p className="text-6xl font-bold text-primary">{level}</p>
                </div>

                <div className="flex gap-2 justify-center">
                  {[...Array(5)].map((_, i) => (
                    <motion.div
                      key={i}
                      initial={{ y: 0, opacity: 0 }}
                      animate={{
                        y: [-20, -40, -20],
                        opacity: [0, 1, 0],
                      }}
                      transition={{
                        duration: 1.5,
                        repeat: Infinity,
                        delay: i * 0.2,
                      }}
                    >
                      <Sparkles className="h-6 w-6 text-primary" />
                    </motion.div>
                  ))}
                </div>

                <p className="text-muted-foreground">
                  You've reached level {level}!
                </p>
              </div>
            </Card>
          </motion.div>

          {/* Confetti particles */}
          {[...Array(20)].map((_, i) => (
            <motion.div
              key={i}
              className="absolute w-2 h-2 bg-primary rounded-full"
              initial={{
                x: "50vw",
                y: "50vh",
                scale: 0,
              }}
              animate={{
                x: `${Math.random() * 100}vw`,
                y: `${Math.random() * 100}vh`,
                scale: [0, 1, 0],
              }}
              transition={{
                duration: 2,
                delay: i * 0.1,
                ease: "easeOut",
              }}
            />
          ))}
        </motion.div>
      )}
    </AnimatePresence>
  );
};
