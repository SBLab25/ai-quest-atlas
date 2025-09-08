import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/use-toast';
import { MapPin, Star } from 'lucide-react';
import ThemeToggleButton from '@/components/ui/theme-toggle-button';
import DiscoveryAtlasIcon from '@/components/ui/discovery-atlas-icon';

const Auth = () => {
  const [isLoading, setIsLoading] = useState(false);
  const { signIn, signUp } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();

  const handleSignIn = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
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

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary/10 via-background to-secondary/10 flex items-center justify-center p-4">
      {/* Theme Toggle */}
      <div className="absolute top-4 right-4 z-50">
        <ThemeToggleButton />
      </div>
      
      <div className="w-full max-w-md space-y-6">
        {/* Header */}
        <div className="text-center space-y-2">
          <div className="flex items-center justify-center space-x-2 mb-4">
            <div className="w-10 h-10 bg-gradient-to-r from-primary to-secondary rounded-full flex items-center justify-center">
              <DiscoveryAtlasIcon className="w-6 h-6" />
            </div>
            <span className="text-2xl font-bold text-foreground">Discovery Atlas</span>
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
            <div className="w-12 h-12 bg-accent/10 rounded-full flex items-center justify-center mx-auto">
              <DiscoveryAtlasIcon className="w-8 h-8" />
            </div>
            <p className="text-xs text-muted-foreground">Connect</p>
          </div>
        </div>

        {/* Auth Forms */}
        <Card>
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