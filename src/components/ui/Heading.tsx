import React from 'react';

interface HeadingProps {
  level?: 1 | 2 | 3 | 4 | 5 | 6;
  children: React.ReactNode;
  className?: string;
  id?: string;
}

const Heading: React.FC<HeadingProps> = ({
  level = 2,
  children,
  className = '',
  id,
}) => {
  const Tag = `h${level}` as keyof React.JSX.IntrinsicElements;

  const baseStyles = 'font-headline font-bold tracking-tight text-foreground';
  
  const levels = {
    1: 'text-4xl sm:text-5xl lg:text-6xl leading-[1.1]',
    2: 'text-2xl sm:text-3xl lg:text-4xl leading-tight',
    3: 'text-xl sm:text-2xl lg:text-3xl leading-tight',
    4: 'text-lg sm:text-xl lg:text-2xl leading-snug',
    5: 'text-base sm:text-lg lg:text-xl font-bold',
    6: 'text-sm sm:text-base font-bold uppercase tracking-wider',
  };

  const combinedClasses = `${baseStyles} ${levels[level]} ${className}`.trim();

  return (
    <Tag className={combinedClasses} id={id}>
      {children}
    </Tag>
  );
};

export default Heading;
