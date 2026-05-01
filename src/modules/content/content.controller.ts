import { BaseController } from '../../common/http/base-controller';
import type { ContentParams, CreateContentInput, UpdateContentInput } from './content.schema';
import { contentService, type ContentService } from './content.service';

export class ContentController extends BaseController {
  public constructor(private readonly service: ContentService) {
    super();
  }

  public readonly createContent = this.handleRequest(async (request, response) => {
    const content = await this.service.createContent(request.body as CreateContentInput);
    this.created(response, 'Content created successfully.', content);
  });

  public readonly deleteContent = this.handleRequest(async (request, response) => {
    const result = await this.service.deleteContent((request.params as ContentParams).contentId);
    this.ok(response, 'Content deleted successfully.', result);
  });

  public readonly getContent = this.handleRequest(async (request, response) => {
    const content = await this.service.getContent((request.params as ContentParams).contentId);
    this.ok(response, 'Content fetched successfully.', content);
  });

  public readonly listContent = this.handleRequest(async (request, response) => {
    const contentItems = await this.service.listContent(request.query);
    this.ok(response, 'Content fetched successfully.', contentItems);
  });

  public readonly updateContent = this.handleRequest(async (request, response) => {
    const content = await this.service.updateContent(
      (request.params as ContentParams).contentId,
      request.body as UpdateContentInput,
    );
    this.ok(response, 'Content updated successfully.', content);
  });
}

export const contentController = new ContentController(contentService);
