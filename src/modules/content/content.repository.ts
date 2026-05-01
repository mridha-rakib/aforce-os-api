import type { HydratedDocument } from 'mongoose';

import { ContentModel } from './content.model';
import type { Content } from './content.model';
import type { CreateContentInput, ListContentQuery, UpdateContentInput } from './content.schema';

export type ContentStatus = 'Published' | 'Draft' | 'Archived';
export type ContentType = 'Video' | 'Article' | 'Tip';

export interface ContentRecord {
  readonly category: string;
  readonly createdAt: Date;
  readonly id: string;
  readonly mediaKey?: string;
  readonly mediaName?: string;
  readonly mediaType?: string;
  readonly mediaUrl?: string;
  readonly status: ContentStatus;
  readonly subtitle: string;
  readonly thumbnail?: string;
  readonly thumbnailKey?: string;
  readonly title: string;
  readonly type: ContentType;
  readonly updatedAt: Date;
}

interface ContentSnapshot {
  category: string;
  createdAt: Date;
  mediaKey?: string | null;
  mediaName?: string | null;
  mediaType?: string | null;
  mediaUrl?: string | null;
  status: ContentStatus;
  subtitle?: string;
  thumbnail?: string | null;
  thumbnailKey?: string | null;
  title: string;
  type: ContentType;
  updatedAt: Date;
}

interface ContentFindFilters {
  $or?: Array<{ category: RegExp } | { subtitle: RegExp } | { title: RegExp }>;
  category?: string;
  status?: ContentStatus;
  type?: ContentType;
}

export class ContentRepository {
  public async create(input: CreateContentInput): Promise<ContentRecord> {
    const content = new ContentModel({
      category: input.category,
      status: input.status,
      subtitle: input.subtitle ?? '',
      title: input.title,
      type: input.type,
    });

    if (input.mediaName) {
      content.mediaName = input.mediaName;
    }

    if (input.mediaKey) {
      content.mediaKey = input.mediaKey;
    }

    if (input.mediaType) {
      content.mediaType = input.mediaType;
    }

    if (input.mediaUrl) {
      content.mediaUrl = input.mediaUrl;
    }

    if (input.thumbnail) {
      content.thumbnail = input.thumbnail;
    }

    if (input.thumbnailKey) {
      content.thumbnailKey = input.thumbnailKey;
    }

    await content.save();

    return this.toRecord(content);
  }

  public async deleteById(contentId: string): Promise<ContentRecord | null> {
    const content = await ContentModel.findByIdAndDelete(contentId).exec();

    return content ? this.toRecord(content) : null;
  }

  public async findById(contentId: string): Promise<ContentRecord | null> {
    const content = await ContentModel.findById(contentId).exec();

    return content ? this.toRecord(content) : null;
  }

  public async findMany(query: ListContentQuery): Promise<ContentRecord[]> {
    const filters: ContentFindFilters = {};

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
      filters.$or = [{ category: expression }, { subtitle: expression }, { title: expression }];
    }

    const contentItems = await ContentModel.find(filters).sort({ createdAt: -1 }).exec();

    return contentItems.map((content) => this.toRecord(content));
  }

  public async updateById(contentId: string, input: UpdateContentInput): Promise<ContentRecord | null> {
    const set: Partial<{
      category: string;
      mediaKey: string;
      mediaName: string;
      mediaType: string;
      mediaUrl: string;
      status: ContentStatus;
      subtitle: string;
      thumbnail: string;
      thumbnailKey: string;
      title: string;
      type: ContentType;
    }> = {};
    const unset: Record<string, 1> = {};

    if (input.category) {
      set.category = input.category;
    }

    if (input.mediaName !== undefined) {
      if (input.mediaName) {
        set.mediaName = input.mediaName;
      } else {
        unset.mediaName = 1;
      }
    }

    if (input.mediaKey !== undefined) {
      if (input.mediaKey) {
        set.mediaKey = input.mediaKey;
      } else {
        unset.mediaKey = 1;
      }
    }

    if (input.mediaType !== undefined) {
      if (input.mediaType) {
        set.mediaType = input.mediaType;
      } else {
        unset.mediaType = 1;
      }
    }

    if (input.mediaUrl !== undefined) {
      if (input.mediaUrl) {
        set.mediaUrl = input.mediaUrl;
      } else {
        unset.mediaUrl = 1;
      }
    }

    if (input.status) {
      set.status = input.status;
    }

    if (input.subtitle !== undefined) {
      set.subtitle = input.subtitle ?? '';
    }

    if (input.thumbnail !== undefined) {
      if (input.thumbnail) {
        set.thumbnail = input.thumbnail;
      } else {
        unset.thumbnail = 1;
      }
    }

    if (input.thumbnailKey !== undefined) {
      if (input.thumbnailKey) {
        set.thumbnailKey = input.thumbnailKey;
      } else {
        unset.thumbnailKey = 1;
      }
    }

    if (input.title) {
      set.title = input.title;
    }

    if (input.type) {
      set.type = input.type;
    }

    const content = await ContentModel.findByIdAndUpdate(
      contentId,
      {
        ...(Object.keys(set).length > 0 ? { $set: set } : {}),
        ...(Object.keys(unset).length > 0 ? { $unset: unset } : {}),
      },
      { new: true, runValidators: true },
    ).exec();

    return content ? this.toRecord(content) : null;
  }

  private toRecord(document: HydratedDocument<Content>): ContentRecord {
    const snapshot = document.toObject() as ContentSnapshot;
    const record: ContentRecord = {
      category: snapshot.category,
      createdAt: snapshot.createdAt,
      id: document.id,
      status: snapshot.status,
      subtitle: snapshot.subtitle ?? '',
      title: snapshot.title,
      type: snapshot.type,
      updatedAt: snapshot.updatedAt,
    };

    return {
      ...record,
      ...(snapshot.mediaKey ? { mediaKey: snapshot.mediaKey } : {}),
      ...(snapshot.mediaName ? { mediaName: snapshot.mediaName } : {}),
      ...(snapshot.mediaType ? { mediaType: snapshot.mediaType } : {}),
      ...(snapshot.mediaUrl ? { mediaUrl: snapshot.mediaUrl } : {}),
      ...(snapshot.thumbnail ? { thumbnail: snapshot.thumbnail } : {}),
      ...(snapshot.thumbnailKey ? { thumbnailKey: snapshot.thumbnailKey } : {}),
    };
  }
}

function escapeRegExp(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

export const contentRepository = new ContentRepository();
