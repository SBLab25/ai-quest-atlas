import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Compass, MapPin, Star, Trophy, Users, ArrowRight } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const Index = () => {
  const { user } = useAuth();
  const navigate = useNavigate();

  const handleGetStarted = () => {
    if (user) {
      navigate('/dashboard');
    } else {
      navigate('/auth');
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary/5 via-background to-secondary/5">
      {/* Hero Section */}
      <div className="container mx-auto px-4 py-16">
        <div className="text-center space-y-8 mb-16">
          <div className="flex items-center justify-center space-x-3 mb-6">
            <div className="w-16 h-16 bg-gradient-to-r from-primary to-secondary rounded-full flex items-center justify-center">
              <Compass className="w-8 h-8 text-primary-foreground" />
            </div>
            <span className="text-4xl font-bold bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">
              Discovery Atlas
            </span>
          </div>
          
          <h1 className="text-5xl md:text-6xl font-bold leading-tight">
            Your Adventure
            <span className="block text-primary">Starts Here</span>
          </h1>
          
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
            Join thousands of explorers on AI-powered discovery quests. Explore your world, 
            earn digital badges, and build a global community atlas of knowledge and wonder.
          </p>
          
          <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
            <Button size="lg" onClick={handleGetStarted} className="text-lg px-8 py-6">
              Start Exploring
              <ArrowRight className="ml-2 w-5 h-5" />
            </Button>
            {!user && (
              <Button variant="outline" size="lg" onClick={() => navigate('/auth')} className="text-lg px-8 py-6">
                Learn More
              </Button>
            )}
          </div>
        </div>

        {/* Features Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-16">
          <Card className="text-center">
            <CardHeader>
              <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4">
                <MapPin className="w-8 h-8 text-primary" />
              </div>
              <CardTitle>AI-Powered Quests</CardTitle>
              <CardDescription>
                Receive personalized daily adventures based on your location, interests, and trending discoveries
              </CardDescription>
            </CardHeader>
          </Card>
          
          <Card className="text-center">
            <CardHeader>
              <div className="w-16 h-16 bg-secondary/10 rounded-full flex items-center justify-center mx-auto mb-4">
                <Star className="w-8 h-8 text-secondary" />
              </div>
              <CardTitle>Digital Badges & NFTs</CardTitle>
              <CardDescription>
                Earn unique collectible badges for completed quests and build your explorer reputation
              </CardDescription>
            </CardHeader>
          </Card>
          
          <Card className="text-center">
            <CardHeader>
              <div className="w-16 h-16 bg-accent/10 rounded-full flex items-center justify-center mx-auto mb-4">
                <Users className="w-8 h-8 text-accent-foreground" />
              </div>
              <CardTitle>Community Atlas</CardTitle>
              <CardDescription>
                Contribute to a global map of discoveries, share stories, and learn from fellow explorers
              </CardDescription>
            </CardHeader>
          </Card>
        </div>

        {/* How It Works */}
        <div className="text-center mb-16">
          <h2 className="text-3xl font-bold mb-8">How Discovery Atlas Works</h2>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
            <div className="space-y-4">
              <div className="w-12 h-12 bg-primary rounded-full flex items-center justify-center mx-auto text-white font-bold">
                1
              </div>
              <h3 className="font-semibold">Get Your Quest</h3>
              <p className="text-muted-foreground text-sm">
                AI generates personalized discovery challenges based on your location and interests
              </p>
            </div>
            
            <div className="space-y-4">
              <div className="w-12 h-12 bg-secondary rounded-full flex items-center justify-center mx-auto text-white font-bold">
                2
              </div>
              <h3 className="font-semibold">Explore & Discover</h3>
              <p className="text-muted-foreground text-sm">
                Head out into the world and complete your adventure challenge
              </p>
            </div>
            
            <div className="space-y-4">
              <div className="w-12 h-12 bg-accent rounded-full flex items-center justify-center mx-auto text-white font-bold">
                3
              </div>
              <h3 className="font-semibold">Submit Proof</h3>
              <p className="text-muted-foreground text-sm">
                Upload photos, descriptions, and geo-tagged evidence of your discovery
              </p>
            </div>
            
            <div className="space-y-4">
              <div className="w-12 h-12 bg-primary rounded-full flex items-center justify-center mx-auto text-white font-bold">
                4
              </div>
              <h3 className="font-semibold">Earn Rewards</h3>
              <p className="text-muted-foreground text-sm">
                Get verified badges, NFT collectibles, and tokens for your achievements
              </p>
            </div>
          </div>
        </div>

        {/* Stats */}
        <div className="bg-card rounded-lg p-8 border">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8 text-center">
            <div>
              <div className="text-3xl font-bold text-primary">10,000+</div>
              <p className="text-muted-foreground">Active Explorers</p>
            </div>
            <div>
              <div className="text-3xl font-bold text-secondary">50,000+</div>
              <p className="text-muted-foreground">Quests Completed</p>
            </div>
            <div>
              <div className="text-3xl font-bold text-accent-foreground">120+</div>
              <p className="text-muted-foreground">Countries Explored</p>
            </div>
            <div>
              <div className="text-3xl font-bold text-primary">25,000+</div>
              <p className="text-muted-foreground">Discoveries Shared</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Index;
