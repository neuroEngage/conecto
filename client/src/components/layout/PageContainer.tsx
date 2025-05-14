import { ReactNode } from 'react';

interface PageContainerProps {
  children: ReactNode;
  className?: string;
  narrow?: boolean;
}

export default function PageContainer({ 
  children, 
  className = "", 
  narrow = false 
}: PageContainerProps) {
  return (
    <main className={`container mx-auto px-4 py-6 ${narrow ? 'max-w-4xl' : 'max-w-7xl'} ${className}`}>
      {children}
    </main>
  );
}
