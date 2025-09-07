import React, { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Card } from '@/components/ui/card'
import { ChevronLeft, ChevronRight, Star } from 'lucide-react'
import { Button } from '@/components/ui/button'

const testimonials = [
  {
    id: 1,
    name: "Sarah Chen",
    role: "Urban Explorer",
    avatar: "/api/placeholder/64/64",
    quote: "Discovery Atlas turned my daily walks into epic adventures. I've found hidden murals and secret gardens I never knew existed in my own city!",
    rating: 5,
    badge: "🏙️ City Pioneer"
  },
  {
    id: 2,
    name: "Marcus Rodriguez", 
    role: "Nature Enthusiast",
    avatar: "/api/placeholder/64/64",
    quote: "The AI quests led me to incredible hiking trails and wildlife spots. Each discovery feels like uncovering a treasure. Absolutely magical!",
    rating: 5,
    badge: "🌲 Trail Blazer"
  },
  {
    id: 3,
    name: "Emma Thompson",
    role: "History Lover", 
    avatar: "/api/placeholder/64/64",
    quote: "I've learned more about my local history in 3 months than in 3 years. The museum quests are perfectly curated and deeply engaging.",
    rating: 5,
    badge: "🏛️ Heritage Hunter"
  },
  {
    id: 4,
    name: "Alex Kim",
    role: "Digital Nomad",
    avatar: "/api/placeholder/64/64", 
    quote: "Perfect for exploring new cities while traveling. The AI adapts to each location and creates personalized adventures instantly.",
    rating: 5,
    badge: "🚀 Global Explorer"
  }
]

const TestimonialsSection: React.FC = () => {
  const [currentIndex, setCurrentIndex] = useState(0)
  const [isAutoPlaying, setIsAutoPlaying] = useState(true)

  useEffect(() => {
    if (!isAutoPlaying) return

    const interval = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % testimonials.length)
    }, 5000)

    return () => clearInterval(interval)
  }, [isAutoPlaying])

  const nextTestimonial = () => {
    setCurrentIndex((prev) => (prev + 1) % testimonials.length)
    setIsAutoPlaying(false)
  }

  const prevTestimonial = () => {
    setCurrentIndex((prev) => (prev - 1 + testimonials.length) % testimonials.length)
    setIsAutoPlaying(false)
  }

  return (
    <section className="py-20 bg-gradient-to-b from-background via-muted/10 to-background">
      <div className="container mx-auto px-4">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="text-center mb-16"
        >
          <h2 className="text-4xl md:text-5xl font-bold text-foreground mb-4">
            Explorer Stories
          </h2>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
            Real adventures from our community of discoverers
          </p>
        </motion.div>

        <div className="relative max-w-4xl mx-auto">
          {/* Main Testimonial */}
          <div className="relative h-80 md:h-64 mb-8">
            <AnimatePresence mode="wait">
              <motion.div
                key={currentIndex}
                initial={{ opacity: 0, x: 50 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -50 }}
                transition={{ duration: 0.5 }}
                className="absolute inset-0"
              >
                <Card className="h-full bg-card/50 backdrop-blur-sm border-border/50 p-8 flex flex-col justify-center">
                  <div className="flex items-center mb-6">
                    <Avatar className="w-16 h-16 mr-4">
                      <AvatarImage src={testimonials[currentIndex].avatar} />
                      <AvatarFallback>
                        {testimonials[currentIndex].name.split(' ').map(n => n[0]).join('')}
                      </AvatarFallback>
                    </Avatar>
                    <div>
                      <h3 className="font-semibold text-foreground text-lg">
                        {testimonials[currentIndex].name}
                      </h3>
                      <p className="text-muted-foreground">
                        {testimonials[currentIndex].role}
                      </p>
                      <div className="flex items-center gap-2 mt-1">
                        <div className="flex">
                          {[...Array(testimonials[currentIndex].rating)].map((_, i) => (
                            <Star key={i} className="w-4 h-4 fill-primary text-primary" />
                          ))}
                        </div>
                        <span className="text-xs text-muted-foreground">
                          {testimonials[currentIndex].badge}
                        </span>
                      </div>
                    </div>
                  </div>
                  
                  <blockquote className="text-lg md:text-xl text-foreground leading-relaxed italic">
                    "{testimonials[currentIndex].quote}"
                  </blockquote>
                </Card>
              </motion.div>
            </AnimatePresence>
          </div>

          {/* Navigation */}
          <div className="flex items-center justify-center gap-4">
            <Button
              variant="outline"
              size="sm"
              onClick={prevTestimonial}
              className="w-10 h-10 rounded-full p-0"
            >
              <ChevronLeft className="w-4 h-4" />
            </Button>

            {/* Dots Indicator */}
            <div className="flex gap-2">
              {testimonials.map((_, index) => (
                <button
                  key={index}
                  onClick={() => {
                    setCurrentIndex(index)
                    setIsAutoPlaying(false)
                  }}
                  className={`w-2 h-2 rounded-full transition-all duration-300 ${
                    index === currentIndex 
                      ? 'bg-primary w-6' 
                      : 'bg-muted-foreground/30'
                  }`}
                />
              ))}
            </div>

            <Button
              variant="outline"
              size="sm"
              onClick={nextTestimonial}
              className="w-10 h-10 rounded-full p-0"
            >
              <ChevronRight className="w-4 h-4" />
            </Button>
          </div>

          {/* Thumbnail Row */}
          <div className="grid grid-cols-4 gap-4 mt-8">
            {testimonials.map((testimonial, index) => (
              <motion.div
                key={testimonial.id}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => {
                  setCurrentIndex(index)
                  setIsAutoPlaying(false)
                }}
                className={`cursor-pointer p-3 rounded-lg border transition-all duration-300 ${
                  index === currentIndex
                    ? 'bg-primary/10 border-primary/50' 
                    : 'bg-card/30 border-border/30 hover:bg-card/50'
                }`}
              >
                <Avatar className="w-8 h-8 mx-auto mb-2">
                  <AvatarImage src={testimonial.avatar} />
                  <AvatarFallback className="text-xs">
                    {testimonial.name.split(' ').map(n => n[0]).join('')}
                  </AvatarFallback>
                </Avatar>
                <div className="text-xs text-center">
                  <div className="font-medium text-foreground truncate">
                    {testimonial.name.split(' ')[0]}
                  </div>
                  <div className="text-muted-foreground truncate">
                    {testimonial.role}
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </div>
    </section>
  )
}

export default TestimonialsSection