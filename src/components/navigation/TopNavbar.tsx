import React from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { MapPin, Trophy, Globe, Gem, Map, Tent, Compass } from "lucide-react";
import DiscoveryAtlasIcon from '@/components/ui/discovery-atlas-icon';
import { NotificationCenter } from "@/components/notifications/NotificationCenter";
import { StreakDisplay } from "@/components/streak/StreakDisplay";
import { ProfileDropdown } from "@/components/navigation/ProfileDropdown";
import ThemeToggleButton from "@/components/ui/theme-toggle-button";
import { cn } from "@/lib/utils";

const navigationItems = [
  { title: "Camp", url: "/home", icon: Tent },
  { title: "Quests", url: "/all-quests", icon: Map },
  { title: "Quest Map", url: "/quest-map", icon: MapPin },
  { title: "Crew", url: "/community", icon: Globe },
  { title: "Treasure", url: "/badges", icon: Gem },
  { title: "Leaderboard", url: "/leaderboard", icon: Trophy },
];

export const TopNavbar = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const currentPath = location.pathname;

  const isActive = (path: string) => currentPath === path;

  return (
    <header className="sticky top-0 z-50 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 border-b">
      <div className="container mx-auto px-6 py-4">
        <div className="flex items-center justify-between">
          {/* Logo and Brand */}
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2">
              <DiscoveryAtlasIcon className="w-8 h-8 text-primary" />
              <span className="text-2xl font-bold bg-gradient-to-r from-primary to-primary/70 bg-clip-text text-transparent">
                Discovery Atlas
              </span>
            </div>
          </div>

          {/* Navigation Links */}
          <nav className="hidden md:flex items-center gap-1">
            {navigationItems.map((item) => (
              <Button
                key={item.title}
                variant="ghost"
                size="sm"
                onClick={() => navigate(item.url)}
                className={cn(
                  "flex items-center gap-2 px-3 py-2 rounded-full transition-all duration-200",
                  isActive(item.url) 
                    ? "bg-primary/10 text-primary font-medium" 
                    : "hover:bg-accent/50 text-muted-foreground hover:text-foreground"
                )}
              >
                <item.icon className="h-4 w-4" />
                <span className="text-sm">{item.title}</span>
              </Button>
            ))}
          </nav>

          {/* Right Side Actions */}
          <div className="flex items-center gap-3">
            <ThemeToggleButton />
            <NotificationCenter />
            <StreakDisplay />
            <ProfileDropdown />
          </div>
        </div>

        {/* Mobile Navigation */}
        <div className="md:hidden mt-4">
          <div className="flex flex-wrap gap-2">
            {navigationItems.map((item) => (
              <Button
                key={item.title}
                variant="ghost"
                size="sm"
                onClick={() => navigate(item.url)}
                className={cn(
                  "flex items-center gap-2 px-3 py-2 rounded-full transition-all duration-200",
                  isActive(item.url) 
                    ? "bg-primary/10 text-primary font-medium" 
                    : "hover:bg-accent/50 text-muted-foreground hover:text-foreground"
                )}
              >
                <item.icon className="h-4 w-4" />
                <span className="text-sm">{item.title}</span>
              </Button>
            ))}
          </div>
        </div>
      </div>
    </header>
  );
};