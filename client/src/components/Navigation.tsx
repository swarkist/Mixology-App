import { Link, useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Home, List, Beaker, BarChart3 } from "lucide-react";

export const Navigation = (): JSX.Element => {
  const [location] = useLocation();

  const navItems = [
    { path: "/", label: "Home", icon: Home },
    { path: "/cocktails", label: "Cocktails", icon: List },
    { path: "/ingredients", label: "Ingredients", icon: Beaker },
    { path: "/my-bar", label: "My Bar", icon: BarChart3 }
  ];

  return (
    <nav className="fixed bottom-0 left-0 right-0 bg-[#161611]/90 backdrop-blur-sm border-t border-[#2a2920] z-50 md:hidden">
      <div className="flex justify-around items-center p-2">
        {navItems.map((item) => {
          const IconComponent = item.icon;
          const isActive = location === item.path;
          
          return (
            <Link key={item.path} href={item.path}>
              <Button
                variant="ghost"
                size="sm"
                className={`flex flex-col items-center gap-1 p-2 h-auto ${
                  isActive 
                    ? "text-[#f2c40c]" 
                    : "text-[#bab59b] hover:text-white"
                }`}
              >
                <IconComponent className="w-5 h-5" />
                <span className="text-xs">{item.label}</span>
              </Button>
            </Link>
          );
        })}
      </div>
    </nav>
  );
};

export const DesktopNavigation = (): JSX.Element => {
  const [location] = useLocation();

  const navItems = [
    { path: "/", label: "Home" },
    { path: "/cocktails", label: "Cocktails" },
    { path: "/ingredients", label: "Ingredients" }
  ];

  return (
    <nav className="hidden md:flex items-center gap-6">
      {navItems.map((item) => {
        const isActive = location === item.path;
        
        return (
          <Link key={item.path} href={item.path}>
            <Button
              variant="ghost"
              className={`${
                isActive 
                  ? "text-[#f2c40c] hover:text-[#f2c40c]" 
                  : "text-white hover:text-[#f2c40c]"
              }`}
            >
              {item.label}
            </Button>
          </Link>
        );
      })}
    </nav>
  );
};