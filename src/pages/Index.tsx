import React, { useRef, useEffect } from 'react'
import { useAuth } from '@/hooks/useAuth'
import { useNavigate } from 'react-router-dom'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Compass, MapPin, Star, Users, ArrowRight } from 'lucide-react'
import { motion, useScroll, useTransform } from 'framer-motion'
import ThemeToggleButton from '@/components/ui/theme-toggle-button'
import CountUp from '@/components/ui/count-up'

const fadeUp = {
  hidden: { opacity: 0, y: 24 },
  visible: (i: number = 0) => ({ 
    opacity: 1, 
    y: 0, 
    transition: { 
      delay: 0.08 * i, 
      duration: 0.5, 
      ease: [0.4, 0, 0.2, 1] as [number, number, number, number]
    } 
  }),
}

const Index = () => {
  const { user } = useAuth()
  const navigate = useNavigate()

  const pageRef = useRef<HTMLDivElement | null>(null)
  const { scrollYProgress } = useScroll({ target: pageRef, offset: ['start start', 'end end'] })

  // Stronger parallax so it's clearly visible
  const ySlow = useTransform(scrollYProgress, [0, 1], [0, 120])
  const yMedium = useTransform(scrollYProgress, [0, 1], [0, 220])
  const yFast = useTransform(scrollYProgress, [0, 1], [0, 340])

  const handleGetStarted = () => {
    if (user) navigate('/home')
    else navigate('/auth')
  }

  return (
    <div ref={pageRef} className="min-h-screen relative overflow-hidden bg-gradient-to-br from-primary/5 via-background to-secondary/5">
      {/* Top-right Theme Toggle */}
      <div className="absolute top-4 right-4 z-50">
        <ThemeToggleButton start="top-right" />
      </div>

      {/* Parallax background orbs */}
      <motion.div style={{ y: ySlow }} className="pointer-events-none absolute -top-20 -left-20 h-72 w-72 rounded-full bg-primary/10 blur-3xl" />
      <motion.div style={{ y: yMedium }} className="pointer-events-none absolute top-40 -right-24 h-80 w-80 rounded-full bg-secondary/10 blur-3xl" />
      <motion.div style={{ y: yFast }} className="pointer-events-none absolute bottom-10 left-1/3 h-64 w-64 rounded-full bg-accent/10 blur-3xl" />

      {/* Hero Section */}
      <div className="container mx-auto px-4 pt-16 pb-12 relative">
        <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6 }} className="text-center space-y-8 mb-16">
          <div className="flex items-center justify-center space-x-3 mb-6">
            <motion.div style={{ y: ySlow }} className="w-16 h-16 bg-gradient-to-r from-primary to-secondary rounded-full flex items-center justify-center shadow-lg shadow-primary/10">
              <Compass className="w-8 h-8" />
            </motion.div>
            <span className="text-4xl font-bold bg-gradient-to-r from-primary to-secondary bg-clip-text">
              Discovery Atlas
            </span>
          </div>

          <motion.h1 initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6, delay: 0.1 }} className="text-5xl md:text-6xl font-bold leading-tight text-foreground">
            Your Adventure
            <span className="block text-primary">Starts Here</span>
          </motion.h1>

          {/* Solid color text (no muted) */}
          <motion.p initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5, delay: 0.2 }} className="text-xl text-foreground max-w-2xl mx-auto">
            Join thousands of explorers on AI-powered discovery quests. Explore your world, earn digital badges, and build a
            global community atlas of knowledge and wonder.
          </motion.p>

          <motion.div initial={{ opacity: 0, scale: 0.98 }} animate={{ opacity: 1, scale: 1 }} transition={{ duration: 0.4, delay: 0.25 }} className="flex flex-col sm:flex-row gap-4 justify-center items-center">
            <Button size="lg" onClick={handleGetStarted} className="text-lg px-8 py-6">
              Start Exploring
              <ArrowRight className="ml-2 w-5 h-5" />
            </Button>
            {!user && (
              <Button variant="outline" size="lg" onClick={() => navigate('/auth')} className="text-lg px-8 py-6">
                Learn More
              </Button>
            )}
          </motion.div>
        </motion.div>

        {/* Features Grid */}
        <motion.div
          className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-16"
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, amount: 0.25 }}
          variants={{ hidden: {}, visible: { transition: { staggerChildren: 0.08 } } }}
        >
          {[{
            icon: <MapPin className="w-8 h-8 text-primary" />, title: 'AI-Powered Quests', desc: 'Receive personalized daily adventures based on your location, interests, and trending discoveries'
          }, {
            icon: <Star className="w-8 h-8 " />, title: 'Digital Badges & NFTs', desc: 'Earn unique collectible badges for completed quests and build your explorer reputation'
          }, {
            icon: <Users className="w-8 h-8 " />, title: 'Community Atlas', desc: 'Contribute to a global map of discoveries, share stories, and learn from fellow explorers'
          }].map((f, i) => (
            <motion.div key={f.title} variants={fadeUp} custom={i}>
              <Card className="text-center hover:shadow-lg ">
                <CardHeader>
                  <div className="w-16 h-16 bg-primary/40 rounded-full flex items-center justify-center mx-auto mb-4">
                    {f.icon}
                  </div>
                  <CardTitle className="text-foreground">{f.title}</CardTitle>
                  <CardDescription className="text-foreground/80">{f.desc}</CardDescription>
                </CardHeader>
              </Card>
            </motion.div>
          ))}
        </motion.div>

        {/* How It Works */}
        <motion.div
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, amount: 0.25 }}
          variants={{ hidden: {}, visible: { transition: { staggerChildren: 0.08 } } }}
          className="text-center mb-16"
        >
          <motion.h2 variants={fadeUp} className="text-3xl font-bold mb-8">How Discovery Atlas Works</motion.h2>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
            {[
              { n: '1', title: 'Get Your Quest', desc: 'AI generates personalized discovery challenges based on your location and interests', bg: 'bg-primary', text: 'text-primary-foreground' },
              { n: '2', title: 'Explore & Discover', desc: 'Head out into the world and complete your adventure challenge', bg: 'bg-accent', text: 'text-accent-foreground' },
              { n: '3', title: 'Submit Proof', desc: 'Upload photos, descriptions, and geo-tagged evidence of your discovery', bg: 'bg-primary', text: 'text-primary-foreground' },
              { n: '4', title: 'Earn Rewards', desc: 'Get verified badges, NFT collectibles, and tokens for your achievements', bg: 'bg-primary', text: 'text-primary-foreground' },
            ].map((s, i) => (
              <motion.div key={s.n} variants={fadeUp} custom={i + 1} className="space-y-4">
                <div className={`w-12 h-12 ${s.bg} ${s.text} rounded-full flex items-center justify-center mx-auto font-bold`}>{s.n}</div>
                <h3 className="font-semibold">{s.title}</h3>
                <p className="text-foreground/40 text-sm">{s.desc}</p>
              </motion.div>
            ))}
          </div>
        </motion.div>

        {/* Stats with CountUp that runs once on view */}
        <motion.div
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, amount: 0.3 }}
          variants={{ hidden: {}, visible: { transition: { staggerChildren: 0.06 } } }}
          className="bg-card rounded-lg p-8 border"
        >
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8 text-center">
            {[
              { v: 10000, suffix: '+', l: 'Active Explorers', c: 'text-primary' },
              { v: 50000, suffix: '+', l: 'Quests Completed', c: 'text-secondary' },
              { v: 120, suffix: '+', l: 'Countries Explored', c: 'text-accent-foreground' },
              { v: 25000, suffix: '+', l: 'Discoveries Shared', c: 'text-primary' },
            ].map((stat, i) => (
              <motion.div key={stat.l} variants={fadeUp} custom={i}>
                <div className={`text-3xl font-bold ${stat.c}`}>
                  <CountUp to={stat.v} duration={1.8} />{stat.suffix}
                </div>
                <p className="text-foreground/80">{stat.l}</p>
              </motion.div>
            ))}
          </div>
        </motion.div>
      </div>
    </div>
  )
}

export default Index
