'use client';
import {
  AlertTriangle,
  BarChart3,
  Calculator,
  ChevronRight,
  ChevronUp,
  FolderKanban,
  HelpCircle,
  Home,
  LayoutDashboard,
  LogOut,
  Map as MapIcon,
  PanelLeftClose,
  PanelLeftOpen,
  Search,
  Settings,
  Sparkles,
} from 'lucide-react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';

import { ThemeToggleCompact, ThemeToggleWithLabel } from '@/components/layout/theme-toggle';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarMenuSub,
  SidebarMenuSubButton,
  SidebarMenuSubItem,
  SidebarRail,
  useSidebar,
} from '@/components/ui/sidebar';
import { signOut } from '@/lib/auth-client';

interface AppSidebarProps {
  user: {
    id: string;
    name: string;
    email: string;
    image?: string | null;
  };
}

const mainNavItems = [
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
    title: 'MH Parks',
    href: '/mh-parks',
    icon: Home,
    subItems: [
      {
        title: 'Map',
        href: '/mh-parks',
        icon: MapIcon,
      },
      {
        title: 'Dashboard',
        href: '/mh-parks/dashboard',
        icon: BarChart3,
      },
      {
        title: 'Search',
        href: '/mh-parks/search',
        icon: Search,
      },
      {
        title: 'Calculator',
        href: '/mh-parks/calculator',
        icon: Calculator,
      },
      {
        title: 'Distressed',
        href: '/mh-parks/distressed',
        icon: AlertTriangle,
      },
    ],
  },
  {
    title: 'Analyze',
    href: '/analyze',
    icon: Calculator,
  },
];

const secondaryNavItems = [
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

export function AppSidebar({ user }: AppSidebarProps) {
  const pathname = usePathname();
  const { state, toggleSidebar } = useSidebar();

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
    <Sidebar collapsible="icon" className="border-r border-sidebar-border">
      {/* Header with Logo */}
      <SidebarHeader className="border-b border-sidebar-border">
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton asChild size="lg" className="hover:bg-sidebar-accent">
              <Link href="/dashboard" className="flex items-center gap-3 group/logo">
                <div className="flex aspect-square size-8 items-center justify-center rounded-lg bg-primary text-primary-foreground transition-[transform,box-shadow] duration-300 group-hover/logo:scale-105 dark:shadow-[0_0_15px_hsl(var(--primary)/0.4)]">
                  <Sparkles className="size-4 transition-transform duration-300 group-hover/logo:rotate-12" />
                </div>
                <div className="flex flex-col gap-0.5 leading-none">
                  <span className="font-semibold tracking-tight">DealForge</span>
                  <span className="text-xs text-muted-foreground">Real Estate Analysis</span>
                </div>
              </Link>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>

      {/* Main Navigation */}
      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
            Main
          </SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {mainNavItems.map((item) => {
                const isActive = pathname === item.href || pathname.startsWith(`${item.href}/`);
                const hasSubItems = 'subItems' in item && item.subItems && item.subItems.length > 0;

                if (hasSubItems && item.subItems) {
                  return (
                    <Collapsible
                      key={item.href}
                      asChild
                      defaultOpen={isActive}
                      className="group/collapsible"
                    >
                      <SidebarMenuItem>
                        <CollapsibleTrigger asChild>
                          <SidebarMenuButton
                            tooltip={item.title}
                            className={`
                              transition-colors duration-200
                              ${
                                isActive
                                  ? 'bg-sidebar-accent text-sidebar-accent-foreground font-medium'
                                  : 'text-sidebar-foreground/70 hover:text-sidebar-foreground hover:bg-sidebar-accent/50'
                              }
                            `}
                          >
                            <item.icon
                              className={`size-4 transition-transform duration-200 ${isActive ? 'text-primary' : ''}`}
                            />
                            <span>{item.title}</span>
                            <ChevronRight className="ml-auto size-4 transition-transform duration-200 group-data-[state=open]/collapsible:rotate-90" />
                          </SidebarMenuButton>
                        </CollapsibleTrigger>
                        <CollapsibleContent>
                          <SidebarMenuSub>
                            {item.subItems.map((subItem) => {
                              const isSubActive = pathname === subItem.href;
                              return (
                                <SidebarMenuSubItem key={subItem.href}>
                                  <SidebarMenuSubButton
                                    asChild
                                    isActive={isSubActive}
                                    className={isSubActive ? 'font-medium' : ''}
                                  >
                                    <Link href={subItem.href}>
                                      <subItem.icon className="size-4" />
                                      <span>{subItem.title}</span>
                                    </Link>
                                  </SidebarMenuSubButton>
                                </SidebarMenuSubItem>
                              );
                            })}
                          </SidebarMenuSub>
                        </CollapsibleContent>
                      </SidebarMenuItem>
                    </Collapsible>
                  );
                }

                return (
                  <SidebarMenuItem key={item.href}>
                    <SidebarMenuButton
                      asChild
                      isActive={isActive}
                      tooltip={item.title}
                      className={`
                        transition-colors duration-200
                        ${
                          isActive
                            ? 'bg-sidebar-accent text-sidebar-accent-foreground font-medium border-accent-left'
                            : 'text-sidebar-foreground/70 hover:text-sidebar-foreground hover:bg-sidebar-accent/50'
                        }
                      `}
                    >
                      <Link href={item.href} className="group/nav">
                        <item.icon
                          className={`size-4 transition-transform duration-200 ${isActive ? 'text-primary' : 'group-hover/nav:scale-110'}`}
                        />
                        <span>{item.title}</span>
                      </Link>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                );
              })}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        <SidebarGroup>
          <SidebarGroupLabel className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
            Support
          </SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {secondaryNavItems.map((item) => {
                const isActive = pathname === item.href;
                return (
                  <SidebarMenuItem key={item.href}>
                    <SidebarMenuButton
                      asChild
                      isActive={isActive}
                      tooltip={item.title}
                      className={`
                        transition-colors duration-200
                        ${
                          isActive
                            ? 'bg-sidebar-accent text-sidebar-accent-foreground font-medium border-accent-left'
                            : 'text-sidebar-foreground/70 hover:text-sidebar-foreground hover:bg-sidebar-accent/50'
                        }
                      `}
                    >
                      <Link href={item.href} className="group/nav">
                        <item.icon
                          className={`size-4 transition-transform duration-200 ${isActive ? 'text-primary' : 'group-hover/nav:scale-110'}`}
                        />
                        <span>{item.title}</span>
                      </Link>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                );
              })}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        {/* Theme Toggle - adapts to sidebar state */}
        <SidebarGroup className="mt-auto">
          <SidebarGroupContent>
            {state === 'expanded' ? (
              <div className="px-2 py-1">
                <ThemeToggleWithLabel />
              </div>
            ) : (
              <div className="flex justify-center py-1">
                <ThemeToggleCompact />
              </div>
            )}
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>

      {/* Footer with User */}
      <SidebarFooter className="border-t border-sidebar-border">
        {/* Collapse/Expand trigger - adapts to sidebar state */}
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton
              tooltip={state === 'expanded' ? 'Collapse sidebar' : 'Expand sidebar'}
              onClick={toggleSidebar}
              className="text-sidebar-foreground/70 hover:text-sidebar-foreground hover:bg-sidebar-accent/50 transition-colors duration-200"
            >
              {state === 'expanded' ? (
                <>
                  <PanelLeftClose className="size-4" />
                  <span>Collapse</span>
                </>
              ) : (
                <PanelLeftOpen className="size-4" />
              )}
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
        <SidebarMenu>
          <SidebarMenuItem>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <SidebarMenuButton
                  size="lg"
                  className="w-full hover:bg-sidebar-accent data-[state=open]:bg-sidebar-accent"
                >
                  <Avatar className="size-8">
                    <AvatarImage src={user.image ?? undefined} alt={user.name} />
                    <AvatarFallback className="bg-primary/10 text-primary text-xs font-medium">
                      {getInitials(user.name)}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex flex-1 flex-col gap-0.5 overflow-hidden text-left leading-tight">
                    <span className="truncate text-sm font-medium">{user.name}</span>
                    <span className="truncate text-xs text-muted-foreground">{user.email}</span>
                  </div>
                  <ChevronUp className="ml-auto size-4 text-muted-foreground" />
                </SidebarMenuButton>
              </DropdownMenuTrigger>
              <DropdownMenuContent
                side="top"
                align="start"
                className="w-[--radix-dropdown-menu-trigger-width] min-w-56"
              >
                <div className="flex items-center gap-2 p-2">
                  <Avatar className="size-10">
                    <AvatarImage src={user.image ?? undefined} alt={user.name} />
                    <AvatarFallback className="bg-primary/10 text-primary">
                      {getInitials(user.name)}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex flex-col gap-0.5">
                    <span className="text-sm font-medium">{user.name}</span>
                    <span className="text-xs text-muted-foreground">{user.email}</span>
                  </div>
                </div>
                <DropdownMenuSeparator />
                <DropdownMenuItem asChild>
                  <Link href="/settings" className="cursor-pointer">
                    <Settings className="mr-2 size-4" />
                    Settings
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuItem asChild>
                  <Link href="/docs" className="cursor-pointer">
                    <HelpCircle className="mr-2 size-4" />
                    Help & Documentation
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem
                  onClick={handleSignOut}
                  className="cursor-pointer text-destructive focus:text-destructive"
                >
                  <LogOut className="mr-2 size-4" />
                  Sign out
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarFooter>

      <SidebarRail />
    </Sidebar>
  );
}
