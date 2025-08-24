import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

const progressVariants = cva(
  "relative h-2 w-full overflow-hidden rounded-full bg-gray-200",
  {
    variants: {
      variant: {
        default: "bg-gray-200",
        success: "bg-green-100",
        warning: "bg-yellow-100",
        danger: "bg-red-100",
      },
      size: {
        default: "h-2",
        sm: "h-1.5",
        lg: "h-3",
        xl: "h-4",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
);

interface ProgressProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof progressVariants> {
  value?: number;
}

const Progress = React.forwardRef<HTMLDivElement, ProgressProps>(
  ({ className, value = 0, variant, size, ...props }, ref) => {
    // Determine the color based on progress value
    const getProgressColor = (progress: number = 0) => {
      if (progress >= 100) return "bg-red-500";
      if (progress >= 85) return "bg-orange-500";
      if (progress >= 70) return "bg-yellow-500";
      return "bg-green-500";
    };

    return (
      <div
        ref={ref}
        className={cn(progressVariants({ variant, size }), className)}
        {...props}
      >
        <div
          className={cn(
            "h-full w-full flex-1 transition-all duration-500 ease-out rounded-full",
            getProgressColor(value)
          )}
          style={{ width: `${Math.min(Math.max(value, 0), 100)}%` }}
        />
      </div>
    );
  }
);
Progress.displayName = "Progress";

// Circular Progress Ring Component
interface ProgressRingProps {
  progress: number;
  size?: number;
  strokeWidth?: number;
  className?: string;
  children?: React.ReactNode;
  showText?: boolean;
}

const ProgressRing = React.forwardRef<HTMLDivElement, ProgressRingProps>(
  ({ progress, size = 120, strokeWidth = 8, className, children, showText = false }, ref) => {
    const radius = (size - strokeWidth) / 2;
    const circumference = radius * 2 * Math.PI;
    const strokeDasharray = `${circumference} ${circumference}`;
    const strokeDashoffset = circumference - (progress / 100) * circumference;

    // Dynamic color based on progress
    const getStrokeColor = () => {
      if (progress >= 100) return "#ef4444"; // red-500
      if (progress >= 85) return "#f97316"; // orange-500
      if (progress >= 70) return "#eab308"; // yellow-500
      return "#22c55e"; // green-500
    };

    return (
      <div ref={ref} className={cn("relative", className)} style={{ width: size, height: size }}>
        <svg
          className="transform -rotate-90"
          width={size}
          height={size}
          viewBox={`0 0 ${size} ${size}`}
        >
          {/* Background circle */}
          <circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            stroke="#e5e7eb"
            strokeWidth={strokeWidth}
            fill="transparent"
          />
          {/* Progress circle */}
          <circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            stroke={getStrokeColor()}
            strokeWidth={strokeWidth}
            fill="transparent"
            strokeDasharray={strokeDasharray}
            strokeDashoffset={strokeDashoffset}
            strokeLinecap="round"
            className="transition-all duration-500 ease-out"
          />
        </svg>
        
        {/* Center content */}
        <div className="absolute inset-0 flex items-center justify-center">
          {children || (showText && (
            <div className="text-center">
              <div className="text-lg font-bold text-gray-900">
                {Math.round(progress)}%
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }
);
ProgressRing.displayName = "ProgressRing";

export { Progress, ProgressRing };