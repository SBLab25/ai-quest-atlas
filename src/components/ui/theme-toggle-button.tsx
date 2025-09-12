import React, { useState, useEffect } from "react";
import { Moon, Sun } from "lucide-react";
import { useTheme } from "next-themes";
import { Button } from "./button";

interface ThemeToggleButtonProps {
  start?: "top-left" | "top-right" | "bottom-left" | "bottom-right" | "center";
}

const ThemeToggleButton: React.FC<ThemeToggleButtonProps> = ({ start = "center" }) => {
  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);
  const [isAnimating, setIsAnimating] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) return null;

  const toggleTheme = () => {
    setIsAnimating(true);
    setTheme(theme === "light" ? "dark" : "light");

    setTimeout(() => setIsAnimating(false), 1000); // remove overlay after animation
  };

  const isDark = theme === "dark";

  const origins = {
    "top-left": "origin-top-left",
    "top-right": "origin-top-right",
    "bottom-left": "origin-bottom-left",
    "bottom-right": "origin-bottom-right",
    center: "origin-center",
  };

  return (
    <>
      {/* Button */}
      <Button
        variant="ghost"
        size="icon"
        onClick={toggleTheme}
        className="relative z-50"
        disabled={isAnimating}
      >
        {isDark ? <Sun className="h-5 w-5" /> : <Moon className="h-5 w-5" />}
      </Button>

      {/* Full-screen overlay animation */}
      {isAnimating && (
        <div
          className={`fixed inset-0 bg-primary z-40 transform scale-0 ${origins[start]} animate-[grow_1s_ease-out_forwards]`}
        />
      )}
    </>
  );
};

export default ThemeToggleButton;
