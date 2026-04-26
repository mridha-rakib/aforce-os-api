import { Schema, model } from 'mongoose';
import type { InferSchemaType } from 'mongoose';

const intakeLogSchema = new Schema(
  {
    amountMl: {
      min: 1,
      required: true,
      type: Number,
    },
    barcodeValue: {
      trim: true,
      type: String,
    },
    consumedAt: {
      default: () => new Date(),
      type: Date,
    },
    electrolyteStrength: {
      enum: ['low', 'medium', 'high'],
      type: String,
    },
    hydrationScoreDelta: {
      default: 0,
      min: 0,
      type: Number,
    },
    nfcTagUid: {
      trim: true,
      type: String,
      uppercase: true,
    },
    notes: {
      trim: true,
      type: String,
    },
    productName: {
      trim: true,
      type: String,
    },
    productSku: {
      trim: true,
      type: String,
      uppercase: true,
    },
    source: {
      enum: ['water', 'electrolyte', 'nfc', 'barcode', 'manual'],
      required: true,
      type: String,
    },
    userId: {
      index: true,
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

export type IntakeLog = InferSchemaType<typeof intakeLogSchema>;

export const IntakeLogModel = model<IntakeLog>('IntakeLog', intakeLogSchema);
