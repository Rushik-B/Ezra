"use client"

import * as React from "react"
import {
  Inbox,
  Clock,
  BarChart3,
  Settings2,
  Settings,
  Bot,
  LifeBuoy,
  Send,
  Circle,
  Star,
  Archive,
} from "lucide-react"
import { useSession } from "next-auth/react"

import { NavMain } from "@/components/navbar-components/nav-main"
import { NavProjects } from "@/components/navbar-components/nav-projects"
import { NavSecondary } from "@/components/navbar-components/nav-secondary"
import { NavUser } from "@/components/navbar-components/nav-user"
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/sidebar/sidebar"
import { PageType } from "@/types"

interface AppSidebarProps extends React.ComponentProps<typeof Sidebar> {
  activePage?: PageType;
  setActivePage?: (page: PageType) => void;
}

export function AppSidebar({ activePage, setActivePage, ...props }: AppSidebarProps) {
  const { data: session } = useSession()

  const navMain = [
    {
      title: "Inbox",
      url: "#",
      icon: Inbox,
      isActive: activePage === 'queue',
      pageType: 'queue' as PageType,
      description: "Email management"
    },
    {
      title: "Activity",
      url: "#",
      icon: Clock,
      isActive: activePage === 'history',
      pageType: 'history' as PageType,
      description: "Action history"
    },
    {
      title: "Analytics",
      url: "#",
      icon: BarChart3,
      isActive: activePage === 'metrics',
      pageType: 'metrics' as PageType,
      description: "Performance insights"
    },
    {
      title: "Voice & Rules",
      url: "#",
      icon: Settings2,
      isActive: activePage === 'voice',
      pageType: 'voice' as PageType,
      description: "AI behavior settings"
    },
    {
      title: "Settings",
      url: "#",
      icon: Settings,
      isActive: activePage === 'settings',
      pageType: 'settings' as PageType,
      description: "System preferences"
    },
  ]

  const emailLabels = [
    {
      name: "Important",
      url: "#",
      icon: Star,
      color: "text-amber-500"
    },
    {
      name: "Work",
      url: "#",
      icon: Circle,
      color: "text-blue-500"
    },
    {
      name: "Personal",
      url: "#",
      icon: Circle,
      color: "text-green-500"
    },
    {
      name: "Archive",
      url: "#",
      icon: Archive,
      color: "text-gray-500"
    },
  ]

  const navSecondary = [
    {
      title: "Support",
      url: "#",
      icon: LifeBuoy,
    },
    {
      title: "Feedback",
      url: "#",
      icon: Send,
    },
  ]

  const user = {
    name: session?.user?.name || "User",
    email: session?.user?.email || "user@example.com",
    avatar: session?.user?.image || "/avatars/default.jpg",
  }

  return (
    <Sidebar variant="inset" {...props}>
      <SidebarHeader>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton size="lg" asChild>
              <a href="#" onClick={(e) => {
                e.preventDefault()
                setActivePage?.('queue')
              }}>
                <div className="bg-sidebar-primary text-sidebar-primary-foreground flex aspect-square size-8 items-center justify-center rounded-lg">
                  <Bot className="size-4" />
                </div>
                <div className="grid flex-1 text-left text-sm leading-tight">
                  <span className="truncate font-medium">Ezra AI</span>
                  <span className="truncate text-xs">Email Assistant</span>
                </div>
              </a>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>
      <SidebarContent>
        <NavMain items={navMain} activePage={activePage} setActivePage={setActivePage} />
        <NavProjects projects={emailLabels} />
        <NavSecondary items={navSecondary} className="mt-auto" />
      </SidebarContent>
      <SidebarFooter>
        <NavUser user={user} setActivePage={setActivePage} />
      </SidebarFooter>
    </Sidebar>
  )
}
