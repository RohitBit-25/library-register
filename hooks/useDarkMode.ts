'use client';

/**
 * Hook to manage dark mode state.
 * Hardcoded to true for permanent Dark Mode.
 */
export function useDarkMode() {
  const isDark = true;
  const toggle = () => {
    // Permanent Dark Mode - Toggle Disabled
    console.log('Permanent Dark Mode is active.');
  };

  return { isDark, toggle };
}
