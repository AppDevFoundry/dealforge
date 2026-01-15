'use client';

import {
  Calculator,
  FolderKanban,
  HelpCircle,
  LayoutDashboard,
  LogOut,
  Menu,
  Settings,
  Sparkles,
  X,
} from 'lucide-react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import * as React from 'react';

import { ThemeToggle } from '@/components/layout/theme-toggle';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import {
  Sheet,
  SheetClose,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from '@/components/ui/sheet';
import { signOut } from '@/lib/auth-client';

interface MobileNavProps {
  user: {
    id: string;
    name: string;
    email: string;
    image?: string | null;
  };
}

const navItems = [
  {
    title: 'Dashboard',
    href: '/dashboard',
    icon: LayoutDashboard,
  },
  {
    title: 'My Deals',
    href: '/deals',
    icon: FolderKanban,
  },
  {
    title: 'Analyze',
    href: '/analyze',
    icon: Calculator,
  },
];

const secondaryItems = [
  {
    title: 'Settings',
    href: '/settings',
    icon: Settings,
  },
  {
    title: 'Help & Docs',
    href: '/docs',
    icon: HelpCircle,
  },
];

export function MobileNav({ user }: MobileNavProps) {
  const pathname = usePathname();
  const [open, setOpen] = React.useState(false);

  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map((n) => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  const handleSignOut = async () => {
    await signOut();
  };

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>
        <Button variant="ghost" size="icon" className="md:hidden">
          <Menu className="size-5" />
          <span className="sr-only">Toggle navigation menu</span>
        </Button>
      </SheetTrigger>
      <SheetContent side="left" className="w-80 p-0">
        <SheetHeader className="border-b px-6 py-4">
          <div className="flex items-center justify-between">
            <SheetTitle asChild>
              <Link
                href="/dashboard"
                className="flex items-center gap-3"
                onClick={() => setOpen(false)}
              >
                <div className="flex aspect-square size-8 items-center justify-center rounded-lg bg-primary text-primary-foreground">
                  <Sparkles className="size-4" />
                </div>
                <span className="font-semibold tracking-tight">DealForge</span>
              </Link>
            </SheetTitle>
            <SheetClose asChild>
              <Button variant="ghost" size="icon" className="size-8">
                <X className="size-4" />
                <span className="sr-only">Close menu</span>
              </Button>
            </SheetClose>
          </div>
        </SheetHeader>

        <div className="flex flex-col h-[calc(100dvh-var(--mobile-header-height,73px))]">
          {/* Main Navigation */}
          <nav className="flex-1 overflow-y-auto px-4 py-4">
            <div className="space-y-1">
              <p className="px-3 text-xs font-medium uppercase tracking-wider text-muted-foreground mb-2">
                Main
              </p>
              {navItems.map((item) => {
                const isActive = pathname === item.href || pathname.startsWith(`${item.href}/`);
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    onClick={() => setOpen(false)}
                    className={`flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors ${
                      isActive
                        ? 'bg-accent text-accent-foreground'
                        : 'text-muted-foreground hover:bg-accent/50 hover:text-foreground'
                    }`}
                  >
                    <item.icon className="size-5" />
                    {item.title}
                  </Link>
                );
              })}
            </div>

            <Separator className="my-4" />

            <div className="space-y-1">
              <p className="px-3 text-xs font-medium uppercase tracking-wider text-muted-foreground mb-2">
                Support
              </p>
              {secondaryItems.map((item) => {
                const isActive = pathname === item.href;
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    onClick={() => setOpen(false)}
                    className={`flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors ${
                      isActive
                        ? 'bg-accent text-accent-foreground'
                        : 'text-muted-foreground hover:bg-accent/50 hover:text-foreground'
                    }`}
                  >
                    <item.icon className="size-5" />
                    {item.title}
                  </Link>
                );
              })}
            </div>

            <Separator className="my-4" />

            <div className="px-3">
              <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground mb-3">
                Appearance
              </p>
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Theme</span>
                <ThemeToggle />
              </div>
            </div>
          </nav>

          {/* User Section */}
          <div className="border-t px-4 py-4">
            <div className="flex items-center gap-3 rounded-lg bg-muted/50 px-3 py-3 mb-3">
              <Avatar className="size-10">
                <AvatarImage src={user.image ?? undefined} alt={user.name} />
                <AvatarFallback className="bg-primary/10 text-primary text-sm font-medium">
                  {getInitials(user.name)}
                </AvatarFallback>
              </Avatar>
              <div className="flex-1 overflow-hidden">
                <p className="truncate text-sm font-medium">{user.name}</p>
                <p className="truncate text-xs text-muted-foreground">{user.email}</p>
              </div>
            </div>
            <Button
              variant="ghost"
              className="w-full justify-start text-destructive hover:text-destructive hover:bg-destructive/10"
              onClick={handleSignOut}
            >
              <LogOut className="mr-2 size-4" />
              Sign out
            </Button>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
}

export function MobileHeader({ user }: MobileNavProps) {
  return (
    <header className="sticky top-0 z-50 flex h-14 items-center justify-between border-b bg-background px-4 md:hidden">
      <div className="flex items-center gap-2">
        <MobileNav user={user} />
        <Link href="/dashboard" className="flex items-center gap-2">
          <div className="flex aspect-square size-7 items-center justify-center rounded-lg bg-primary text-primary-foreground">
            <Sparkles className="size-3.5" />
          </div>
          <span className="font-semibold">DealForge</span>
        </Link>
      </div>
      <ThemeToggle />
    </header>
  );
}
