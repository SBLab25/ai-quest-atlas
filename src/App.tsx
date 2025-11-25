import React, { useEffect } from "react";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider, useAuth } from "@/hooks/useAuth";
import { ActivePowerUpBar } from "@/components/gamification/ActivePowerUpBar";
import { PageLoader } from "@/components/ui/PageLoader";
import { LottieLoading } from "@/components/ui/LottieLoading";
import { InstallPrompt } from "@/components/pwa/InstallPrompt";
import { OfflineIndicator } from "@/components/pwa/OfflineIndicator";
import { UpdateNotification } from "@/components/pwa/UpdateNotification";
import { useOfflineStorage } from "@/hooks/useOfflineStorage";
import Index from "./pages/Index";
import Auth from "./pages/Auth";
import Home from "./pages/Home";
import AllQuests from "./pages/AllQuests";
import QuestDetail from "./pages/QuestDetail";
import SubmitQuest from "./pages/SubmitQuest";
import BadgeGallery from "./pages/BadgeGallery";
import Profile from "./pages/Profile";
import UserProfile from "./pages/UserProfile";
import Leaderboard from "./pages/Leaderboard";
import QuestMapPage from "./pages/QuestMap";
import NotFound from "./pages/NotFound";
import Community from "./pages/Community";
import PostDetail from "./pages/PostDetail";
import MobileTest from "./pages/MobileTest";
import Admin from "./pages/Admin";
import Offline from "./pages/Offline";


const queryClient = new QueryClient();

const ProtectedRoute = ({ children }: { children: React.ReactNode }) => {
  const { user, loading } = useAuth();
  
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <LottieLoading size="lg" message="Loading..." />
      </div>
    );
  }
  
  // If no user, redirect to auth with replace to prevent back navigation
  if (!user) {
    return <Navigate to="/auth" replace />;
  }
  
  return <>{children}</>;
};

const AuthRoute = ({ children }: { children: React.ReactNode }) => {
  const { user, loading } = useAuth();
  
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <LottieLoading size="lg" message="Loading..." />
      </div>
    );
  }
  
  // If user is logged in, redirect to home with replace
  if (user) {
    return <Navigate to="/home" replace />;
  }
  
  return <>{children}</>;
};

const App = () => {
  const { isReady, clearOldCache } = useOfflineStorage();

  useEffect(() => {
    if (isReady) {
      // Clear old cached data on app load
      clearOldCache();
    }
  }, [isReady]);

  return (
    <QueryClientProvider client={queryClient}>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <AuthProvider>
          <PageLoader delay={200} minDisplayTime={600} />
          <ActivePowerUpBar />
          <InstallPrompt />
          <OfflineIndicator />
          <UpdateNotification />
          <Routes>
            <Route path="/" element={<Index />} />
            <Route path="/auth" element={<AuthRoute><Auth /></AuthRoute>} />
            <Route path="/home" element={<ProtectedRoute><Home /></ProtectedRoute>} />
            <Route path="/all-quests" element={<ProtectedRoute><AllQuests /></ProtectedRoute>} />
            <Route path="/quest/:id" element={<ProtectedRoute><QuestDetail /></ProtectedRoute>} />
            <Route path="/submit/:id" element={<ProtectedRoute><SubmitQuest /></ProtectedRoute>} />
            <Route path="/badges" element={<ProtectedRoute><BadgeGallery /></ProtectedRoute>} />
            <Route path="/treasure" element={<ProtectedRoute><BadgeGallery /></ProtectedRoute>} />
            <Route path="/profile" element={<ProtectedRoute><Profile /></ProtectedRoute>} />
            <Route path="/profile/:userId" element={<ProtectedRoute><UserProfile /></ProtectedRoute>} />
            <Route path="/leaderboard" element={<ProtectedRoute><Leaderboard /></ProtectedRoute>} />
            <Route path="/community" element={<ProtectedRoute><Community /></ProtectedRoute>} />
            <Route path="/post/:postId" element={<ProtectedRoute><PostDetail /></ProtectedRoute>} />
            <Route path="/quest-map" element={<ProtectedRoute><QuestMapPage /></ProtectedRoute>} />
            <Route path="/mobile-test" element={<MobileTest />} />
            <Route path="/offline" element={<Offline />} />
            {/* Redirect old dashboard route to home */}
            <Route path="/dashboard" element={<Navigate to="/home" replace />} />
            <Route path="/admin" element={<ProtectedRoute><Admin /></ProtectedRoute>} />
            {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
            <Route path="*" element={<NotFound />} />
          </Routes>
        </AuthProvider>
      </BrowserRouter>
    </QueryClientProvider>
  );
};

export default App;
