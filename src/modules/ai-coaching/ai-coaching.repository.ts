import { Types, type HydratedDocument } from 'mongoose';

import { AiCoachingContentModel } from './ai-coaching.model';
import type { AiCoachingContent } from './ai-coaching.model';
import type {
  CreateAiCoachingContentInput,
  ListAiCoachingContentQuery,
  UpdateAiCoachingContentInput,
} from './ai-coaching.schema';

export type AiCoachingContentStatus = 'Published' | 'Draft' | 'Archived';
export type AiCoachingContentType = 'Video' | 'Article' | 'Tip';
export type AiCoachingVideoType = 'video/mp4' | 'video/webm' | 'video/quicktime';

export interface AiCoachingRoutineStepRecord {
  readonly label: string;
  readonly value: string;
}

export interface AiCoachingContentRecord {
  readonly category: string;
  readonly coachName: string;
  readonly coachTitle: string;
  readonly createdAt: Date;
  readonly description: string;
  readonly duration: string;
  readonly featured: boolean;
  readonly id: string;
  readonly impactLabel: string;
  readonly impactScore: number;
  readonly publishToApp: boolean;
  readonly recommendedProductId?: string;
  readonly routineSteps: AiCoachingRoutineStepRecord[];
  readonly sortOrder: number;
  readonly status: AiCoachingContentStatus;
  readonly technicalPoints: string[];
  readonly thumbnailKey?: string;
  readonly thumbnailUrl?: string;
  readonly title: string;
  readonly type: AiCoachingContentType;
  readonly updatedAt: Date;
  readonly videoKey: string;
  readonly videoName: string;
  readonly videoSizeBytes: number;
  readonly videoType: AiCoachingVideoType;
  readonly videoUrl: string;
}

interface AiCoachingContentSnapshot {
  category: string;
  coachName?: string;
  coachTitle?: string;
  createdAt: Date;
  description?: string;
  duration?: string;
  featured?: boolean;
  impactLabel?: string;
  impactScore?: number;
  publishToApp: boolean;
  recommendedProductId?: string | null;
  routineSteps?: AiCoachingRoutineStepRecord[];
  sortOrder?: number;
  status: AiCoachingContentStatus;
  technicalPoints?: string[];
  thumbnailKey?: string | null;
  thumbnailUrl?: string | null;
  title: string;
  type: AiCoachingContentType;
  updatedAt: Date;
  videoKey: string;
  videoName: string;
  videoSizeBytes: number;
  videoType: AiCoachingVideoType;
  videoUrl: string;
}

interface AiCoachingContentFindFilters {
  $or?: Array<{ category: RegExp } | { description: RegExp } | { title: RegExp }>;
  category?: string;
  publishToApp?: boolean;
  status?: AiCoachingContentStatus;
  type?: AiCoachingContentType;
}

export class AiCoachingContentRepository {
  public async create(input: CreateAiCoachingContentInput): Promise<AiCoachingContentRecord> {
    const content = new AiCoachingContentModel({
      category: input.category,
      coachName: input.coachName ?? 'AForce Coach',
      coachTitle: input.coachTitle ?? 'Hydration Specialist',
      description: input.description ?? '',
      duration: input.duration ?? '',
      featured: input.featured,
      impactLabel: input.impactLabel ?? 'HYDRATION IMPACT',
      impactScore: input.impactScore ?? 8,
      publishToApp: input.publishToApp,
      recommendedProductId: input.recommendedProductId,
      routineSteps: input.routineSteps ?? [],
      sortOrder: input.sortOrder,
      status: input.status,
      technicalPoints: input.technicalPoints ?? [],
      thumbnailKey: input.thumbnailKey,
      thumbnailUrl: input.thumbnailUrl,
      title: input.title,
      type: input.type,
      videoKey: input.videoKey,
      videoName: input.videoName,
      videoSizeBytes: input.videoSizeBytes,
      videoType: input.videoType,
      videoUrl: input.videoUrl,
    });

    await content.save();

    return this.toRecord(content);
  }

  public async deleteById(contentId: string): Promise<AiCoachingContentRecord | null> {
    const content = await AiCoachingContentModel.findByIdAndDelete(contentId).exec();

    return content ? this.toRecord(content) : null;
  }

  public async findById(contentId: string): Promise<AiCoachingContentRecord | null> {
    if (!Types.ObjectId.isValid(contentId)) {
      return null;
    }

    const content = await AiCoachingContentModel.findById(contentId).exec();

    return content ? this.toRecord(content) : null;
  }

  public async findMany(query: ListAiCoachingContentQuery): Promise<AiCoachingContentRecord[]> {
    const filters: AiCoachingContentFindFilters = {};

    if (query.category) {
      filters.category = query.category;
    }

    if (query.status) {
      filters.status = query.status;
    }

    if (query.type) {
      filters.type = query.type;
    }

    if (query.search) {
      const expression = new RegExp(escapeRegExp(query.search), 'i');
      filters.$or = [{ category: expression }, { description: expression }, { title: expression }];
    }

    const contentItems = await AiCoachingContentModel.find(filters).sort({ createdAt: -1 }).exec();

    return contentItems.map((content) => this.toRecord(content));
  }

  public async findPublishedById(contentId: string): Promise<AiCoachingContentRecord | null> {
    if (!Types.ObjectId.isValid(contentId)) {
      return null;
    }

    const content = await AiCoachingContentModel.findOne({
      _id: contentId,
      publishToApp: true,
      status: 'Published',
    }).exec();

    return content ? this.toRecord(content) : null;
  }

  public async findPublishedForApp(query: { category?: string } = {}): Promise<AiCoachingContentRecord[]> {
    const filters: AiCoachingContentFindFilters = {
      publishToApp: true,
      status: 'Published',
    };

    if (query.category) {
      filters.category = query.category;
    }

    const contentItems = await AiCoachingContentModel.find(filters)
      .sort({ featured: -1, sortOrder: 1, createdAt: -1 })
      .exec();

    return contentItems.map((content) => this.toRecord(content));
  }

  public async updateById(
    contentId: string,
    input: UpdateAiCoachingContentInput,
  ): Promise<AiCoachingContentRecord | null> {
    const set: Partial<{
      category: string;
      coachName: string;
      coachTitle: string;
      description: string;
      duration: string;
      featured: boolean;
      impactLabel: string;
      impactScore: number;
      publishToApp: boolean;
      recommendedProductId: string;
      routineSteps: AiCoachingRoutineStepRecord[];
      sortOrder: number;
      status: AiCoachingContentStatus;
      technicalPoints: string[];
      thumbnailKey: string;
      thumbnailUrl: string;
      title: string;
      type: AiCoachingContentType;
      videoKey: string;
      videoName: string;
      videoSizeBytes: number;
      videoType: AiCoachingVideoType;
      videoUrl: string;
    }> = {};

    if (input.category) {
      set.category = input.category;
    }

    if (input.coachName !== undefined) {
      set.coachName = input.coachName ?? 'AForce Coach';
    }

    if (input.coachTitle !== undefined) {
      set.coachTitle = input.coachTitle ?? 'Hydration Specialist';
    }

    if (input.description !== undefined) {
      set.description = input.description ?? '';
    }

    if (input.duration !== undefined) {
      set.duration = input.duration ?? '';
    }

    if (input.featured !== undefined) {
      set.featured = input.featured;
    }

    if (input.impactLabel !== undefined) {
      set.impactLabel = input.impactLabel ?? 'HYDRATION IMPACT';
    }

    if (input.impactScore !== undefined) {
      set.impactScore = input.impactScore;
    }

    if (input.publishToApp !== undefined) {
      set.publishToApp = input.publishToApp;
    }

    if (input.recommendedProductId !== undefined) {
      set.recommendedProductId = input.recommendedProductId ?? '';
    }

    if (input.routineSteps !== undefined) {
      set.routineSteps = input.routineSteps;
    }

    if (input.sortOrder !== undefined) {
      set.sortOrder = input.sortOrder;
    }

    if (input.status) {
      set.status = input.status;
    }

    if (input.technicalPoints !== undefined) {
      set.technicalPoints = input.technicalPoints;
    }

    if (input.thumbnailKey !== undefined) {
      set.thumbnailKey = input.thumbnailKey ?? '';
    }

    if (input.thumbnailUrl !== undefined) {
      set.thumbnailUrl = input.thumbnailUrl ?? '';
    }

    if (input.title) {
      set.title = input.title;
    }

    if (input.type) {
      set.type = input.type;
    }

    if (input.videoKey) {
      set.videoKey = input.videoKey;
    }

    if (input.videoName) {
      set.videoName = input.videoName;
    }

    if (input.videoSizeBytes !== undefined) {
      set.videoSizeBytes = input.videoSizeBytes;
    }

    if (input.videoType) {
      set.videoType = input.videoType;
    }

    if (input.videoUrl) {
      set.videoUrl = input.videoUrl;
    }

    const content = await AiCoachingContentModel.findByIdAndUpdate(
      contentId,
      { $set: set },
      { new: true, runValidators: true },
    ).exec();

    return content ? this.toRecord(content) : null;
  }

  private toRecord(document: HydratedDocument<AiCoachingContent>): AiCoachingContentRecord {
    const snapshot = document.toObject() as AiCoachingContentSnapshot;

    return {
      category: snapshot.category,
      coachName: snapshot.coachName ?? 'AForce Coach',
      coachTitle: snapshot.coachTitle ?? 'Hydration Specialist',
      createdAt: snapshot.createdAt,
      description: snapshot.description ?? '',
      duration: snapshot.duration ?? '',
      featured: snapshot.featured ?? false,
      id: document.id,
      impactLabel: snapshot.impactLabel ?? 'HYDRATION IMPACT',
      impactScore: snapshot.impactScore ?? 8,
      publishToApp: snapshot.publishToApp,
      ...(snapshot.recommendedProductId ? { recommendedProductId: snapshot.recommendedProductId } : {}),
      routineSteps: (snapshot.routineSteps ?? []).map((step) => ({
        label: step.label,
        value: step.value,
      })),
      sortOrder: snapshot.sortOrder ?? 100,
      status: snapshot.status,
      technicalPoints: snapshot.technicalPoints ?? [],
      ...(snapshot.thumbnailKey ? { thumbnailKey: snapshot.thumbnailKey } : {}),
      ...(snapshot.thumbnailUrl ? { thumbnailUrl: snapshot.thumbnailUrl } : {}),
      title: snapshot.title,
      type: snapshot.type,
      updatedAt: snapshot.updatedAt,
      videoKey: snapshot.videoKey,
      videoName: snapshot.videoName,
      videoSizeBytes: snapshot.videoSizeBytes,
      videoType: snapshot.videoType,
      videoUrl: snapshot.videoUrl,
    };
  }
}

function escapeRegExp(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

export const aiCoachingContentRepository = new AiCoachingContentRepository();
