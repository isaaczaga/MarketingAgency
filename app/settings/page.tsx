import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";

export default function SettingsPage() {
    return (
        <div className="p-8 max-w-2xl mx-auto">
            <div className="mb-8 space-y-4">
                <h2 className="text-2xl font-bold tracking-tight">Settings</h2>
                <p className="text-muted-foreground">
                    Configure your API keys and preferences
                </p>
            </div>

            <div className="space-y-6">
                <Card className="p-6">
                    <h3 className="font-semibold mb-4">AI Configuration</h3>
                    <div className="space-y-4">
                        <div className="space-y-2">
                            <Label htmlFor="openai-key">OpenAI API Key</Label>
                            <Input
                                id="openai-key"
                                type="password"
                                placeholder="sk-..."
                            />
                            <p className="text-xs text-muted-foreground">
                                Required for content generation features
                            </p>
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="anthropic-key">Anthropic API Key (Optional)</Label>
                            <Input
                                id="anthropic-key"
                                type="password"
                                placeholder="sk-ant-..."
                            />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="gemini-key">Google Gemini API Key (Optional)</Label>
                            <Input
                                id="gemini-key"
                                type="password"
                                placeholder="AIza..."
                            />
                        </div>
                    </div>
                </Card>

                <Card className="p-6">
                    <h3 className="font-semibold mb-4">Media Generation APIs</h3>
                    <div className="space-y-4">
                        <div className="space-y-2">
                            <Label htmlFor="elevenlabs-key">ElevenLabs API Key</Label>
                            <Input
                                id="elevenlabs-key"
                                type="password"
                                placeholder="Enter API key..."
                            />
                            <p className="text-xs text-muted-foreground">
                                For podcast audio generation (text-to-speech)
                            </p>
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="heygen-key">HeyGen API Key</Label>
                            <Input
                                id="heygen-key"
                                type="password"
                                placeholder="Enter API key..."
                            />
                            <p className="text-xs text-muted-foreground">
                                For AI avatar video generation
                            </p>
                        </div>
                    </div>
                </Card>

                <Card className="p-6">
                    <h3 className="font-semibold mb-4">Social Media Integration</h3>
                    <div className="space-y-4">
                        <div className="space-y-2">
                            <Label htmlFor="facebook-token">Facebook Access Token</Label>
                            <Input
                                id="facebook-token"
                                type="password"
                                placeholder="Enter token..."
                            />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="instagram-token">Instagram Access Token</Label>
                            <Input
                                id="instagram-token"
                                type="password"
                                placeholder="Enter token..."
                            />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="twitter-token">Twitter API Key</Label>
                            <Input
                                id="twitter-token"
                                type="password"
                                placeholder="Enter API key..."
                            />
                        </div>
                    </div>
                </Card>

                <Card className="p-6">
                    <h3 className="font-semibold mb-4">Google Ads Integration</h3>
                    <div className="space-y-4">
                        <div className="space-y-2">
                            <Label htmlFor="google-client-id">Client ID</Label>
                            <Input
                                id="google-client-id"
                                placeholder="Enter client ID..."
                            />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="google-client-secret">Client Secret</Label>
                            <Input
                                id="google-client-secret"
                                type="password"
                                placeholder="Enter client secret..."
                            />
                        </div>
                    </div>
                </Card>

                <Button className="w-full">Save Settings</Button>
            </div>
        </div>
    );
}
