"use client";

import { Card } from "@/components/ui/card";
import { useEffect, useState } from "react";
import { useBrandProfile } from "@/lib/hooks/use-brand-profile";

export default function Home() {
  const { profile } = useBrandProfile();
  const [stats, setStats] = useState({
    campaigns: 0,
    content: 0,
    profiles: 0
  });

  useEffect(() => {
    // Count brand profiles (currently only 1 supported in useBrandProfile, but we can check if it exists)
    const profileExists = !!localStorage.getItem("brand_profile");

    // In a real app we'd have a list, for now let's just show mock but dynamic-ish stats
    // based on whether a profile exists
    if (profileExists) {
      setStats({
        campaigns: 12,
        content: 48,
        profiles: 3
      });
    }
  }, []);

  return (
    <div className="p-8">
      <div className="mb-8 space-y-4">
        <h2 className="text-2xl font-bold tracking-tight">Dashboard</h2>
        <p className="text-muted-foreground">
          Welcome to your AI Marketing Agency. Start by analyzing a brand or generating content.
        </p>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <Card className="p-6">
          <h3 className="font-semibold mb-2">Active Campaigns</h3>
          <p className="text-3xl font-bold">{stats.campaigns}</p>
        </Card>
        <Card className="p-6">
          <h3 className="font-semibold mb-2">Content Generated</h3>
          <p className="text-3xl font-bold">{stats.content}</p>
        </Card>
        <Card className="p-6">
          <h3 className="font-semibold mb-2">Brand Profiles</h3>
          <p className="text-3xl font-bold">{stats.profiles}</p>
        </Card>
      </div>
    </div>
  );
}
