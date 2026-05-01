import { Types } from 'mongoose';

import { ResourceNotFoundError } from '../../common/errors/http-errors';
import {
  aiCoachingContentRepository,
  type AiCoachingContentRecord,
  type AiCoachingContentRepository,
} from '../ai-coaching/ai-coaching.repository';
import {
  productRepository,
  type ProductRecord,
  type ProductRepository,
} from '../products/product.repository';
import type { CoachingFeedQuery } from './coaching.schema';

const DEFAULT_CATEGORIES = ['Workout', 'Hydration', 'Recovery', 'Nutrition'];

const DEFAULT_TECHNICAL_POINTS = [
  'Electrolyte balance and serum optimization',
  'Cellular hydration mechanics during exertion',
  'Post-workout recovery timing windows',
];

const DEFAULT_ROUTINE_STEPS = [
  { label: '01 MORNING HYDRATION', value: '16 oz water + 1 AForce stick' },
  { label: '02 POST-WORKOUT WINDOW', value: 'Electrolytes within 30 minutes' },
  { label: '03 DAILY TRACKING', value: 'Log intake in AForce OS' },
];

const DEFAULT_THUMBNAIL_URL =
  'https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?q=80&w=2070&auto=format&fit=crop';

const THUMBNAIL_BY_CATEGORY: Record<string, string> = {
  Hydration: DEFAULT_THUMBNAIL_URL,
  Nutrition: 'https://images.unsplash.com/photo-1512621776951-a57141f2eefd?q=80&w=2070&auto=format&fit=crop',
  Recovery: 'https://images.unsplash.com/photo-1517836357463-d25dfeac3438?q=80&w=2070&auto=format&fit=crop',
  Workout: 'https://images.unsplash.com/photo-1544367567-0f2fcb009e0b?q=80&w=1840&auto=format&fit=crop',
};

export interface CoachingCategoryDto {
  readonly id: string;
  readonly label: string;
}

export interface CoachingCardDto {
  readonly category: string;
  readonly coachName: string;
  readonly coachTitle: string;
  readonly description: string;
  readonly detailRoute: string;
  readonly duration: string;
  readonly id: string;
  readonly impactLabel: string;
  readonly impactScore: number;
  readonly impactText: string;
  readonly isFavorite: boolean;
  readonly thumbnailUrl: string;
  readonly title: string;
  readonly type: AiCoachingContentRecord['type'];
  readonly videoUrl: string;
}

export interface CoachingProductDto {
  readonly compareAtPrice?: number;
  readonly compareAtPriceLabel?: string;
  readonly ctaLabel: string;
  readonly id: string;
  readonly imageUrl?: string;
  readonly name: string;
  readonly price: number;
  readonly priceLabel: string;
  readonly subtitle: string;
}

export interface CoachingPerformanceProjectionDto {
  readonly impactScore: number;
  readonly label: string;
  readonly title: string;
}

export interface CoachingRoutineStepDto {
  readonly label: string;
  readonly value: string;
}

export interface CoachingDetailDto extends CoachingCardDto {
  readonly performanceProjection: CoachingPerformanceProjectionDto;
  readonly recommendedFuel: CoachingProductDto | null;
  readonly suggestedRoutine: CoachingRoutineStepDto[];
  readonly technicalPoints: string[];
}

export interface CoachingFeedDto {
  readonly categories: CoachingCategoryDto[];
  readonly coachChoice: CoachingProductDto | null;
  readonly featured: CoachingCardDto | null;
  readonly recommended: CoachingCardDto[];
}

const DEMO_PRODUCT: CoachingProductDto = {
  compareAtPrice: 4,
  compareAtPriceLabel: '$4.00',
  ctaLabel: 'ADD TO CART',
  id: 'demo-aforce-stick',
  imageUrl: 'https://cdn.shopify.com/s/files/1/0533/0845/7140/products/stick-pack-1_800x.png?v=1614343202',
  name: 'AFORCE STICK',
  price: 2.49,
  priceLabel: '$2.49',
  subtitle: 'BEFORE WORKOUT FUEL',
};

const DEMO_CONTENT: AiCoachingContentRecord[] = [
  {
    category: 'Workout',
    coachName: 'Marcus Vane',
    coachTitle: 'Nutrition Specialist',
    createdAt: new Date('2026-04-01T00:00:00.000Z'),
    description: 'Build a practical pre-training hydration strategy for high-output sessions.',
    duration: '12 MIN',
    featured: true,
    id: 'demo-hydration-strategy',
    impactLabel: 'HYDRATION IMPACT',
    impactScore: 12,
    publishToApp: true,
    recommendedProductId: DEMO_PRODUCT.id,
    routineSteps: DEFAULT_ROUTINE_STEPS,
    sortOrder: 1,
    status: 'Published',
    technicalPoints: DEFAULT_TECHNICAL_POINTS,
    thumbnailUrl: THUMBNAIL_BY_CATEGORY.Workout ?? DEFAULT_THUMBNAIL_URL,
    title: 'HYDRATION STRATEGY FOR HIGH PERFORMANCE',
    type: 'Video',
    updatedAt: new Date('2026-04-01T00:00:00.000Z'),
    videoKey: 'demo/videos/hydration-strategy.mp4',
    videoName: 'hydration-strategy.mp4',
    videoSizeBytes: 1,
    videoType: 'video/mp4',
    videoUrl: 'https://cdn.coverr.co/videos/coverr-running-athlete-training-3487/1080p.mp4',
  },
  {
    category: 'Workout',
    coachName: 'Dr. Sarah Chen',
    coachTitle: 'Performance Coach',
    createdAt: new Date('2026-04-02T00:00:00.000Z'),
    description: 'A quick hydration primer to complete before your warmup.',
    duration: '12 MIN',
    featured: false,
    id: 'demo-hydrate-before-workouts',
    impactLabel: 'HYDRATION IMPACT',
    impactScore: 8,
    publishToApp: true,
    routineSteps: DEFAULT_ROUTINE_STEPS,
    sortOrder: 2,
    status: 'Published',
    technicalPoints: DEFAULT_TECHNICAL_POINTS,
    thumbnailUrl: 'https://images.unsplash.com/photo-1544367567-0f2fcb009e0b?q=80&w=1840&auto=format&fit=crop',
    title: 'HYDRATE BEFORE WORKOUTS',
    type: 'Video',
    updatedAt: new Date('2026-04-02T00:00:00.000Z'),
    videoKey: 'demo/videos/hydrate-before-workouts.mp4',
    videoName: 'hydrate-before-workouts.mp4',
    videoSizeBytes: 1,
    videoType: 'video/mp4',
    videoUrl: 'https://cdn.coverr.co/videos/coverr-woman-doing-yoga-2270/1080p.mp4',
  },
  {
    category: 'Hydration',
    coachName: 'Mike Rossi',
    coachTitle: 'Athlete Coach',
    createdAt: new Date('2026-04-03T00:00:00.000Z'),
    description: 'Start the day with a fluid and sodium routine that is easy to repeat.',
    duration: '08 MIN',
    featured: false,
    id: 'demo-morning-hydration',
    impactLabel: 'HYDRATION IMPACT',
    impactScore: 7,
    publishToApp: true,
    routineSteps: DEFAULT_ROUTINE_STEPS,
    sortOrder: 3,
    status: 'Published',
    technicalPoints: DEFAULT_TECHNICAL_POINTS,
    thumbnailUrl: 'https://images.unsplash.com/photo-1512621776951-a57141f2eefd?q=80&w=2070&auto=format&fit=crop',
    title: 'MORNING HYDRATION ROUTINE',
    type: 'Video',
    updatedAt: new Date('2026-04-03T00:00:00.000Z'),
    videoKey: 'demo/videos/morning-hydration.mp4',
    videoName: 'morning-hydration.mp4',
    videoSizeBytes: 1,
    videoType: 'video/mp4',
    videoUrl: 'https://cdn.coverr.co/videos/coverr-preparing-a-healthy-smoothie-1659/1080p.mp4',
  },
  {
    category: 'Recovery',
    coachName: 'Elena Grant',
    coachTitle: 'Recovery Specialist',
    createdAt: new Date('2026-04-04T00:00:00.000Z'),
    description: 'Match post-workout fluid timing to the effort you just completed.',
    duration: '15 MIN',
    featured: false,
    id: 'demo-post-workout-rehydration',
    impactLabel: 'HYDRATION IMPACT',
    impactScore: 9,
    publishToApp: true,
    recommendedProductId: DEMO_PRODUCT.id,
    routineSteps: DEFAULT_ROUTINE_STEPS,
    sortOrder: 4,
    status: 'Published',
    technicalPoints: DEFAULT_TECHNICAL_POINTS,
    thumbnailUrl: 'https://images.unsplash.com/photo-1517836357463-d25dfeac3438?q=80&w=2070&auto=format&fit=crop',
    title: 'POST-WORKOUT REHYDRATION',
    type: 'Video',
    updatedAt: new Date('2026-04-04T00:00:00.000Z'),
    videoKey: 'demo/videos/post-workout-rehydration.mp4',
    videoName: 'post-workout-rehydration.mp4',
    videoSizeBytes: 1,
    videoType: 'video/mp4',
    videoUrl: 'https://cdn.coverr.co/videos/coverr-people-training-in-the-gym-5830/1080p.mp4',
  },
];

export class CoachingService {
  public constructor(
    private readonly coachingContent: AiCoachingContentRepository,
    private readonly products: ProductRepository,
  ) {}

  public async getFeed(query: CoachingFeedQuery = {}): Promise<CoachingFeedDto> {
    const allItems = await this.getPublishedItems();
    const visibleItems = this.filterByCategory(allItems, query.category);
    const featured = visibleItems.find((item) => item.featured) ?? visibleItems[0] ?? null;
    const recommended = visibleItems.filter((item) => item.id !== featured?.id).slice(0, 10);
    const product = await this.getProduct(featured?.recommendedProductId);

    return {
      categories: this.getCategories(allItems),
      coachChoice: product,
      featured: featured ? this.toCardDto(featured) : null,
      recommended: recommended.map((item) => this.toCardDto(item)),
    };
  }

  public async getContent(contentId: string): Promise<CoachingDetailDto> {
    const demoItem = DEMO_CONTENT.find((item) => item.id === contentId);
    const item = demoItem ?? (await this.coachingContent.findPublishedById(contentId));

    if (!item) {
      throw new ResourceNotFoundError('Coaching content', { contentId });
    }

    const recommendedFuel = await this.getProduct(item.recommendedProductId);

    return {
      ...this.toCardDto(item),
      performanceProjection: {
        impactScore: item.impactScore,
        label: 'PERFORMANCE PROJECTION',
        title: 'Hydration Score Impact',
      },
      recommendedFuel,
      suggestedRoutine: item.routineSteps.length > 0 ? item.routineSteps : DEFAULT_ROUTINE_STEPS,
      technicalPoints: item.technicalPoints.length > 0 ? item.technicalPoints : DEFAULT_TECHNICAL_POINTS,
    };
  }

  private filterByCategory(items: AiCoachingContentRecord[], category?: string): AiCoachingContentRecord[] {
    if (!category) {
      return items;
    }

    return items.filter((item) => item.category.toLowerCase() === category.toLowerCase());
  }

  private formatCurrency(value: number): string {
    return `$${value.toFixed(2)}`;
  }

  private getCategories(items: AiCoachingContentRecord[]): CoachingCategoryDto[] {
    const categories = new Set([...DEFAULT_CATEGORIES, ...items.map((item) => item.category)]);

    return Array.from(categories).map((label) => ({
      id: label.toLowerCase().replace(/\s+/g, '-'),
      label,
    }));
  }

  private async getProduct(productId?: string): Promise<CoachingProductDto | null> {
    if (productId === DEMO_PRODUCT.id) {
      return DEMO_PRODUCT;
    }

    if (productId && Types.ObjectId.isValid(productId)) {
      const product = await this.products.findById(productId);

      if (product?.status === 'Active') {
        return this.toProductDto(product);
      }
    }

    const products = await this.products.findMany({ status: 'Active' });
    const firstProduct = products[0];

    return firstProduct ? this.toProductDto(firstProduct) : DEMO_PRODUCT;
  }

  private async getPublishedItems(): Promise<AiCoachingContentRecord[]> {
    const content = await this.coachingContent.findPublishedForApp();

    return content.length > 0 ? content : DEMO_CONTENT;
  }

  private getThumbnailUrl(content: AiCoachingContentRecord): string {
    return content.thumbnailUrl ?? THUMBNAIL_BY_CATEGORY[content.category] ?? DEFAULT_THUMBNAIL_URL;
  }

  private toCardDto(content: AiCoachingContentRecord): CoachingCardDto {
    return {
      category: content.category,
      coachName: content.coachName,
      coachTitle: content.coachTitle,
      description: content.description,
      detailRoute: `/couching?contentId=${encodeURIComponent(content.id)}`,
      duration: content.duration || '08 MIN',
      id: content.id,
      impactLabel: content.impactLabel,
      impactScore: content.impactScore,
      impactText: `${content.impactLabel}: ${content.impactScore >= 0 ? '+' : ''}${content.impactScore} SCORE`,
      isFavorite: false,
      thumbnailUrl: this.getThumbnailUrl(content),
      title: content.title,
      type: content.type,
      videoUrl: content.videoUrl,
    };
  }

  private toProductDto(product: ProductRecord): CoachingProductDto {
    return {
      ctaLabel: 'ADD TO CART',
      id: product.id,
      ...(product.image ? { imageUrl: product.image } : {}),
      name: product.name,
      price: product.price,
      priceLabel: this.formatCurrency(product.price),
      subtitle: product.description || product.category,
    };
  }
}

export const coachingService = new CoachingService(aiCoachingContentRepository, productRepository);
