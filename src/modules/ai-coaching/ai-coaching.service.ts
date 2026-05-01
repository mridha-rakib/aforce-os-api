import { ResourceNotFoundError } from '../../common/errors/http-errors';
import {
  aiCoachingContentRepository,
  type AiCoachingContentRecord,
  type AiCoachingContentRepository,
} from './ai-coaching.repository';
import type {
  CreateAiCoachingContentInput,
  ListAiCoachingContentQuery,
  UpdateAiCoachingContentInput,
} from './ai-coaching.schema';

export interface AiCoachingContentDto {
  readonly category: string;
  readonly coachName: string;
  readonly coachTitle: string;
  readonly createdAt: string;
  readonly description: string;
  readonly duration: string;
  readonly featured: boolean;
  readonly id: string;
  readonly impactLabel: string;
  readonly impactScore: number;
  readonly publishToApp: boolean;
  readonly recommendedProductId?: string;
  readonly routineSteps: AiCoachingContentRecord['routineSteps'];
  readonly sortOrder: number;
  readonly status: AiCoachingContentRecord['status'];
  readonly technicalPoints: string[];
  readonly thumbnailKey?: string;
  readonly thumbnailUrl?: string;
  readonly title: string;
  readonly type: AiCoachingContentRecord['type'];
  readonly updatedAt: string;
  readonly videoKey: string;
  readonly videoName: string;
  readonly videoSizeBytes: number;
  readonly videoType: AiCoachingContentRecord['videoType'];
  readonly videoUrl: string;
}

export class AiCoachingContentService {
  public constructor(private readonly repository: AiCoachingContentRepository) {}

  public async createContent(input: CreateAiCoachingContentInput): Promise<AiCoachingContentDto> {
    const content = await this.repository.create({
      ...input,
      status: input.publishToApp ? input.status : 'Draft',
    });

    return this.toDto(content);
  }

  public async deleteContent(contentId: string): Promise<{ contentId: string }> {
    const deleted = await this.repository.deleteById(contentId);

    if (!deleted) {
      throw new ResourceNotFoundError('AI coaching content', { contentId });
    }

    return { contentId };
  }

  public async getContent(contentId: string): Promise<AiCoachingContentDto> {
    const content = await this.repository.findById(contentId);

    if (!content) {
      throw new ResourceNotFoundError('AI coaching content', { contentId });
    }

    return this.toDto(content);
  }

  public async listContent(query: ListAiCoachingContentQuery): Promise<AiCoachingContentDto[]> {
    const contentItems = await this.repository.findMany(query);

    return contentItems.map((content) => this.toDto(content));
  }

  public async updateContent(
    contentId: string,
    input: UpdateAiCoachingContentInput,
  ): Promise<AiCoachingContentDto> {
    const content = await this.repository.updateById(contentId, {
      ...input,
      ...(input.publishToApp === false ? { status: 'Draft' as const } : {}),
    });

    if (!content) {
      throw new ResourceNotFoundError('AI coaching content', { contentId });
    }

    return this.toDto(content);
  }

  private toDto(content: AiCoachingContentRecord): AiCoachingContentDto {
    return {
      category: content.category,
      coachName: content.coachName,
      coachTitle: content.coachTitle,
      createdAt: this.formatDate(content.createdAt),
      description: content.description,
      duration: content.duration,
      featured: content.featured,
      id: content.id,
      impactLabel: content.impactLabel,
      impactScore: content.impactScore,
      publishToApp: content.publishToApp,
      ...(content.recommendedProductId ? { recommendedProductId: content.recommendedProductId } : {}),
      routineSteps: content.routineSteps,
      sortOrder: content.sortOrder,
      status: content.status,
      technicalPoints: content.technicalPoints,
      ...(content.thumbnailKey ? { thumbnailKey: content.thumbnailKey } : {}),
      ...(content.thumbnailUrl ? { thumbnailUrl: content.thumbnailUrl } : {}),
      title: content.title,
      type: content.type,
      updatedAt: content.updatedAt.toISOString(),
      videoKey: content.videoKey,
      videoName: content.videoName,
      videoSizeBytes: content.videoSizeBytes,
      videoType: content.videoType,
      videoUrl: content.videoUrl,
    };
  }

  private formatDate(date: Date): string {
    return date.toLocaleDateString('en-US', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
    });
  }
}

export const aiCoachingContentService = new AiCoachingContentService(aiCoachingContentRepository);
