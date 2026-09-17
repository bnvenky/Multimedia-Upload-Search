import { useEffect } from 'react';
import { useSelector } from 'react-redux';
import { selectTheme } from '../store/uiSlice';

/** Applies the theme to <html data-theme="..."> so the CSS variables (and Tailwind colors) switch. */
export const useThemeEffect = () => {
  const theme = useSelector(selectTheme);

  useEffect(() => {
    document.documentElement.dataset.theme = theme;
    document.querySelector('meta[name="theme-color"]')?.setAttribute('content', theme === 'dark' ? '#0a0b14' : '#f5f6fb');
  }, [theme]);
};
