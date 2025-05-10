"use client"

import * as React from "react"
import { useRouter } from "next/navigation"
import type { DialogProps } from "@radix-ui/react-dialog"
import { Search, LayoutDashboard } from "lucide-react"

import {
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command"

// Define a type for website items
interface WebsiteItem {
  id: string;
  name: string;
}

// Static Search items organized by category - to be merged with dynamic items
const staticSearchGroups = [
  {
    category: "Pages",
    items: [
      { name: "My Websites", path: "/websites", icon: LayoutDashboard },
      // Add other main pages if needed, e.g., from a navigation config
      { name: "Settings", path: "/settings", icon: Search }, // Placeholder icon
    ],
  },
  {
    category: "Actions",
    items: [
      { name: "Add New Website", path: "/websites/new", icon: Search }, // Placeholder icon
      // { name: "Create Report", path: "/reports/new", icon: Search },
    ],
  },
  {
    category: "Help",
    items: [
      { name: "Documentation", path: "/docs", icon: Search }, // Placeholder icon
      // { name: "Support", path: "/support", icon: Search }, 
    ],
  },
]

interface CommandSearchProps extends DialogProps {
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
  userWebsites?: WebsiteItem[]; // Prop for dynamic user websites
}

export function CommandSearch({ 
  open: controlledOpen, 
  onOpenChange: setControlledOpen,
  userWebsites = [], // Default to empty array
  ...props 
}: CommandSearchProps) {
  const [internalOpen, setInternalOpen] = React.useState(false)
  const router = useRouter()
  
  const isControlled = controlledOpen !== undefined;
  const open = isControlled ? controlledOpen : internalOpen;
  const setOpen = React.useCallback((value: boolean | ((prevState: boolean) => boolean)) => {
    if (isControlled) {
      const newValue = typeof value === "function" ? value(controlledOpen) : value;
      setControlledOpen?.(newValue);
    } else {
      setInternalOpen(value);
    }
  }, [isControlled, controlledOpen, setControlledOpen]);

  React.useEffect(() => {
    const down = (e: KeyboardEvent) => {
      if ((e.key === "k" && (e.metaKey || e.ctrlKey)) || e.key === "/") {
        e.preventDefault()
        setOpen((prevOpen) => !prevOpen) // Corrected to use functional update
      }
    }

    document.addEventListener("keydown", down)
    return () => document.removeEventListener("keydown", down)
  }, [setOpen])

  // Combine static and dynamic search items
  const allSearchGroups = React.useMemo(() => {
    const dynamicGroups = [];
    if (userWebsites.length > 0) {
      dynamicGroups.push({
        category: "My Websites",
        items: userWebsites.map(site => ({
          name: site.name,
          path: `/websites/${site.id}`,
          icon: LayoutDashboard, // Use LayoutDashboard for websites
        })),
      });
    }
    // Filter out the static "My Websites" link from Pages if dynamic websites are present
    const filteredStaticGroups = userWebsites.length > 0
      ? staticSearchGroups.map(group => {
          if (group.category === "Pages") {
            return {
              ...group,
              items: group.items.filter(item => item.path !== "/websites")
            };
          }
          return group;
        }).filter(group => group.items.length > 0) // Ensure group still has items
      : staticSearchGroups;

    return [...dynamicGroups, ...filteredStaticGroups];
  }, [userWebsites]);

  return (
    <CommandDialog open={open} onOpenChange={setOpen} {...props}>
      <CommandInput placeholder="Search websites, pages, actions..." />
      <CommandList>
        <CommandEmpty>No results found.</CommandEmpty>
        {allSearchGroups.map((group) => (
          <CommandGroup key={group.category} heading={group.category}>
            {group.items.map((item) => (
              <CommandItem
                key={item.path}
                onSelect={() => {
                  setOpen(false)
                  router.push(item.path)
                }}
                className="cursor-pointer"
              >
                <item.icon className="mr-2 h-4 w-4 text-muted-foreground" />
                <span>{item.name}</span>
              </CommandItem>
            ))}
          </CommandGroup>
        ))}
      </CommandList>
    </CommandDialog>
  )
} 