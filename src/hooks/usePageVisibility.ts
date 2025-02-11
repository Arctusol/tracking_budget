import { useEffect } from 'react';

export function usePageVisibility() {
  useEffect(() => {
    let timeoutId: NodeJS.Timeout;

    const handleVisibilityChange = () => {
      if (document.hidden) {
        // Page est cachée
        clearTimeout(timeoutId);
      } else {
        // Page redevient visible
        // Attendre un court instant avant de réactiver les requêtes
        timeoutId = setTimeout(() => {
          // Ne rien faire, juste empêcher le refresh
        }, 100);
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);

    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      clearTimeout(timeoutId);
    };
  }, []);
} 