import * as React from 'react';
import { cn, getLevelColor, formatCompactCurrency, getMotivationalMessage } from '@/lib/utils';
import { Badge } from './badge';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from './card';
import { ProgressRing, Progress } from './progress';
import { Star, Trophy, Flame, Target, TrendingUp, Zap } from 'lucide-react';

// Level Progress Component
interface LevelProgressProps {
  currentXP: number;
  xpToNext: number;
  level: number;
  className?: string;
}

export const LevelProgress = React.forwardRef<HTMLDivElement, LevelProgressProps>(
  ({ currentXP, xpToNext, level, className }, ref) => {
    const progress = xpToNext > 0 ? (currentXP / (currentXP + xpToNext)) * 100 : 100;
    
    return (
      <Card ref={ref} variant="gradient" className={cn("p-6", className)}>
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center space-x-3">
            <Badge 
              variant="level" 
              size="xl"
              className="bg-gradient-to-r from-purple-500 to-pink-500 text-white font-bold shadow-lg"
            >
              <Trophy className="w-5 h-5 mr-2" />
              LVL {level}
            </Badge>
            <div>
              <h3 className="font-bold text-lg text-gray-900">Level {level}</h3>
              <p className="text-sm text-gray-600">Finance Apprentice</p>
            </div>
          </div>
          <Badge 
            variant="gradient" 
            size="lg"
            className="bg-gradient-to-r from-yellow-400 to-orange-500 text-white font-bold shadow-lg"
          >
            <Star className="w-4 h-4 mr-1" />
            {formatCompactCurrency(currentXP, '')} XP
          </Badge>
        </div>
        
        <div className="space-y-2">
          <div className="flex justify-between text-sm text-gray-600">
            <span>{currentXP} XP</span>
            <span>{xpToNext} XP to next level</span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-3 overflow-hidden">
            <div 
              className="h-full bg-gradient-to-r from-primary-500 to-secondary-500 rounded-full transition-all duration-1000 ease-out relative"
              style={{ width: `${Math.max(progress, 5)}%` }}
            >
              <div className="absolute inset-0 bg-white bg-opacity-30 animate-pulse" />
            </div>
          </div>
          <p className="text-xs text-gray-500 text-center">
            {getMotivationalMessage(progress)}
          </p>
        </div>
      </Card>
    );
  }
);
LevelProgress.displayName = "LevelProgress";