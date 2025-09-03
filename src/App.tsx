import React from "react";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider, useAuth } from "@/hooks/useAuth";
import Index from "./pages/Index";
import Auth from "./pages/Auth";
import Home from "./pages/Home";
import AllQuests from "./pages/AllQuests";
import QuestDetail from "./pages/QuestDetail";
import SubmitQuest from "./pages/SubmitQuest";
import BadgeGallery from "./pages/BadgeGallery";
import Profile from "./pages/Profile";
import Leaderboard from "./pages/Leaderboard";
import Admin from "./pages/Admin";
import Analytics from "./pages/Analytics";
import AdvancedAnalytics from "./pages/AdvancedAnalytics";
import QuestMapPage from "./pages/QuestMap";
import NotFound from "./pages/NotFound";
import Community from "./pages/Community";
import MobileTest from "./pages/MobileTest";


const queryClient = new QueryClient();

const ProtectedRoute = ({ children }: { children: React.ReactNode }) => {
  const { user, loading } = useAuth();
  
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }
  
  return user ? <>{children}</> : <Navigate to="/auth" />;
};

const AuthRoute = ({ children }: { children: React.ReactNode }) => {
  const { user, loading } = useAuth();
  
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }
  
  return user ? <Navigate to="/home" /> : <>{children}</>;
};

const App = () => (
  <QueryClientProvider client={queryClient}>
    <Toaster />
    <Sonner />
    <BrowserRouter>
      <AuthProvider>
        <Routes>
          <Route path="/" element={<Index />} />
          <Route path="/auth" element={<AuthRoute><Auth /></AuthRoute>} />
          <Route path="/home" element={<ProtectedRoute><Home /></ProtectedRoute>} />
          <Route path="/all-quests" element={<ProtectedRoute><AllQuests /></ProtectedRoute>} />
          <Route path="/quest/:id" element={<ProtectedRoute><QuestDetail /></ProtectedRoute>} />
          <Route path="/submit/:id" element={<ProtectedRoute><SubmitQuest /></ProtectedRoute>} />
          <Route path="/badges" element={<ProtectedRoute><BadgeGallery /></ProtectedRoute>} />
          <Route path="/profile" element={<ProtectedRoute><Profile /></ProtectedRoute>} />
          <Route path="/leaderboard" element={<ProtectedRoute><Leaderboard /></ProtectedRoute>} />
          <Route path="/community" element={<ProtectedRoute><Community /></ProtectedRoute>} />
          <Route path="/admin" element={<ProtectedRoute><Admin /></ProtectedRoute>} />
          <Route path="/analytics" element={<ProtectedRoute><Analytics /></ProtectedRoute>} />
          <Route path="/advanced-analytics" element={<ProtectedRoute><AdvancedAnalytics /></ProtectedRoute>} />
          <Route path="/quest-map" element={<ProtectedRoute><QuestMapPage /></ProtectedRoute>} />
          <Route path="/mobile-test" element={<MobileTest />} />
          {/* Redirect old dashboard route to home */}
          <Route path="/dashboard" element={<Navigate to="/home" replace />} />
          {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
          <Route path="*" element={<NotFound />} />
        </Routes>
      </AuthProvider>
    </BrowserRouter>
  </QueryClientProvider>
);

export default App;
