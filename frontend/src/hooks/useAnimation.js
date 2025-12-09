import { useState, useEffect } from 'react';

export const useAnimation = (duration = 1000) => {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    setIsVisible(true);
  }, []);

  const animate = (callback) => {
    setIsVisible(false);
    setTimeout(() => {
      callback();
      setIsVisible(true);
    }, duration);
  };

  return { animate, isVisible };
};