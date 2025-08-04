import { MapPin, Compass, Trophy, Users, Star, BarChart, User, Settings, List } from "lucide-react";
import { useNavigate, useLocation } from "react-router-dom";
import { useRole } from "@/hooks/useSimpleRole";
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarTrigger,
  useSidebar,
} from "@/components/ui/sidebar";

const navigationItems = [
  { title: "Dashboard", url: "/dashboard", icon: Compass },
  { title: "All Quests", url: "/all-quests", icon: List },
  { title: "Quest Map", url: "#quest-map", icon: MapPin, isScrollTarget: true },
  { title: "Profile", url: "/profile", icon: User },
  { title: "Badge Gallery", url: "/badges", icon: Star },
  { title: "Leaderboard", url: "/leaderboard", icon: Trophy },
];

const adminItems = [
  { title: "Admin Panel", url: "/admin", icon: Settings },
  { title: "Analytics", url: "/analytics", icon: BarChart },
  { title: "Advanced Analytics", url: "/advanced-analytics", icon: BarChart },
];

export function AppSidebar() {
  const { state } = useSidebar();
  const navigate = useNavigate();
  const location = useLocation();
  const { isAdmin, isModerator } = useRole();
  const currentPath = location.pathname;
  const collapsed = state === "collapsed";

  const isActive = (path: string) => currentPath === path;

  const handleNavigation = (item: typeof navigationItems[0]) => {
    if (item.isScrollTarget) {
      // Scroll to Quest Map section on dashboard
      if (currentPath !== "/dashboard") {
        navigate("/dashboard");
        setTimeout(() => {
          const element = document.querySelector('[data-section="quest-map"]');
          element?.scrollIntoView({ behavior: "smooth" });
        }, 100);
      } else {
        const element = document.querySelector('[data-section="quest-map"]');
        element?.scrollIntoView({ behavior: "smooth" });
      }
    } else {
      navigate(item.url);
    }
  };

  return (
    <Sidebar className={collapsed ? "w-16" : "w-72"} collapsible="icon">
      <SidebarTrigger className="m-3 self-end" />
      
      <SidebarContent className="px-2">
        <SidebarGroup>
          <SidebarGroupLabel className="text-xs font-semibold text-muted-foreground mb-2">Navigation</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu className="space-y-1">
              {navigationItems.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton 
                    onClick={() => handleNavigation(item)}
                    className={`h-10 ${isActive(item.url) ? "bg-accent text-accent-foreground font-medium" : "hover:bg-accent/50"} transition-all duration-200`}
                  >
                    <item.icon className="h-5 w-5 shrink-0" />
                    {!collapsed && <span className="text-sm">{item.title}</span>}
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        {(isAdmin || isModerator) && (
          <SidebarGroup className="mt-4">
            <SidebarGroupLabel className="text-xs font-semibold text-muted-foreground mb-2">Admin</SidebarGroupLabel>
            <SidebarGroupContent>
              <SidebarMenu className="space-y-1">
                {adminItems.map((item) => (
                  <SidebarMenuItem key={item.title}>
                    <SidebarMenuButton 
                      onClick={() => navigate(item.url)}
                      className={`h-10 ${isActive(item.url) ? "bg-accent text-accent-foreground font-medium" : "hover:bg-accent/50"} transition-all duration-200`}
                    >
                      <item.icon className="h-5 w-5 shrink-0" />
                      {!collapsed && <span className="text-sm">{item.title}</span>}
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                ))}
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        )}
      </SidebarContent>
    </Sidebar>
  );
}