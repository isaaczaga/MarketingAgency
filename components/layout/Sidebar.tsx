"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import {
    LayoutDashboard,
    Search,
    PenTool,
    Video,
    Mic,
    Megaphone,
    BarChart,
    Menu,
    Settings,
    Zap,
} from "lucide-react";
import { useState } from "react";

interface SidebarProps extends React.HTMLAttributes<HTMLDivElement> { }

export function Sidebar({ className }: SidebarProps) {
    const pathname = usePathname();
    const [open, setOpen] = useState(false);

    const routes = [
        {
            label: "Dashboard",
            icon: LayoutDashboard,
            href: "/",
            color: "text-sky-500",
        },
        {
            label: "Strategy Board",
            icon: Zap,
            href: "/strategy",
            color: "text-yellow-500",
        },
        {
            label: "Brand Analysis",
            icon: Search,
            href: "/analysis",
            color: "text-violet-500",
        },
        {
            label: "Article Generator",
            icon: PenTool,
            href: "/content/articles",
            color: "text-pink-700",
        },
        {
            label: "Video Creator",
            icon: Video,
            href: "/content/video",
            color: "text-orange-700",
        },
        {
            label: "Podcast Studio",
            icon: Mic,
            href: "/content/podcast",
            color: "text-emerald-500",
        },
        {
            label: "Campaigns",
            icon: Megaphone,
            href: "/campaigns",
            color: "text-green-700",
        },
        {
            label: "Analytics",
            icon: BarChart,
            href: "/analytics",
            color: "text-blue-700",
        },
        {
            label: "Settings",
            icon: Settings,
            href: "/settings",
        },
    ];

    return (
        <div className={cn("pb-12", className)}>
            <div className="space-y-4 py-4">
                <div className="px-3 py-2">
                    <h2 className="mb-2 px-4 text-lg font-semibold tracking-tight">
                        AI Agency
                    </h2>
                    <div className="space-y-1">
                        {routes.map((route) => (
                            <Link
                                key={route.href}
                                href={route.href}
                                className={cn(
                                    "text-sm group flex p-3 w-full justify-start font-medium cursor-pointer hover:text-primary hover:bg-primary/10 rounded-lg transition",
                                    pathname === route.href || (route.href !== "/" && pathname?.startsWith(route.href))
                                        ? "text-primary bg-primary/10"
                                        : "text-muted-foreground"
                                )}
                            >
                                <div className="flex items-center flex-1">
                                    <route.icon className={cn("h-5 w-5 mr-3", route.color)} />
                                    {route.label}
                                </div>
                            </Link>
                        ))}
                    </div>
                </div>
            </div>
        </div>
    );
}

export function MobileSidebar() {
    const [open, setOpen] = useState(false);
    // Use simple sheet for mobile
    return (
        <Sheet open={open} onOpenChange={setOpen}>
            <SheetTrigger asChild>
                <Button variant="ghost" size="icon" className="md:hidden">
                    <Menu />
                </Button>
            </SheetTrigger>
            <SheetContent side="left" className="p-0">
                <Sidebar />
            </SheetContent>
        </Sheet>
    );
}
