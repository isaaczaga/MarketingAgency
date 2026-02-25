"use client";

import { useState, useEffect } from "react";

export interface BrandProfile {
    url: string;
    title: string;
    description: string;
    keywords: string[];
    brandVoice: string;
    targetAudience: string;
}

export function useBrandProfile() {
    const [profile, setProfile] = useState<BrandProfile | null>(null);

    useEffect(() => {
        const savedProfile = localStorage.getItem("brand_profile");
        if (savedProfile) {
            try {
                setProfile(JSON.parse(savedProfile));
            } catch (e) {
                console.error("Failed to parse saved brand profile", e);
            }
        }
    }, []);

    const saveProfile = (newProfile: BrandProfile) => {
        localStorage.setItem("brand_profile", JSON.stringify(newProfile));
        setProfile(newProfile);
    };

    const clearProfile = () => {
        localStorage.removeItem("brand_profile");
        setProfile(null);
    };

    return { profile, saveProfile, clearProfile };
}
