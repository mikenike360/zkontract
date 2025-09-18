import React, { useState, useEffect, useRef } from 'react';

interface ResizableCardProps {
  children: React.ReactNode;
  className?: string;
  defaultHeight?: number;
  minHeight?: number;
  maxHeight?: number;
  storageKey?: string;
  onResize?: (height: number) => void;
}

export default function ResizableCard({
  children,
  className = '',
  defaultHeight = 400,
  minHeight = 300,
  maxHeight = 800,
  storageKey,
  onResize
}: ResizableCardProps) {
  const [height, setHeight] = useState(defaultHeight);
  const [isResizing, setIsResizing] = useState(false);
  const cardRef = useRef<HTMLDivElement>(null);
  const resizeRef = useRef<HTMLDivElement>(null);

  // Load height from localStorage on mount
  useEffect(() => {
    if (storageKey && typeof window !== 'undefined') {
      const saved = localStorage.getItem(storageKey);
      if (saved) {
        try {
          const { height: savedHeight } = JSON.parse(saved);
          setHeight(savedHeight);
        } catch (error) {
          console.warn('Failed to parse saved height:', error);
        }
      }
    }
  }, [storageKey]);

  // Save height to localStorage
  const saveHeight = (newHeight: number) => {
    if (storageKey && typeof window !== 'undefined') {
      localStorage.setItem(storageKey, JSON.stringify({ height: newHeight }));
    }
    onResize?.(newHeight);
  };

  const handleMouseDown = (e: React.MouseEvent) => {
    e.preventDefault();
    setIsResizing(true);
  };

  const handleMouseMove = (e: MouseEvent) => {
    if (!isResizing || !cardRef.current) return;

    const rect = cardRef.current.getBoundingClientRect();
    const newHeight = Math.max(minHeight, Math.min(maxHeight, e.clientY - rect.top));

    setHeight(newHeight);
  };

  const handleMouseUp = () => {
    if (isResizing) {
      setIsResizing(false);
      saveHeight(height);
    }
  };

  useEffect(() => {
    if (isResizing) {
      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('mouseup', handleMouseUp);
      document.body.style.cursor = 'ns-resize';
      document.body.style.userSelect = 'none';
    }

    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
      document.body.style.cursor = '';
      document.body.style.userSelect = '';
    };
  }, [isResizing, height]);

  return (
    <div
      ref={cardRef}
      className={`relative bg-base-100 border border-base-300 rounded-xl shadow-lg ${className}`}
      style={{
        height: `${height}px`,
        minHeight: `${minHeight}px`,
        maxHeight: `${maxHeight}px`
      }}
    >
      {/* Content */}
      <div className="h-full overflow-auto">
        {children}
      </div>

      {/* Resize handle - bottom center */}
      <div
        ref={resizeRef}
        className={`absolute bottom-0 left-1/2 transform -translate-x-1/2 w-8 h-2 cursor-ns-resize ${
          isResizing ? 'bg-primary/50' : 'bg-base-300 hover:bg-primary/30'
        } transition-colors duration-200 rounded-t`}
        onMouseDown={handleMouseDown}
      >
        {/* Resize indicator dots */}
        <div className="flex justify-center items-center h-full">
          <div className="flex space-x-1">
            <div className="w-1 h-1 bg-base-content/40 rounded-full"></div>
            <div className="w-1 h-1 bg-base-content/40 rounded-full"></div>
            <div className="w-1 h-1 bg-base-content/40 rounded-full"></div>
          </div>
        </div>
      </div>

      {/* Resize indicator */}
      {isResizing && (
        <div className="absolute top-2 right-2 bg-base-300/90 text-xs px-2 py-1 rounded-md text-base-content/80">
          {Math.round(height)}px height
        </div>
      )}
    </div>
  );
}
