import { useCallback, useRef, useEffect } from 'react';

interface ScrollConfig {
  scrollThreshold?: number;
  scrollSpeed?: number;
}

export function useAutoScroll(config: ScrollConfig = {}) {
  const {
    scrollThreshold = 50,
    scrollSpeed = 8,
  } = config;

  const scrollIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const scrollableRef = useRef<HTMLDivElement | null>(null);
  const isDraggingRef = useRef(false);
  const lastScrollDirectionRef = useRef<'left' | 'right' | null>(null);

  const clearScroll = useCallback(() => {
    if (scrollIntervalRef.current) {
      clearInterval(scrollIntervalRef.current);
      scrollIntervalRef.current = null;
    }
    lastScrollDirectionRef.current = null;
  }, []);

  const startAutoScroll = useCallback((scrollDirection: 'left' | 'right') => {
    // Only restart if direction changed
    if (lastScrollDirectionRef.current === scrollDirection && scrollIntervalRef.current) {
      return;
    }

    clearScroll();

    scrollIntervalRef.current = setInterval(() => {
      if (scrollableRef.current && isDraggingRef.current) {
        const scrollAmount = scrollDirection === 'left' ? -scrollSpeed : scrollSpeed;
        scrollableRef.current.scrollLeft += scrollAmount;
      }
    }, 16);

    lastScrollDirectionRef.current = scrollDirection;
  }, [scrollSpeed, clearScroll]);

  // Set dragging state - can be called from parent components
  const setDragging = useCallback((isDragging: boolean) => {
    isDraggingRef.current = isDragging;
    if (!isDragging) {
      clearScroll();
    }
  }, [clearScroll]);

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (!isDraggingRef.current || !scrollableRef.current) {
        return;
      }

      const rect = scrollableRef.current.getBoundingClientRect();
      const clientX = e.clientX;
      const maxScroll = scrollableRef.current.scrollWidth - scrollableRef.current.clientWidth;
      const canScrollRight = scrollableRef.current.scrollLeft < maxScroll;
      const canScrollLeft = scrollableRef.current.scrollLeft > 0;

      // Near right edge
      if (clientX > rect.right - scrollThreshold && canScrollRight) {
        startAutoScroll('right');
      }
      // Near left edge
      else if (clientX < rect.left + scrollThreshold && canScrollLeft) {
        startAutoScroll('left');
      }
      // Safe zone
      else {
        clearScroll();
      }
    };

    // Listen to DragDropContext's drag events via DOM
    const handleDragStart = () => {
      isDraggingRef.current = true;
    };

    const handleDragEnd = () => {
      isDraggingRef.current = false;
      clearScroll();
    };

    // Use capture phase for better detection
    document.addEventListener('mousedown', handleDragStart, true);
    document.addEventListener('mouseup', handleDragEnd, true);
    document.addEventListener('mousemove', handleMouseMove, true);
    document.addEventListener('dragend', handleDragEnd, true);
    document.addEventListener('drop', handleDragEnd, true);

    // Also listen for touch events
    document.addEventListener('touchstart', handleDragStart, true);
    document.addEventListener('touchend', handleDragEnd, true);
    document.addEventListener('touchmove', handleMouseMove, true);

    return () => {
      document.removeEventListener('mousedown', handleDragStart, true);
      document.removeEventListener('mouseup', handleDragEnd, true);
      document.removeEventListener('mousemove', handleMouseMove, true);
      document.removeEventListener('dragend', handleDragEnd, true);
      document.removeEventListener('drop', handleDragEnd, true);
      document.removeEventListener('touchstart', handleDragStart, true);
      document.removeEventListener('touchend', handleDragEnd, true);
      document.removeEventListener('touchmove', handleMouseMove, true);
      clearScroll();
    };
  }, [scrollThreshold, startAutoScroll, clearScroll]);

  return {
    scrollableRef,
    setDragging,
  };
}
