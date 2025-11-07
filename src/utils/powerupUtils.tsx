import React from 'react';
import { 
  Zap, 
  CheckCircle, 
  TrendingUp, 
  Shield, 
  MapPin, 
  Clover,
  Compass
} from 'lucide-react';

/**
 * Shared utility functions for powerup components
 */

export const getPowerUpIcon = (effectType: string): React.ReactNode => {
  const iconMap: Record<string, React.ReactNode> = {
    double_xp: <Zap className="h-6 w-6" />,
    instant_verify: <CheckCircle className="h-6 w-6" />,
    point_multiplier: <TrendingUp className="h-6 w-6" />,
    streak_freeze: <Shield className="h-6 w-6" />,
    location_hint: <MapPin className="h-6 w-6" />,
    lucky_charm: <Clover className="h-6 w-6" />,
    quest_radar: <Compass className="h-6 w-6" />,
  };
  return iconMap[effectType] || <Zap className="h-6 w-6" />;
};

export const getPowerUpIconEmoji = (effectType: string): string => {
  const icons: Record<string, string> = {
    double_xp: '⚡',
    instant_verify: '✓',
    bonus_badge: '🏆',
    point_multiplier: '💎',
    streak_freeze: '🛡️',
    location_hint: '📍',
    lucky_charm: '🍀',
    quest_radar: '🧭',
  };
  return icons[effectType] || '⚡';
};

export const getRarityColor = (rarity: string): string => {
  const colors: Record<string, string> = {
    common: 'bg-gray-500/10 text-gray-600 border-gray-500/20',
    rare: 'bg-blue-500/10 text-blue-600 border-blue-500/20',
    epic: 'bg-purple-500/10 text-purple-600 border-purple-500/20',
    legendary: 'bg-yellow-500/10 text-yellow-600 border-yellow-500/20',
  };
  return colors[rarity] || colors.common;
};

export const getRarityGlow = (rarity: string): string => {
  const glows: Record<string, string> = {
    common: 'hover:shadow-gray-500/20',
    rare: 'hover:shadow-blue-500/30',
    epic: 'hover:shadow-purple-500/40',
    legendary: 'hover:shadow-yellow-500/50 hover:shadow-xl',
  };
  return glows[rarity] || glows.common;
};

export const getDurationText = (hours: number): string => {
  if (hours === 0) return 'Single Use';
  if (hours < 1) return `${Math.round(hours * 60)} minutes`;
  if (hours === 24) return '1 Day';
  if (hours < 24) return `${hours} hours`;
  const days = Math.floor(hours / 24);
  const remainingHours = hours % 24;
  if (remainingHours === 0) return `${days} day${days > 1 ? 's' : ''}`;
  return `${days}d ${remainingHours}h`;
};

export const getTimeRemaining = (expiresAt: string, includeSeconds: boolean = false): string => {
  const remaining = new Date(expiresAt).getTime() - Date.now();
  if (remaining <= 0) return 'Expired';
  
  const hours = Math.floor(remaining / (1000 * 60 * 60));
  const minutes = Math.floor((remaining % (1000 * 60 * 60)) / (1000 * 60));
  const seconds = Math.floor((remaining % (1000 * 60)) / 1000);
  
  if (hours > 0) return `${hours}h ${minutes}m`;
  if (minutes > 0) {
    return includeSeconds ? `${minutes}m ${seconds}s` : `${minutes}m`;
  }
  return includeSeconds ? `${seconds}s` : 'Less than 1m';
};

/**
 * Get powerup cost - prioritizes database cost, falls back to hardcoded map
 */
export const getPowerUpCost = (powerUp: { effect_type: string; cost?: number }): number => {
  // If cost exists in database, use it
  if (powerUp.cost !== undefined && powerUp.cost !== null) {
    return powerUp.cost;
  }
  
  // Fallback to hardcoded costs (for backward compatibility)
  const costMap: Record<string, number> = {
    double_xp: 200,
    instant_verify: 150,
    point_multiplier: 500,
    streak_freeze: 50,
    location_hint: 30,
    lucky_charm: 100,
    quest_radar: 80,
  };
  return costMap[powerUp.effect_type] || 100;
};

