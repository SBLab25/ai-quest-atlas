import React, { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { Card } from '@/components/ui/card'

const stats = [
  { label: "Active Explorers", value: 15420, suffix: "+" },
  { label: "Quests Completed", value: 87350, suffix: "+" },
  { label: "Countries Explored", value: 142, suffix: "" },
  { label: "Discoveries Shared", value: 234890, suffix: "+" }
]

const CountUp: React.FC<{ end: number; duration?: number }> = ({ end, duration = 2 }) => {
  const [count, setCount] = useState(0)

  useEffect(() => {
    let startTime: number
    let animationId: number

    const animate = (timestamp: number) => {
      if (!startTime) startTime = timestamp
      const progress = Math.min((timestamp - startTime) / (duration * 1000), 1)
      
      setCount(Math.floor(progress * end))
      
      if (progress < 1) {
        animationId = requestAnimationFrame(animate)
      }
    }

    animationId = requestAnimationFrame(animate)
    return () => cancelAnimationFrame(animationId)
  }, [end, duration])

  return <span>{count.toLocaleString()}</span>
}

const CommunitySection: React.FC = () => {
  return (
    <section className="py-20 relative overflow-hidden">
      {/* Background */}
      <div className="absolute inset-0">
        <div className="absolute inset-0 bg-gradient-to-b from-muted/20 via-background to-muted/20" />
        
        {/* World Map Dots */}
        <div className="absolute inset-0 opacity-10">
          {[...Array(50)].map((_, i) => (
            <motion.div
              key={i}
              animate={{
                scale: [1, 1.5, 1],
                opacity: [0.3, 0.8, 0.3]
              }}
              transition={{
                duration: 3 + Math.random() * 2,
                repeat: Infinity,
                delay: Math.random() * 2
              }}
              className="absolute w-2 h-2 bg-primary rounded-full"
              style={{
                left: `${10 + Math.random() * 80}%`,
                top: `${20 + Math.random() * 60}%`
              }}
            />
          ))}
        </div>

        {/* Connection Lines */}
        <svg className="absolute inset-0 w-full h-full opacity-5">
          {[...Array(8)].map((_, i) => {
            const startX = Math.random() * 100
            const startY = Math.random() * 100
            const endX = Math.random() * 100  
            const endY = Math.random() * 100
            
            return (
              <motion.line
                key={i}
                x1={`${startX}%`}
                y1={`${startY}%`}
                x2={`${endX}%`}
                y2={`${endY}%`}
                stroke="hsl(var(--primary))"
                strokeWidth="1"
                initial={{ pathLength: 0, opacity: 0 }}
                animate={{ pathLength: 1, opacity: 0.5 }}
                transition={{ 
                  duration: 4,
                  delay: i * 0.5,
                  repeat: Infinity,
                  repeatType: 'reverse'
                }}
              />
            )
          })}
        </svg>
      </div>

      <div className="container mx-auto px-4 relative z-10">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="text-center mb-16"
        >
          <h2 className="text-4xl md:text-5xl font-bold text-foreground mb-4">
            Global Community Impact
          </h2>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
            Join thousands of explorers discovering and sharing amazing places worldwide
          </p>
        </motion.div>

        {/* Interactive World Map Visualization */}
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          whileInView={{ opacity: 1, scale: 1 }}
          viewport={{ once: true }}
          transition={{ duration: 0.8 }}
          className="mb-16"
        >
          <Card className="relative overflow-hidden bg-card/30 backdrop-blur-sm border-border/50 p-8">
            <div className="relative h-64 md:h-80">
              {/* Simplified World Map */}
              <div className="absolute inset-0 flex items-center justify-center">
                <svg viewBox="0 0 800 400" className="w-full h-full opacity-20">
                  <path
                    d="M100,200 Q200,150 300,200 T500,200 Q600,180 700,200"
                    stroke="hsl(var(--foreground))"
                    strokeWidth="2"
                    fill="none"
                  />
                  <path
                    d="M150,250 Q250,220 350,240 T550,240 Q650,230 720,250"
                    stroke="hsl(var(--foreground))"
                    strokeWidth="2"
                    fill="none"
                  />
                </svg>
              </div>

              {/* Quest Markers */}
              {[...Array(12)].map((_, i) => (
                <motion.div
                  key={i}
                  initial={{ scale: 0, opacity: 0 }}
                  whileInView={{ scale: 1, opacity: 1 }}
                  viewport={{ once: true }}
                  transition={{ delay: i * 0.1, duration: 0.5 }}
                  animate={{
                    y: [0, -5, 0],
                    transition: { duration: 2, repeat: Infinity, delay: i * 0.2 }
                  }}
                  className="absolute w-4 h-4 bg-primary rounded-full cursor-pointer hover:scale-125 transition-transform"
                  style={{
                    left: `${15 + Math.random() * 70}%`,
                    top: `${25 + Math.random() * 50}%`
                  }}
                />
              ))}

              <div className="absolute inset-0 flex items-center justify-center">
                <motion.div
                  animate={{ rotate: 360 }}
                  transition={{ duration: 60, repeat: Infinity, ease: "linear" }}
                  className="text-4xl opacity-50"
                >
                  🌍
                </motion.div>
              </div>
            </div>
          </Card>
        </motion.div>

        {/* Stats Grid */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
          {stats.map((stat, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-100px" }}
              transition={{ delay: index * 0.1, duration: 0.6 }}
              whileHover={{ y: -5 }}
            >
              <Card className="text-center p-6 bg-card/50 backdrop-blur-sm border-border/50 hover:bg-card/70 transition-all duration-300">
                <motion.div
                  className="text-3xl md:text-4xl font-bold text-primary mb-2"
                >
                  <CountUp end={stat.value} />
                  {stat.suffix}
                </motion.div>
                <div className="text-sm md:text-base text-muted-foreground font-medium">
                  {stat.label}
                </div>
              </Card>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  )
}

export default CommunitySection