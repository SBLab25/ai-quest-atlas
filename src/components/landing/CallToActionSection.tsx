import React from 'react'
import { motion } from 'framer-motion'
import { Button } from '@/components/ui/button'
import { Compass, Sparkles } from 'lucide-react'

interface CallToActionSectionProps {
  onJoinAdventure: () => void
}

const CallToActionSection: React.FC<CallToActionSectionProps> = ({ onJoinAdventure }) => {
  return (
    <section className="py-20 relative overflow-hidden">
      {/* Epic Background */}
      <div className="absolute inset-0">
        <div className="absolute inset-0 bg-gradient-to-br from-primary/20 via-background to-secondary/20" />
        
        {/* Animated Explorer Silhouette */}
        <motion.div
          animate={{
            y: [0, -10, 0],
            x: [0, 5, 0]
          }}
          transition={{
            duration: 4,
            repeat: Infinity,
            ease: "easeInOut"
          }}
          className="absolute right-10 bottom-10 opacity-20"
        >
          <div className="w-32 h-32 relative">
            {/* Explorer figure looking at atlas */}
            <div className="w-20 h-20 bg-foreground/30 rounded-full relative">
              <div className="absolute -top-2 -right-2 w-8 h-10 bg-foreground/20 rounded" />
              <div className="absolute top-4 right-10 w-12 h-8 bg-foreground/25 rounded-lg" />
            </div>
          </div>
        </motion.div>

        {/* Glowing Particles */}
        {[...Array(25)].map((_, i) => (
          <motion.div
            key={i}
            animate={{
              y: [0, -20, 0],
              x: [0, 10, -5, 0],
              opacity: [0.2, 0.8, 0.2],
              scale: [0.5, 1.2, 0.5]
            }}
            transition={{
              duration: 5 + i * 0.3,
              repeat: Infinity,
              delay: i * 0.2
            }}
            className="absolute w-2 h-2 bg-primary rounded-full"
            style={{
              left: `${Math.random() * 100}%`,
              top: `${Math.random() * 100}%`,
              filter: 'blur(0.5px)'
            }}
          />
        ))}

        {/* Digital Atlas Glow */}
        <motion.div
          animate={{
            opacity: [0.3, 0.7, 0.3],
            scale: [1, 1.1, 1]
          }}
          transition={{
            duration: 3,
            repeat: Infinity
          }}
          className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-gradient-radial from-primary/20 to-transparent rounded-full blur-3xl"
        />
      </div>

      <div className="container mx-auto px-4 relative z-10">
        <div className="max-w-4xl mx-auto text-center">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            className="mb-8"
          >
            {/* Floating Icon */}
            <motion.div
              animate={{
                y: [0, -10, 0],
                rotate: [0, 5, -5, 0]
              }}
              transition={{
                duration: 4,
                repeat: Infinity,
                ease: "easeInOut"
              }}
              className="inline-block mb-6"
            >
              <div className="w-20 h-20 bg-primary/10 backdrop-blur-sm rounded-full flex items-center justify-center border border-primary/20">
                <Compass className="w-10 h-10 text-primary" />
              </div>
            </motion.div>

            {/* Main Headline */}
            <motion.h2
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.2, duration: 0.6 }}
              className="text-4xl md:text-6xl font-bold text-foreground mb-6 leading-tight"
            >
              Ready to Begin Your{' '}
              <span className="bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">
                Journey?
              </span>
            </motion.h2>

            {/* Subtitle */}
            <motion.p
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.4, duration: 0.6 }}
              className="text-xl md:text-2xl text-muted-foreground mb-12 leading-relaxed"
            >
              Join thousands of explorers discovering extraordinary places and earning digital rewards for their adventures
            </motion.p>

            {/* CTA Button */}
            <motion.div
              initial={{ opacity: 0, scale: 0.8 }}
              whileInView={{ opacity: 1, scale: 1 }}
              viewport={{ once: true }}
              transition={{ delay: 0.6, duration: 0.6 }}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              <Button
                size="lg"
                onClick={onJoinAdventure}
                className="relative overflow-hidden bg-primary hover:bg-primary/90 text-primary-foreground text-xl px-12 py-8 rounded-full group transition-all duration-300 shadow-xl hover:shadow-2xl"
              >
                {/* Animated Background */}
                <motion.div
                  animate={{
                    x: ['-100%', '100%']
                  }}
                  transition={{
                    duration: 2,
                    repeat: Infinity,
                    ease: "linear"
                  }}
                  className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent skew-x-12"
                />
                
                <span className="relative z-10 font-semibold">Join the Adventure</span>
                
                <motion.div
                  animate={{ rotate: 360 }}
                  transition={{ duration: 3, repeat: Infinity, ease: "linear" }}
                  className="relative z-10 ml-3"
                >
                  <Sparkles className="w-6 h-6" />
                </motion.div>
              </Button>
            </motion.div>

            {/* Trust Indicators */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.8, duration: 0.6 }}
              className="mt-12 flex flex-col md:flex-row items-center justify-center gap-6 text-sm text-muted-foreground"
            >
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
                <span>15,000+ Active Explorers</span>
              </div>
              <div className="hidden md:block w-px h-4 bg-border" />
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 bg-blue-500 rounded-full animate-pulse" />
                <span>50+ Countries Supported</span>
              </div>
              <div className="hidden md:block w-px h-4 bg-border" />
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 bg-purple-500 rounded-full animate-pulse" />
                <span>AI-Powered Discovery Engine</span>
              </div>
            </motion.div>
          </motion.div>
        </div>
      </div>
    </section>
  )
}

export default CallToActionSection