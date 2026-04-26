import { Schema, model } from 'mongoose';
import type { InferSchemaType } from 'mongoose';

const nfcTagSchema = new Schema(
  {
    batchCode: {
      required: true,
      trim: true,
      type: String,
    },
    electrolyteBoost: {
      default: 0,
      min: 0,
      type: Number,
    },
    flavor: {
      trim: true,
      type: String,
    },
    hydrationBoost: {
      default: 0,
      min: 0,
      type: Number,
    },
    lastScannedAt: {
      type: Date,
    },
    productName: {
      required: true,
      trim: true,
      type: String,
    },
    productSku: {
      required: true,
      trim: true,
      type: String,
      uppercase: true,
    },
    status: {
      default: 'active',
      enum: ['active', 'claimed', 'blocked', 'retired'],
      type: String,
    },
    tagUid: {
      required: true,
      trim: true,
      type: String,
      unique: true,
      uppercase: true,
    },
    volumeMl: {
      min: 1,
      required: true,
      type: Number,
    },
  },
  {
    timestamps: true,
    versionKey: false,
  },
);

export type NfcTag = InferSchemaType<typeof nfcTagSchema>;

export const NfcTagModel = model<NfcTag>('NfcTag', nfcTagSchema);
