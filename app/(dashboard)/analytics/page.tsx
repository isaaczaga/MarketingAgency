"use client";

import { Card } from "@/components/ui/card";
import { BarChart, TrendingUp, Users, DollarSign } from "lucide-react";
import { useEffect, useState } from "react";

export default function AnalyticsPage() {
    const [stats, setStats] = useState({
        reach: "0",
        engagement: "0%",
        spend: "$0",
        conversions: "0"
    });

    useEffect(() => {
        const profileExists = !!localStorage.getItem("brand_profile");
        if (profileExists) {
            setStats({
                reach: "24.5K",
                engagement: "4.8%",
                spend: "$1,240",
                conversions: "156"
            });
        }
    }, []);

    return (
        <div className="p-8">
            <div className="mb-8 space-y-4">
                <h2 className="text-2xl font-bold tracking-tight">Analytics Dashboard</h2>
                <p className="text-muted-foreground">
                    Track performance across all your campaigns
                </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
                <Card className="p-6">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-sm text-muted-foreground">Total Reach</p>
                            <p className="text-2xl font-bold">{stats.reach}</p>
                        </div>
                        <Users className="h-8 w-8 text-blue-500" />
                    </div>
                </Card>

                <Card className="p-6">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-sm text-muted-foreground">Engagement Rate</p>
                            <p className="text-2xl font-bold">{stats.engagement}</p>
                        </div>
                        <TrendingUp className="h-8 w-8 text-green-500" />
                    </div>
                </Card>

                <Card className="p-6">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-sm text-muted-foreground">Ad Spend</p>
                            <p className="text-2xl font-bold">{stats.spend}</p>
                        </div>
                        <DollarSign className="h-8 w-8 text-yellow-500" />
                    </div>
                </Card>

                <Card className="p-6">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-sm text-muted-foreground">Conversions</p>
                            <p className="text-2xl font-bold">{stats.conversions}</p>
                        </div>
                        <BarChart className="h-8 w-8 text-purple-500" />
                    </div>
                </Card>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <Card className="p-6">
                    <h3 className="font-semibold mb-4">Campaign Performance</h3>
                    <div className="text-center text-muted-foreground py-12">
                        No campaign data available yet. Start creating campaigns to see analytics.
                    </div>
                </Card>

                <Card className="p-6">
                    <h3 className="font-semibold mb-4">Top Performing Content</h3>
                    <div className="text-center text-muted-foreground py-12">
                        Generate content and launch campaigns to track performance.
                    </div>
                </Card>
            </div>
        </div>
    );
}
