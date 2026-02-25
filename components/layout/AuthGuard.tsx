"use client";

import { useEffect, useState } from "react";
import { useRouter, usePathname } from "next/navigation";
import axios from "axios";
import { supabase } from "@/lib/supabase";
import { Loader2 } from "lucide-react";

export function AuthGuard({ children }: { children: React.ReactNode }) {
    const [loading, setLoading] = useState(true);
    const router = useRouter();
    const pathname = usePathname();

    useEffect(() => {
        const checkSession = async () => {
            const { data: { session } } = await supabase.auth.getSession();

            if (!session) {
                // Not logged in, redirect to login page with callback
                delete axios.defaults.headers.common['Authorization'];
                router.replace(`/login?redirectTo=${encodeURIComponent(pathname)}`);
            } else {
                axios.defaults.headers.common['Authorization'] = `Bearer ${session.access_token}`;
                setLoading(false);
            }
        };

        checkSession();

        const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
            if (!session) {
                delete axios.defaults.headers.common['Authorization'];
                router.replace(`/login?redirectTo=${encodeURIComponent(pathname)}`);
            } else {
                axios.defaults.headers.common['Authorization'] = `Bearer ${session.access_token}`;
                setLoading(false);
            }
        });

        return () => {
            subscription.unsubscribe();
        };
    }, [router, pathname]);

    if (loading) {
        return (
            <div className="flex justify-center items-center h-screen w-full bg-slate-50">
                <Loader2 className="w-8 h-8 animate-spin text-slate-500" />
            </div>
        );
    }

    return <>{children}</>;
}
