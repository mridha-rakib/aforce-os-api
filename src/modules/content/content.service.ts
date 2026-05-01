import { ResourceNotFoundError } from '../../common/errors/http-errors';
import {
  contentRepository,
  type ContentRecord,
  type ContentRepository,
} from './content.repository';
import type { CreateContentInput, ListContentQuery, UpdateContentInput } from './content.schema';

export interface ContentDto {
  readonly category: string;
  readonly createdAt: string;
  readonly id: string;
  readonly mediaKey?: string;
  readonly mediaName?: string;
  readonly mediaType?: string;
  readonly mediaUrl?: string;
  readonly status: ContentRecord['status'];
  readonly subtitle: string;
  readonly thumbnail?: string;
  readonly thumbnailKey?: string;
  readonly title: string;
  readonly type: ContentRecord['type'];
  readonly updatedAt: string;
}

export class ContentService {
  public constructor(private readonly repository: ContentRepository) {}

  public async createContent(input: CreateContentInput): Promise<ContentDto> {
    const content = await this.repository.create(input);

    return this.toDto(content);
  }

  public async deleteContent(contentId: string): Promise<{ contentId: string }> {
    const deleted = await this.repository.deleteById(contentId);

    if (!deleted) {
      throw new ResourceNotFoundError('Content', { contentId });
    }

    return { contentId };
  }

  public async getContent(contentId: string): Promise<ContentDto> {
    const content = await this.repository.findById(contentId);

    if (!content) {
      throw new ResourceNotFoundError('Content', { contentId });
    }

    return this.toDto(content);
  }

  public async listContent(query: ListContentQuery): Promise<ContentDto[]> {
    const contentItems = await this.repository.findMany(query);

    return contentItems.map((content) => this.toDto(content));
  }

  public async updateContent(contentId: string, input: UpdateContentInput): Promise<ContentDto> {
    const content = await this.repository.updateById(contentId, input);

    if (!content) {
      throw new ResourceNotFoundError('Content', { contentId });
    }

    return this.toDto(content);
  }

  private toDto(content: ContentRecord): ContentDto {
    return {
      category: content.category,
      createdAt: this.formatDate(content.createdAt),
      id: content.id,
      status: content.status,
      subtitle: content.subtitle,
      title: content.title,
      type: content.type,
      updatedAt: content.updatedAt.toISOString(),
      ...(content.mediaKey ? { mediaKey: content.mediaKey } : {}),
      ...(content.mediaName ? { mediaName: content.mediaName } : {}),
      ...(content.mediaType ? { mediaType: content.mediaType } : {}),
      ...(content.mediaUrl ? { mediaUrl: content.mediaUrl } : {}),
      ...(content.thumbnail ? { thumbnail: content.thumbnail } : {}),
      ...(content.thumbnailKey ? { thumbnailKey: content.thumbnailKey } : {}),
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

export const contentService = new ContentService(contentRepository);
