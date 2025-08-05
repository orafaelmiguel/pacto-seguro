// src/components/specific/UserNav.tsx
import { Button } from "@/components/ui/button";
import { signOut } from "@/app/dashboard/actions";

export function UserNav() {
  return (
    <form action={signOut}>
      <Button type="submit" variant="ghost">
        Sair
      </Button>
    </form>
  );
}
