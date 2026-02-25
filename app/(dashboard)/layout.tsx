import { Sidebar } from "@/components/layout/Sidebar";
import { Header } from "@/components/layout/Header";
import { AuthGuard } from "@/components/layout/AuthGuard";

export default function DashboardLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    return (
        <AuthGuard>
            <div className="h-full relative">
                <div className="hidden h-full md:flex md:w-72 md:flex-col md:fixed md:inset-y-0 z-[80] bg-gray-900 border-r border-gray-800">
                    <div className="text-white h-full bg-gray-900">
                        <Sidebar className="text-white" />
                    </div>
                </div>
                <main className="md:pl-72 h-full">
                    <Header />
                    {children}
                </main>
            </div>
        </AuthGuard>
    );
}
