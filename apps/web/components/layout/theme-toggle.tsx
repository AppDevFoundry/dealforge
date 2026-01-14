'use client';

import { Button } from '@/components/ui/button';
import { Monitor, Moon, Sun } from 'lucide-react';
import { useTheme } from 'next-themes';
import * as React from 'react';

export function ThemeToggle() {
  const { theme, setTheme, resolvedTheme } = useTheme();
  const [mounted, setMounted] = React.useState(false);

  // Prevent hydration mismatch
  React.useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return (
      <Button variant="ghost" size="icon" className="h-9 w-9" disabled>
        <Sun className="h-4 w-4" />
        <span className="sr-only">Toggle theme</span>
      </Button>
    );
  }

  // Cycle through: light → dark → system
  const cycleTheme = () => {
    if (theme === 'light') {
      setTheme('dark');
    } else if (theme === 'dark') {
      setTheme('system');
    } else {
      setTheme('light');
    }
  };

  return (
    <Button
      variant="ghost"
      size="icon"
      className="h-9 w-9 transition-colors"
      onClick={cycleTheme}
      title={`Current: ${theme === 'system' ? `system (${resolvedTheme})` : theme}`}
    >
      {theme === 'light' && <Sun className="h-4 w-4" />}
      {theme === 'dark' && <Moon className="h-4 w-4" />}
      {theme === 'system' && <Monitor className="h-4 w-4" />}
      <span className="sr-only">
        Toggle theme (currently {theme === 'system' ? `system (${resolvedTheme})` : theme})
      </span>
    </Button>
  );
}

export function ThemeToggleWithLabel() {
  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = React.useState(false);

  React.useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return null;
  }

  return (
    <div className="flex items-center gap-0.5 rounded-lg border bg-muted/50 p-0.5">
      <Button
        variant={theme === 'light' ? 'secondary' : 'ghost'}
        size="sm"
        className="h-7 flex-1 min-w-0 px-1.5 text-xs"
        onClick={() => setTheme('light')}
      >
        <Sun className="mr-1 h-3 w-3 shrink-0" />
        <span className="truncate">Light</span>
      </Button>
      <Button
        variant={theme === 'dark' ? 'secondary' : 'ghost'}
        size="sm"
        className="h-7 flex-1 min-w-0 px-1.5 text-xs"
        onClick={() => setTheme('dark')}
      >
        <Moon className="mr-1 h-3 w-3 shrink-0" />
        <span className="truncate">Dark</span>
      </Button>
      <Button
        variant={theme === 'system' ? 'secondary' : 'ghost'}
        size="sm"
        className="h-7 flex-1 min-w-0 px-1.5 text-xs"
        onClick={() => setTheme('system')}
      >
        <Monitor className="mr-1 h-3 w-3 shrink-0" />
        <span className="truncate">Sys</span>
      </Button>
    </div>
  );
}
