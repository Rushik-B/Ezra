"use client"

import {
  Folder,
  Forward,
  MoreHorizontal,
  Trash2,
  type LucideIcon,
} from "lucide-react"

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
  SidebarGroup,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuAction,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/sidebar"

export function NavProjects({
  projects,
}: {
  projects: {
    name: string
    url: string
    icon: LucideIcon
  }[]
}) {
  return (
    <SidebarGroup className="group-data-[collapsible=icon]:hidden">
      <SidebarGroupLabel className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-3 px-3">Email Groups</SidebarGroupLabel>
      <SidebarMenu className="space-y-1">
        {projects.map((item) => (
          <SidebarMenuItem key={item.name}>
            <SidebarMenuButton asChild className="px-3 py-2.5 text-sm rounded-xl transition-all duration-200 text-slate-700 hover:bg-slate-50 hover:text-slate-900">
              <a href={item.url}>
                <item.icon className="h-4 w-4" />
                <span>{item.name}</span>
              </a>
            </SidebarMenuButton>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <SidebarMenuAction showOnHover className="text-slate-500 hover:text-slate-700 hover:bg-slate-100">
                  <MoreHorizontal />
                  <span className="sr-only">More</span>
                </SidebarMenuAction>
              </DropdownMenuTrigger>
              <DropdownMenuContent
                className="w-48 rounded-lg shadow-lg border-slate-200 bg-white/95 backdrop-blur-sm"
                side="bottom"
                align="end"
              >
                <DropdownMenuItem className="text-slate-700 hover:bg-slate-50">
                  <Folder className="text-slate-500" />
                  <span>View Group</span>
                </DropdownMenuItem>
                <DropdownMenuItem className="text-slate-700 hover:bg-slate-50">
                  <Forward className="text-slate-500" />
                  <span>Share Group</span>
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem className="text-red-600 hover:bg-red-50">
                  <Trash2 className="text-red-500" />
                  <span>Delete Group</span>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </SidebarMenuItem>
        ))}
      </SidebarMenu>
    </SidebarGroup>
  )
}
