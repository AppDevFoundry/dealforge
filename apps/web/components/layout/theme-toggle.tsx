'use client';

import { Button } from '@/components/ui/button';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
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
    <TooltipProvider delayDuration={300}>
      <div className="flex items-center gap-0.5 rounded-lg border bg-muted/50 p-0.5">
        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              variant={theme === 'light' ? 'secondary' : 'ghost'}
              size="icon"
              className="h-7 w-7"
              onClick={() => setTheme('light')}
            >
              <Sun className="h-3.5 w-3.5" />
              <span className="sr-only">Light mode</span>
            </Button>
          </TooltipTrigger>
          <TooltipContent side="top" className="text-xs">
            Light
          </TooltipContent>
        </Tooltip>
        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              variant={theme === 'dark' ? 'secondary' : 'ghost'}
              size="icon"
              className="h-7 w-7"
              onClick={() => setTheme('dark')}
            >
              <Moon className="h-3.5 w-3.5" />
              <span className="sr-only">Dark mode</span>
            </Button>
          </TooltipTrigger>
          <TooltipContent side="top" className="text-xs">
            Dark
          </TooltipContent>
        </Tooltip>
        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              variant={theme === 'system' ? 'secondary' : 'ghost'}
              size="icon"
              className="h-7 w-7"
              onClick={() => setTheme('system')}
            >
              <Monitor className="h-3.5 w-3.5" />
              <span className="sr-only">System theme</span>
            </Button>
          </TooltipTrigger>
          <TooltipContent side="top" className="text-xs">
            System
          </TooltipContent>
        </Tooltip>
      </div>
    </TooltipProvider>
  );
}

// Compact theme toggle for collapsed sidebar - shows current theme icon, cycles on click
export function ThemeToggleCompact() {
  const { theme, setTheme, resolvedTheme } = useTheme();
  const [mounted, setMounted] = React.useState(false);

  React.useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return null;
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

  const getThemeLabel = () => {
    if (theme === 'system') {
      return `System (${resolvedTheme})`;
    }
    return theme === 'light' ? 'Light' : 'Dark';
  };

  return (
    <button
      onClick={cycleTheme}
      className="flex h-8 w-full items-center justify-center rounded-md p-2 text-sidebar-foreground/70 transition-colors hover:bg-sidebar-accent hover:text-sidebar-foreground"
      title={`Theme: ${getThemeLabel()}. Click to cycle.`}
    >
      {theme === 'light' && <Sun className="size-4" />}
      {theme === 'dark' && <Moon className="size-4" />}
      {theme === 'system' && <Monitor className="size-4" />}
      <span className="sr-only">Toggle theme (currently {getThemeLabel()})</span>
    </button>
  );
}
