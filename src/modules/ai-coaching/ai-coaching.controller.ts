import { BaseController } from '../../common/http/base-controller';
import type {
  AiCoachingContentParams,
  CreateAiCoachingContentInput,
  UpdateAiCoachingContentInput,
} from './ai-coaching.schema';
import {
  aiCoachingContentService,
  type AiCoachingContentService,
} from './ai-coaching.service';

export class AiCoachingContentController extends BaseController {
  public constructor(private readonly service: AiCoachingContentService) {
    super();
  }

  public readonly createContent = this.handleRequest(async (request, response) => {
    const content = await this.service.createContent(request.body as CreateAiCoachingContentInput);
    this.created(response, 'AI coaching content created successfully.', content);
  });

  public readonly deleteContent = this.handleRequest(async (request, response) => {
    const result = await this.service.deleteContent((request.params as AiCoachingContentParams).contentId);
    this.ok(response, 'AI coaching content deleted successfully.', result);
  });

  public readonly getContent = this.handleRequest(async (request, response) => {
    const content = await this.service.getContent((request.params as AiCoachingContentParams).contentId);
    this.ok(response, 'AI coaching content fetched successfully.', content);
  });

  public readonly listContent = this.handleRequest(async (request, response) => {
    const contentItems = await this.service.listContent(request.query);
    this.ok(response, 'AI coaching content fetched successfully.', contentItems);
  });

  public readonly updateContent = this.handleRequest(async (request, response) => {
    const content = await this.service.updateContent(
      (request.params as AiCoachingContentParams).contentId,
      request.body as UpdateAiCoachingContentInput,
    );
    this.ok(response, 'AI coaching content updated successfully.', content);
  });
}

export const aiCoachingContentController = new AiCoachingContentController(aiCoachingContentService);
