import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { imageGenerationRequestsTable } from '../db/schema';
import { getImageRequests } from '../handlers/get_image_requests';
import { eq } from 'drizzle-orm';

describe('getImageRequests', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should return empty array when no requests exist', async () => {
    const result = await getImageRequests();
    
    expect(result).toEqual([]);
    expect(result).toHaveLength(0);
  });

  it('should return all image generation requests', async () => {
    // Create test data
    await db.insert(imageGenerationRequestsTable)
      .values([
        {
          user_idea: 'A beautiful sunset',
          expanded_prompt: 'A stunning sunset with vibrant colors over a peaceful ocean',
          status: 'completed',
          image_url: 'https://example.com/sunset.jpg'
        },
        {
          user_idea: 'A cat playing',
          expanded_prompt: 'An adorable kitten playing with a ball of yarn',
          status: 'processing',
          image_url: null
        },
        {
          user_idea: 'Mountain landscape',
          expanded_prompt: 'A majestic mountain range during golden hour',
          status: 'pending',
          image_url: null
        }
      ])
      .execute();

    const result = await getImageRequests();

    expect(result).toHaveLength(3);
    
    // Verify all required fields are present
    result.forEach(request => {
      expect(request.id).toBeDefined();
      expect(typeof request.user_idea).toBe('string');
      expect(typeof request.expanded_prompt).toBe('string');
      expect(request.status).toMatch(/^(pending|processing|completed|failed)$/);
      expect(request.created_at).toBeInstanceOf(Date);
      expect(request.completed_at === null || request.completed_at instanceof Date).toBe(true);
      expect(request.image_url === null || typeof request.image_url === 'string').toBe(true);
    });

    // Verify specific content
    const userIdeas = result.map(r => r.user_idea);
    expect(userIdeas).toContain('A beautiful sunset');
    expect(userIdeas).toContain('A cat playing');
    expect(userIdeas).toContain('Mountain landscape');
  });

  it('should return requests ordered by creation date (most recent first)', async () => {
    // Create requests with different timestamps
    const now = new Date();
    const oneHourAgo = new Date(now.getTime() - 60 * 60 * 1000);
    const twoHoursAgo = new Date(now.getTime() - 2 * 60 * 60 * 1000);

    // Insert in non-chronological order to test sorting
    await db.insert(imageGenerationRequestsTable)
      .values([
        {
          user_idea: 'Middle request',
          expanded_prompt: 'Created one hour ago',
          status: 'completed',
          created_at: oneHourAgo
        },
        {
          user_idea: 'Latest request',
          expanded_prompt: 'Created most recently',
          status: 'pending',
          created_at: now
        },
        {
          user_idea: 'Oldest request',
          expanded_prompt: 'Created two hours ago',
          status: 'processing',
          created_at: twoHoursAgo
        }
      ])
      .execute();

    const result = await getImageRequests();

    expect(result).toHaveLength(3);
    
    // Verify ordering - most recent first
    expect(result[0].user_idea).toBe('Latest request');
    expect(result[1].user_idea).toBe('Middle request');
    expect(result[2].user_idea).toBe('Oldest request');
    
    // Verify timestamps are in descending order
    expect(result[0].created_at >= result[1].created_at).toBe(true);
    expect(result[1].created_at >= result[2].created_at).toBe(true);
  });

  it('should handle requests with different statuses correctly', async () => {
    // Create requests with all possible statuses
    await db.insert(imageGenerationRequestsTable)
      .values([
        {
          user_idea: 'Pending request',
          expanded_prompt: 'This is pending',
          status: 'pending'
        },
        {
          user_idea: 'Processing request',
          expanded_prompt: 'This is processing',
          status: 'processing'
        },
        {
          user_idea: 'Completed request',
          expanded_prompt: 'This is completed',
          status: 'completed',
          image_url: 'https://example.com/image.jpg',
          completed_at: new Date()
        },
        {
          user_idea: 'Failed request',
          expanded_prompt: 'This failed',
          status: 'failed',
          completed_at: new Date()
        }
      ])
      .execute();

    const result = await getImageRequests();

    expect(result).toHaveLength(4);
    
    // Verify all statuses are represented
    const statuses = result.map(r => r.status);
    expect(statuses).toContain('pending');
    expect(statuses).toContain('processing');
    expect(statuses).toContain('completed');
    expect(statuses).toContain('failed');

    // Verify completed request has image_url and completed_at
    const completedRequest = result.find(r => r.status === 'completed');
    expect(completedRequest?.image_url).toBe('https://example.com/image.jpg');
    expect(completedRequest?.completed_at).toBeInstanceOf(Date);

    // Verify failed request has completed_at but no image_url
    const failedRequest = result.find(r => r.status === 'failed');
    expect(failedRequest?.image_url).toBeNull();
    expect(failedRequest?.completed_at).toBeInstanceOf(Date);

    // Verify pending/processing requests don't have image_url or completed_at
    const pendingRequest = result.find(r => r.status === 'pending');
    expect(pendingRequest?.image_url).toBeNull();
    expect(pendingRequest?.completed_at).toBeNull();
  });

  it('should persist data correctly in database', async () => {
    // Create a test request
    const testData = {
      user_idea: 'Test persistence',
      expanded_prompt: 'Testing database persistence',
      status: 'completed' as const,
      image_url: 'https://example.com/test.jpg'
    };

    await db.insert(imageGenerationRequestsTable)
      .values(testData)
      .execute();

    const result = await getImageRequests();
    expect(result).toHaveLength(1);

    // Verify data persisted correctly by querying directly from database
    const dbRecord = await db.select()
      .from(imageGenerationRequestsTable)
      .where(eq(imageGenerationRequestsTable.id, result[0].id))
      .execute();

    expect(dbRecord).toHaveLength(1);
    expect(dbRecord[0].user_idea).toBe(testData.user_idea);
    expect(dbRecord[0].expanded_prompt).toBe(testData.expanded_prompt);
    expect(dbRecord[0].status).toBe(testData.status);
    expect(dbRecord[0].image_url).toBe(testData.image_url);
    expect(dbRecord[0].created_at).toBeInstanceOf(Date);
  });
});