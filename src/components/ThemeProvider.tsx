"use client";

import { createContext, useContext, useEffect } from "react";

type Theme = "light" | "dark";

const defaultThemeValue = {
  theme: "dark" as Theme,
  setTheme: (_t: Theme) => {},
  toggleTheme: () => {},
};

const ThemeContext = createContext(defaultThemeValue);

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  useEffect(() => {
    document.documentElement.classList.add("dark");
  }, []);

  return (
    <ThemeContext.Provider value={defaultThemeValue}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  return useContext(ThemeContext);
}
