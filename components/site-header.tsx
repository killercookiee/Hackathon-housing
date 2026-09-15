"use client"

import Link from "next/link"
import { useRouter } from "next/navigation"
import { authClient } from "@/lib/auth-client"
import { Button } from "@/components/ui/button"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Sparkles, LogOut } from "lucide-react"

export function SiteHeader({ user }: { user: { name: string; email: string } }) {
  const router = useRouter()

  const initials =
    user.name
      .split(" ")
      .map((part) => part[0])
      .slice(0, 2)
      .join("")
      .toUpperCase() || "U"

  const handleSignOut = async () => {
    await authClient.signOut()
    router.push("/sign-in")
    router.refresh()
  }

  return (
    <header className="border-b border-border">
      <div className="mx-auto flex h-14 max-w-6xl items-center justify-between px-4 sm:px-6">
        <Link href="/dashboard" className="flex items-center gap-2 font-semibold text-foreground">
          <span className="flex size-7 items-center justify-center rounded-md bg-primary text-primary-foreground">
            <Sparkles className="size-4" />
          </span>
          Cortex
        </Link>
        <DropdownMenu>
          <DropdownMenuTrigger render={<Button variant="ghost" size="sm" className="gap-2" />}>
            <Avatar className="size-6">
              <AvatarFallback className="text-[11px]">{initials}</AvatarFallback>
            </Avatar>
            <span className="hidden text-sm sm:inline">{user.name}</span>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuLabel className="truncate">{user.email}</DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuGroup>
              <DropdownMenuItem onClick={handleSignOut}>
                <LogOut data-icon="inline-start" />
                Sign out
              </DropdownMenuItem>
            </DropdownMenuGroup>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  )
}
