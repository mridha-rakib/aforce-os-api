import { Schema, model } from 'mongoose';
import type { InferSchemaType } from 'mongoose';

const contentSchema = new Schema(
  {
    category: {
      index: true,
      required: true,
      trim: true,
      type: String,
    },
    mediaName: {
      trim: true,
      type: String,
    },
    mediaKey: {
      trim: true,
      type: String,
    },
    mediaType: {
      trim: true,
      type: String,
    },
    mediaUrl: {
      trim: true,
      type: String,
    },
    status: {
      default: 'Draft',
      enum: ['Published', 'Draft', 'Archived'],
      index: true,
      required: true,
      type: String,
    },
    subtitle: {
      default: '',
      maxlength: 500,
      trim: true,
      type: String,
    },
    thumbnail: {
      type: String,
    },
    thumbnailKey: {
      trim: true,
      type: String,
    },
    title: {
      required: true,
      trim: true,
      type: String,
    },
    type: {
      default: 'Video',
      enum: ['Video', 'Article', 'Tip'],
      index: true,
      required: true,
      type: String,
    },
  },
  {
    timestamps: true,
    versionKey: false,
  },
);

contentSchema.index({ category: 1, status: 1, type: 1 });
contentSchema.index({ title: 'text', subtitle: 'text', category: 'text' });

export type Content = InferSchemaType<typeof contentSchema>;

export const ContentModel = model<Content>('Content', contentSchema);
