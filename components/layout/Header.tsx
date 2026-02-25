"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { MobileSidebar } from "@/components/layout/Sidebar";
import { Button } from "@/components/ui/button";
import { supabase } from "@/lib/supabase";
import { LogOut } from "lucide-react";
import { toast } from "sonner";

export function Header() {
    const [email, setEmail] = useState<string | null>(null);
    const router = useRouter();

    useEffect(() => {
        const getSession = async () => {
            const { data: { session } } = await supabase.auth.getSession();
            if (session?.user?.email) {
                setEmail(session.user.email);
            }
        };
        getSession();
    }, []);

    const handleSignOut = async () => {
        await supabase.auth.signOut();
        toast.success("Signed out successfully");
        router.push("/login");
    };

    return (
        <div className="border-b p-4 flex items-center justify-between">
            <MobileSidebar />
            <div className="flex w-full justify-end items-center gap-4">
                {email && <span className="text-sm text-gray-500 font-medium">{email}</span>}
                <Button size="sm" variant="outline" onClick={handleSignOut}>
                    <LogOut className="w-4 h-4 mr-2" />
                    Sign Out
                </Button>
            </div>
        </div>
    );
}
