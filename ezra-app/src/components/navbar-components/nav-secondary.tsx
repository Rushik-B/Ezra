import * as React from "react"
import { type LucideIcon } from "lucide-react"
import { PageType } from "@/types"

import {
  SidebarGroup,
  SidebarGroupContent,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/sidebar/sidebar"

export function NavSecondary({
  items,
  setActivePage,
  ...props
}: {
  items: {
    title: string
    url: string
    icon: LucideIcon
    pageType?: PageType
  }[]
  setActivePage?: (page: PageType) => void
} & React.ComponentPropsWithoutRef<typeof SidebarGroup>) {
  return (
    <SidebarGroup {...props}>
      <SidebarGroupContent>
        <SidebarMenu>
          {items.map((item) => (
            <SidebarMenuItem key={item.title}>
              <SidebarMenuButton asChild size="sm">
                <a 
                  href={item.url} 
                  className="cursor-pointer"
                  onClick={(e) => {
                    e.preventDefault()
                    if (item.pageType && setActivePage) {
                      setActivePage(item.pageType)
                    }
                  }}
                >
                  <item.icon />
                  <span>{item.title}</span>
                </a>
              </SidebarMenuButton>
            </SidebarMenuItem>
          ))}
        </SidebarMenu>
      </SidebarGroupContent>
    </SidebarGroup>
  )
}
