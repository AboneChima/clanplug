'use client';

import { useEffect, useState, useCallback, useRef } from 'react';

interface UsePageVisibilityOptions {
  onVisibilityChange?: (isVisible: boolean) => void;
  onBecomeVisible?: () => void;
  onBecomeHidden?: () => void;
  refreshOnVisible?: boolean;
  refreshDelay?: number;
}

export function usePageVisibility(options: UsePageVisibilityOptions = {}) {
  const [isVisible, setIsVisible] = useState(true);
  const [wasHidden, setWasHidden] = useState(false);
  const refreshTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  
  const {
    onVisibilityChange,
    onBecomeVisible,
    onBecomeHidden,
    refreshOnVisible = false,
    refreshDelay = 500
  } = options;

  const handleVisibilityChange = useCallback(() => {
    const visible = !document.hidden;
    setIsVisible(visible);
    
    if (visible && wasHidden) {
      // Page became visible after being hidden
      setWasHidden(false);
      
      if (refreshOnVisible) {
        // Clear any existing timeout
        if (refreshTimeoutRef.current) {
          clearTimeout(refreshTimeoutRef.current);
        }
        
        // Delay refresh to ensure page is fully visible
        refreshTimeoutRef.current = setTimeout(() => {
          onBecomeVisible?.();
        }, refreshDelay);
      } else {
        onBecomeVisible?.();
      }
    } else if (!visible) {
      // Page became hidden
      setWasHidden(true);
      onBecomeHidden?.();
    }
    
    onVisibilityChange?.(visible);
  }, [wasHidden, onVisibilityChange, onBecomeVisible, onBecomeHidden, refreshOnVisible, refreshDelay]);

  useEffect(() => {
    // Set initial visibility state
    setIsVisible(!document.hidden);
    
    // Add event listeners
    document.addEventListener('visibilitychange', handleVisibilityChange);
    window.addEventListener('focus', handleVisibilityChange);
    window.addEventListener('blur', handleVisibilityChange);
    
    return () => {
      // Cleanup
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      window.removeEventListener('focus', handleVisibilityChange);
      window.removeEventListener('blur', handleVisibilityChange);
      
      if (refreshTimeoutRef.current) {
        clearTimeout(refreshTimeoutRef.current);
      }
    };
  }, [handleVisibilityChange]);

  return {
    isVisible,
    wasHidden,
    isHidden: !isVisible
  };
}

// Enhanced hook for data fetching with visibility handling
export function useVisibilityRefresh(
  refreshFunction: () => void | Promise<void>,
  dependencies: any[] = [],
  options: {
    refreshOnVisible?: boolean;
    refreshDelay?: number;
    enabled?: boolean;
  } = {}
) {
  const { refreshOnVisible = true, refreshDelay = 500, enabled = true } = options;
  const refreshFunctionRef = useRef(refreshFunction);
  const isRefreshingRef = useRef(false);
  
  // Update ref when function changes
  useEffect(() => {
    refreshFunctionRef.current = refreshFunction;
  }, [refreshFunction]);

  const handleRefresh = useCallback(async () => {
    if (!enabled || isRefreshingRef.current) return;
    
    try {
      isRefreshingRef.current = true;
      await refreshFunctionRef.current();
    } catch (error) {
      console.error('Error during visibility refresh:', error);
    } finally {
      isRefreshingRef.current = false;
    }
  }, [enabled]);

  const { isVisible } = usePageVisibility({
    onBecomeVisible: refreshOnVisible ? handleRefresh : undefined,
    refreshOnVisible: refreshOnVisible,
    refreshDelay
  });

  // Also refresh when dependencies change
  useEffect(() => {
    if (enabled && isVisible) {
      handleRefresh();
    }
  }, [...dependencies, enabled, isVisible]);

  return {
    isVisible,
    refresh: handleRefresh,
    isRefreshing: isRefreshingRef.current
  };
}