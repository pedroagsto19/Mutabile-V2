import { useState, useEffect, useRef } from 'react';
import type { Timer } from '../types';

export function useTimer() {
  const [activeTimer, setActiveTimer] = useState<Timer | null>(null);
  const intervalRef = useRef<NodeJS.Timeout>();

  useEffect(() => {
    if (activeTimer?.isActive) {
      intervalRef.current = setInterval(() => {
        // Force re-render to update elapsed time display
        setActiveTimer(timer => timer ? { ...timer } : null);
      }, 1000);
    } else {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    }

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [activeTimer?.isActive]);

  const startTimer = (activityId: string) => {
    setActiveTimer({
      activityId,
      startTime: new Date(),
      isActive: true
    });
  };

  const stopTimer = () => {
    if (activeTimer && activeTimer.isActive) {
      const endTime = new Date();
      const elapsed = (endTime.getTime() - activeTimer.startTime.getTime()) / (1000 * 60 * 60); // hours
      setActiveTimer(null);
      return elapsed;
    }
    return 0;
  };

  const getElapsedTime = () => {
    if (activeTimer && activeTimer.isActive) {
      const now = new Date();
      return (now.getTime() - activeTimer.startTime.getTime()) / (1000 * 60 * 60); // hours
    }
    return 0;
  };

  return {
    activeTimer,
    startTimer,
    stopTimer,
    getElapsedTime
  };
}