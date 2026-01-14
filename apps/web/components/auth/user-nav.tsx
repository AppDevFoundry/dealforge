'use client';

import { Button } from '@/components/ui/button';
import { signOut } from '@/lib/auth-client';
import { useRouter } from 'next/navigation';

interface UserNavProps {
  user: {
    id: string;
    name: string | null;
    email: string;
    image?: string | null;
  };
}

export function UserNav({ user }: UserNavProps) {
  const router = useRouter();

  const handleSignOut = async () => {
    await signOut();
    router.push('/');
    router.refresh();
  };

  return (
    <div className="flex items-center gap-4">
      <span className="text-sm text-muted-foreground">{user.name || user.email}</span>
      <Button variant="ghost" size="sm" onClick={handleSignOut}>
        Sign Out
      </Button>
    </div>
  );
}
