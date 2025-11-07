import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/use-toast';
import { MapPin, Star, ArrowLeft } from 'lucide-react';
import ThemeToggleButton from '@/components/ui/theme-toggle-button';
import { LottieLoading } from '@/components/ui/LottieLoading';
import AnoAI from '@/components/ui/animated-shader-background';
import daLogo from '@/components/ui/Discovery Atlas logo.png';

const Auth = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [loadingMessage, setLoadingMessage] = useState('Signing you in...');
  const { signIn, signUp } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();

  const handleSignIn = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoadingMessage('Signing you in...');
    setIsLoading(true);
    
    const formData = new FormData(e.currentTarget);
    const email = formData.get('email') as string;
    const password = formData.get('password') as string;

    const { error } = await signIn(email, password);
    
    if (error) {
      toast({
        title: "Sign in failed",
        description: error.message,
        variant: "destructive"
      });
    } else {
      toast({
        title: "Welcome back!",
        description: "You've successfully signed in to Discovery Atlas."
      });
      navigate('/home');
    }
    
    setIsLoading(false);
  };

  const handleSignUp = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoadingMessage('Creating your account...');
    setIsLoading(true);
    
    const formData = new FormData(e.currentTarget);
    const email = formData.get('email') as string;
    const password = formData.get('password') as string;
    const fullName = formData.get('fullName') as string;
    const username = formData.get('username') as string;

    const { error } = await signUp(email, password, {
      full_name: fullName,
      username: username
    });
    
    if (error) {
      toast({
        title: "Sign up failed",
        description: error.message,
        variant: "destructive"
      });
    } else {
      toast({
        title: "Welcome to Discovery Atlas!",
        description: "Check your email to confirm your account."
      });
    }
    
    setIsLoading(false);
  };

  // Show loading overlay when authenticating
  if (isLoading) {
    return (
      <div className="min-h-screen relative flex items-center justify-center p-4 overflow-hidden">
        {/* Animated Shader Background */}
        <div className="absolute inset-0 z-0">
          <AnoAI />
        </div>
        {/* Dark overlay for better contrast */}
        <div className="absolute inset-0 bg-black/40 z-10" />
        
        {/* Back to Landing Page Button */}
        <div className="absolute top-4 left-4 z-50">
          <Button
            variant="outline"
            size="sm"
            onClick={() => navigate('/')}
            className="backdrop-blur-md bg-background/80 hover:bg-background/90 border-border/50 shadow-lg"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back
          </Button>
        </div>
        
        <div className="absolute top-4 right-4 z-50">
          <ThemeToggleButton />
        </div>
        <div className="relative z-20">
          <LottieLoading 
            size="lg" 
            message={loadingMessage}
            className="min-h-screen"
          />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen relative flex items-center justify-center p-4 overflow-hidden">
      {/* Animated Shader Background */}
      <div className="absolute inset-0 z-0">
        <AnoAI />
      </div>
      {/* Dark overlay for better contrast */}
      <div className="absolute inset-0 bg-black/40 z-10" />
      
      {/* Back to Landing Page Button */}
      <div className="absolute top-4 left-4 z-50">
        <Button
          variant="outline"
          size="sm"
          onClick={() => navigate('/')}
          className="backdrop-blur-md bg-background/80 hover:bg-background/90 border-border/50 shadow-lg"
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back
        </Button>
      </div>
      
      {/* Theme Toggle */}
      <div className="absolute top-4 right-4 z-50">
        <ThemeToggleButton />
      </div>
      
      <div className="w-full max-w-md space-y-6 relative z-20">
        {/* Header */}
        <div className="text-center space-y-2">
          <div className="flex items-center justify-center space-x-3 mb-6">
            <img 
              src={daLogo} 
              alt="Discovery Atlas Logo" 
              className="h-24 w-auto object-contain"
            />
            <span className="text-4xl font-bold text-foreground">Discovery Atlas</span>
          </div>
          <h1 className="text-2xl font-bold text-foreground">Welcome Explorer!</h1>
          <p className="text-muted-foreground">Begin your journey of discovery and adventure</p>
        </div>

        {/* Features Preview */}
        <div className="grid grid-cols-3 gap-4 mb-6">
          <div className="text-center space-y-2">
            <div className="w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center mx-auto">
              <MapPin className="w-6 h-6 text-primary" />
            </div>
            <p className="text-xs text-muted-foreground">Explore</p>
          </div>
          <div className="text-center space-y-2">
            <div className="w-12 h-12 bg-secondary/10 rounded-full flex items-center justify-center mx-auto">
              <Star className="w-6 h-6 text-secondary" />
            </div>
            <p className="text-xs text-muted-foreground">Earn Badges</p>
          </div>
          <div className="text-center space-y-2">
            <div className="w-12 h-12 bg-accent/10 rounded-full flex items-center justify-center mx-auto overflow-hidden">
              <img 
                src={daLogo} 
                alt="Discovery Atlas" 
                className="w-10 h-10 object-contain"
              />
            </div>
            <p className="text-xs text-muted-foreground">Connect</p>
          </div>
        </div>

        {/* Auth Forms */}
        <Card className="backdrop-blur-md bg-card/95 border-border/50 shadow-2xl">
          <Tabs defaultValue="signin" className="w-full">
            <CardHeader>
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="signin">Sign In</TabsTrigger>
                <TabsTrigger value="signup">Sign Up</TabsTrigger>
              </TabsList>
            </CardHeader>
            
            <CardContent>
              <TabsContent value="signin" className="space-y-4">
                <div className="text-center space-y-1">
                  <CardTitle>Welcome Back</CardTitle>
                  <CardDescription>Sign in to continue your adventures</CardDescription>
                </div>
                
                <form onSubmit={handleSignIn} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="signin-email">Email</Label>
                    <Input 
                      id="signin-email"
                      name="email" 
                      type="email" 
                      placeholder="explorer@example.com"
                      required 
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="signin-password">Password</Label>
                    <Input 
                      id="signin-password"
                      name="password" 
                      type="password" 
                      required 
                    />
                  </div>
                  <Button type="submit" className="w-full" disabled={isLoading}>
                    {isLoading ? "Signing In..." : "Sign In"}
                  </Button>
                </form>
              </TabsContent>
              
              <TabsContent value="signup" className="space-y-4">
                <div className="text-center space-y-1">
                  <CardTitle>Join the Adventure</CardTitle>
                  <CardDescription>Create your explorer account</CardDescription>
                </div>
                
                <form onSubmit={handleSignUp} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="signup-fullname">Full Name</Label>
                    <Input 
                      id="signup-fullname"
                      name="fullName" 
                      type="text" 
                      placeholder="Your Name"
                      required 
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="signup-username">Username</Label>
                    <Input 
                      id="signup-username"
                      name="username" 
                      type="text" 
                      placeholder="explorer123"
                      required 
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="signup-email">Email</Label>
                    <Input 
                      id="signup-email"
                      name="email" 
                      type="email" 
                      placeholder="explorer@example.com"
                      required 
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="signup-password">Password</Label>
                    <Input 
                      id="signup-password"
                      name="password" 
                      type="password" 
                      required 
                    />
                  </div>
                  <Button type="submit" className="w-full" disabled={isLoading}>
                    {isLoading ? "Creating Account..." : "Start Exploring"}
                  </Button>
                </form>
              </TabsContent>
            </CardContent>
          </Tabs>
        </Card>
      </div>
    </div>
  );
};

export default Auth;