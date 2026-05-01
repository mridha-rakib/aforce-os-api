import { Schema, model } from 'mongoose';
import type { InferSchemaType } from 'mongoose';

const aiCoachingContentSchema = new Schema(
  {
    category: {
      index: true,
      required: true,
      trim: true,
      type: String,
    },
    coachName: {
      default: 'AForce Coach',
      trim: true,
      type: String,
    },
    coachTitle: {
      default: 'Hydration Specialist',
      trim: true,
      type: String,
    },
    description: {
      default: '',
      maxlength: 300,
      trim: true,
      type: String,
    },
    duration: {
      default: '',
      trim: true,
      type: String,
    },
    featured: {
      default: false,
      index: true,
      type: Boolean,
    },
    impactLabel: {
      default: 'HYDRATION IMPACT',
      trim: true,
      type: String,
    },
    impactScore: {
      default: 8,
      type: Number,
    },
    publishToApp: {
      default: true,
      index: true,
      required: true,
      type: Boolean,
    },
    recommendedProductId: {
      trim: true,
      type: String,
    },
    routineSteps: {
      default: [],
      type: [
        {
          _id: false,
          label: {
            required: true,
            trim: true,
            type: String,
          },
          value: {
            required: true,
            trim: true,
            type: String,
          },
        },
      ],
    },
    sortOrder: {
      default: 100,
      index: true,
      type: Number,
    },
    status: {
      default: 'Published',
      enum: ['Published', 'Draft', 'Archived'],
      index: true,
      required: true,
      type: String,
    },
    technicalPoints: {
      default: [],
      type: [String],
    },
    thumbnailKey: {
      trim: true,
      type: String,
    },
    thumbnailUrl: {
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
    videoKey: {
      required: true,
      trim: true,
      type: String,
    },
    videoName: {
      required: true,
      trim: true,
      type: String,
    },
    videoSizeBytes: {
      min: 1,
      required: true,
      type: Number,
    },
    videoType: {
      required: true,
      trim: true,
      type: String,
    },
    videoUrl: {
      required: true,
      trim: true,
      type: String,
    },
  },
  {
    timestamps: true,
    versionKey: false,
  },
);

aiCoachingContentSchema.index({ category: 1, status: 1, type: 1 });
aiCoachingContentSchema.index({ publishToApp: 1, status: 1, featured: -1, sortOrder: 1 });
aiCoachingContentSchema.index({ title: 'text', description: 'text', category: 'text' });

export type AiCoachingContent = InferSchemaType<typeof aiCoachingContentSchema>;

export const AiCoachingContentModel = model<AiCoachingContent>('AiCoachingContent', aiCoachingContentSchema);
