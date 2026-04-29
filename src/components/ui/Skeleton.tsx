import React from 'react';

interface SkeletonProps {
  className?: string;
  width?: string | number;
  height?: string | number;
  circle?: boolean;
}

export const Skeleton = ({ className = "", width, height, circle }: SkeletonProps) => {
  const style: React.CSSProperties = {
    width: width,
    height: height,
    borderRadius: circle ? '50%' : undefined
  };

  return (
    <div 
      className={`animate-skeleton-shimmer rounded-md bg-surface-variant/20 ${className}`} 
      style={style}
    />
  );
};

export const SkeletonText = ({ className = "", lines = 1 }: { className?: string; lines?: number }) => {
  return (
    <div className={`space-y-2 ${className}`}>
      {Array.from({ length: lines }).map((_, i) => (
        <Skeleton 
          key={i} 
          height="1em" 
          className={i === lines - 1 && lines > 1 ? "w-3/4" : "w-full"} 
        />
      ))}
    </div>
  );
};

export const SkeletonCircle = ({ size = 40, className = "" }: { size?: number; className?: string }) => {
  return <Skeleton circle width={size} height={size} className={className} />;
};

export const SkeletonBlock = ({ className = "", height = 100 }: { className?: string; height?: string | number }) => {
  return <Skeleton height={height} className={`w-full ${className}`} />;
};

export default Skeleton;
