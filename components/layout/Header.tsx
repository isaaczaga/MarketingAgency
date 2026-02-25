import { MobileSidebar } from "@/components/layout/Sidebar";
import { Button } from "@/components/ui/button";

export function Header() {
    return (
        <div className="border-b p-4 flex items-center justify-between">
            <MobileSidebar />
            <div className="flex w-full justify-end">
                <Button size="sm" variant="outline">
                    Login
                </Button>
            </div>
        </div>
    );
}
