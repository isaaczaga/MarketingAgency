export interface BrandProfile {
    title: string;
    description: string;
    brandVoice: string;
    targetAudience: string;
    keywords: string[];
}

export type ContentType = 'article' | 'video' | 'podcast' | 'ad' | 'keyword' | 'image';
export type ContentStatus = 'PLANNED' | 'DRAFT' | 'PENDING_APPROVAL' | 'APPROVED' | 'PUBLISHED' | 'FAILED';

export interface StrategyTask {
    id: string;
    phase: string;
    month?: number;
    type: ContentType;
    title: string;
    description: string;
    status: ContentStatus;
    scheduledDate?: string; // ISO date string
    contentId?: string; // Link to the generated content
}

export interface StrategyPhase {
    id: string;
    title: string;
    tasks: StrategyTask[];
}

export interface DigitalStrategy {
    id: string;
    createdAt: string;
    brandProfile: BrandProfile;
    objectives: string[];
    phases: StrategyPhase[];
}

export interface ContentItem {
    id: string;
    taskId: string;
    type: ContentType;
    title: string;
    content: string; // Markdown or script content
    metadata?: any; // Extra data like SEO keywords, image prompts, etc.
    status: ContentStatus;
    createdAt: string;
    updatedAt: string;
    feedback?: string; // User feedback for revisions
}
