"use client"

import * as React from "react"
import {
  BarChart3,
  Bot,
  Clock,
  Folder,
  FolderOpen,
  Inbox,
  LifeBuoy,
  Settings,
  Settings2,
  Sparkles,
  UserCircle,
} from "lucide-react"
import { useSession } from "next-auth/react"

import { NavMain } from "@/components/nav-main"
import { NavProjects } from "@/components/nav-projects"
import { NavSecondary } from "@/components/nav-secondary"
import { NavUser } from "@/components/nav-user"
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/sidebar"
import { PageType } from "@/types"

// Data for the sidebar
const navMain = [
  {
    title: "Inbox",
    url: "#",
    icon: Inbox,
    isActive: true,
    pageType: "queue" as PageType,
  },
  {
    title: "Activity",
    url: "#",
    icon: Clock,
    pageType: "history" as PageType,
  },
  {
    title: "Analytics",
    url: "#",
    icon: BarChart3,
    pageType: "metrics" as PageType,
  },
  {
    title: "Voice & Rules",
    url: "#",
    icon: Settings2,
    pageType: "voice" as PageType,
  },
  {
    title: "Settings",
    url: "#",
    icon: Settings,
    pageType: "settings" as PageType,
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
    icon: Sparkles,
  },
]

// Email groups/folders
const emailGroups = [
  {
    name: "Work",
    url: "#",
    icon: Folder,
  },
  {
    name: "Personal",
    url: "#",
    icon: FolderOpen,
  },
  {
    name: "Important",
    url: "#",
    icon: Folder,
  },
]

export function AppSidebar({ 
  activePage, 
  setActivePage,
  ...props 
}: React.ComponentProps<typeof Sidebar> & {
  activePage: PageType
  setActivePage: (page: PageType) => void
}) {
  const { data: session } = useSession()

  // Update nav items with active state
  const updatedNavMain = navMain.map(item => ({
    ...item,
    isActive: item.pageType === activePage,
  }))

  const user = {
    name: session?.user?.name || "User",
    email: session?.user?.email || "user@example.com",
    avatar: session?.user?.image || "/avatars/default.jpg",
  }

  const handleNavClick = (pageType: PageType) => {
    setActivePage(pageType)
  }

  return (
    <Sidebar variant="inset" collapsible="icon" className="border-r border-gray-200/80 shadow-sm bg-white" {...props}>
      <SidebarHeader className="border-b border-gray-200/80">
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton size="lg" asChild>
              <a href="#" onClick={() => setActivePage('queue')} className="hover:bg-gray-100">
                <div className="bg-gradient-to-br from-gray-700 to-gray-900 text-white flex aspect-square size-9 items-center justify-center rounded-lg shadow-md">
                  <Bot className="size-5" />
                </div>
                <div className="grid flex-1 text-left text-sm leading-tight">
                  <span className="truncate font-semibold text-gray-800">Ezra AI</span>
                  <span className="truncate text-xs text-gray-500">Email Assistant</span>
                </div>
              </a>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>
      <SidebarContent className="bg-white">
        {/* Main Navigation */}
        <div className="px-3 py-4">
          <div className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2 px-2">
            Navigation
          </div>
          <div className="space-y-1">
            {updatedNavMain.map((item) => (
              <button
                key={item.title}
                onClick={() => handleNavClick(item.pageType)}
                className={`w-full flex items-center gap-3 px-3 py-2 text-sm rounded-lg transition-all duration-200 ${
                  item.isActive 
                    ? 'bg-gray-100 text-gray-900 font-semibold' 
                    : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900'
                }`}
              >
                <item.icon className="h-5 w-5" />
                <span>{item.title}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Email Groups */}
        <div className="px-3 py-4 border-t border-gray-200/80">
          <NavProjects projects={emailGroups} />
        </div>
        
        {/* Secondary Navigation */}
        <div className="mt-auto">
          <NavSecondary items={navSecondary} className="border-t border-gray-200/80 py-4" />
        </div>
      </SidebarContent>
      <SidebarFooter className="border-t border-gray-200/80 bg-white">
        <NavUser user={user} />
      </SidebarFooter>
    </Sidebar>
  )
}
