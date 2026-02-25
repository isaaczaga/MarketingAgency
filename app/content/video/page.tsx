"use client";

import { useState } from "react";
import { toast } from "sonner";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Upload, Loader2, ArrowRight } from "lucide-react";
import { useSearchParams, useRouter } from "next/navigation";
import { useMarketingPlan } from "@/lib/hooks/use-marketing-plan";

export default function VideoPage() {
    const { updateTaskStatus } = useMarketingPlan();
    const router = useRouter();
    const searchParams = useSearchParams();
    const taskId = searchParams.get("taskId");

    const [uploading, setUploading] = useState(false);
    const [videoFile, setVideoFile] = useState<File | null>(null);

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            setVideoFile(e.target.files[0]);
        }
    };

    const handleUpload = async () => {
        if (!videoFile) return;

        setUploading(true);
        // Simulate upload delay
        await new Promise(resolve => setTimeout(resolve, 2000));

        toast.success("Video uploaded successfully!");
        setUploading(false);

        if (taskId) {
            updateTaskStatus(taskId, 'completed');
        }
    };

    return (
        <div className="p-8 max-w-4xl mx-auto">
            <div className="mb-8 flex justify-between items-center">
                <div>
                    <h2 className="text-2xl font-bold tracking-tight">Content Ingestion (Google Vids)</h2>
                    <p className="text-muted-foreground">
                        Upload your finished video from Google Vids to publish it.
                    </p>
                </div>
                <Button variant="outline" onClick={() => router.push("/content/assets")}>
                    Go to Asset Generator
                </Button>
            </div>

            <Card className="p-12 border-dashed border-2 flex flex-col items-center justify-center space-y-4">
                <div className="p-4 bg-muted rounded-full">
                    <Upload className="h-8 w-8 text-muted-foreground" />
                </div>
                <div className="text-center">
                    <h3 className="font-semibold text-lg">Upload Final Video</h3>
                    <p className="text-sm text-muted-foreground">Drag and drop your Google Vids MP4 here</p>
                </div>

                <input
                    type="file"
                    accept="video/mp4,video/webm"
                    className="hidden"
                    id="video-upload"
                    onChange={handleFileChange}
                />
                <Button variant="secondary" onClick={() => document.getElementById('video-upload')?.click()}>
                    Select File
                </Button>

                {videoFile && (
                    <div className="mt-4 w-full text-center">
                        <p className="text-sm font-medium">{videoFile.name}</p>
                        <Button onClick={handleUpload} disabled={uploading} className="mt-2 text-white">
                            {uploading ? <Loader2 className="animate-spin mr-2 h-4 w-4" /> : null}
                            Confirm Upload & Complete Task
                        </Button>
                    </div>
                )}
            </Card>

            <div className="mt-8">
                <h3 className="font-semibold mb-4">Workflow Steps</h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <Card className="p-4 opacity-70">
                        <span className="text-xs font-mono bg-muted p-1 rounded">Step 1</span>
                        <p className="font-medium mt-2">Generate Assets</p>
                        <p className="text-xs text-muted-foreground">Use the Asset Generator page to create script & images.</p>
                    </Card>
                    <Card className="p-4 opacity-70">
                        <span className="text-xs font-mono bg-muted p-1 rounded">Step 2</span>
                        <p className="font-medium mt-2">Create in Google Vids</p>
                        <p className="text-xs text-muted-foreground">Manually assemble video using generated assets.</p>
                    </Card>
                    <Card className="p-4 border-primary bg-primary/5">
                        <span className="text-xs font-mono bg-primary text-primary-foreground p-1 rounded">Step 3</span>
                        <p className="font-medium mt-2">Upload & Publish</p>
                        <p className="text-xs text-muted-foreground">Bring the final video back here to distribute.</p>
                    </Card>
                </div>
            </div>
        </div>
    );
}
