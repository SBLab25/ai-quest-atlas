import { MapPin, Compass, Trophy, Users, Star, BarChart, User, Settings } from "lucide-react";
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
    <Sidebar className={collapsed ? "w-14" : "w-60"} collapsible="icon">
      <SidebarTrigger className="m-2 self-end" />
      
      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel>Navigation</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {navigationItems.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton 
                    onClick={() => handleNavigation(item)}
                    className={isActive(item.url) ? "bg-accent text-accent-foreground" : "hover:bg-accent/50"}
                  >
                    <item.icon className="h-4 w-4" />
                    {!collapsed && <span>{item.title}</span>}
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        {(isAdmin || isModerator) && (
          <SidebarGroup>
            <SidebarGroupLabel>Admin</SidebarGroupLabel>
            <SidebarGroupContent>
              <SidebarMenu>
                {adminItems.map((item) => (
                  <SidebarMenuItem key={item.title}>
                    <SidebarMenuButton 
                      onClick={() => navigate(item.url)}
                      className={isActive(item.url) ? "bg-accent text-accent-foreground" : "hover:bg-accent/50"}
                    >
                      <item.icon className="h-4 w-4" />
                      {!collapsed && <span>{item.title}</span>}
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