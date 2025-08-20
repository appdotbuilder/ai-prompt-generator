import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { imageGenerationRequestsTable } from '../db/schema';
import { type UpdateImageRequestStatus } from '../schema';
import { updateRequestStatus } from '../handlers/update_request_status';
import { eq } from 'drizzle-orm';

describe('updateRequestStatus', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  // Helper function to create a test image generation request
  const createTestRequest = async () => {
    const result = await db.insert(imageGenerationRequestsTable)
      .values({
        user_idea: 'Test user idea',
        expanded_prompt: 'Original expanded prompt',
        status: 'pending'
      })
      .returning()
      .execute();
    return result[0];
  };

  it('should update request status to processing', async () => {
    const testRequest = await createTestRequest();

    const updateInput: UpdateImageRequestStatus = {
      id: testRequest.id,
      status: 'processing'
    };

    const result = await updateRequestStatus(updateInput);

    expect(result.id).toEqual(testRequest.id);
    expect(result.status).toEqual('processing');
    expect(result.user_idea).toEqual('Test user idea');
    expect(result.expanded_prompt).toEqual('Original expanded prompt');
    expect(result.image_url).toBeNull();
    expect(result.completed_at).toBeNull();
    expect(result.created_at).toBeInstanceOf(Date);
  });

  it('should update request status to completed with image URL and timestamp', async () => {
    const testRequest = await createTestRequest();
    const completedAt = new Date();

    const updateInput: UpdateImageRequestStatus = {
      id: testRequest.id,
      status: 'completed',
      image_url: 'https://example.com/generated-image.jpg',
      completed_at: completedAt
    };

    const result = await updateRequestStatus(updateInput);

    expect(result.id).toEqual(testRequest.id);
    expect(result.status).toEqual('completed');
    expect(result.image_url).toEqual('https://example.com/generated-image.jpg');
    expect(result.completed_at).toEqual(completedAt);
    expect(result.user_idea).toEqual('Test user idea');
    expect(result.expanded_prompt).toEqual('Original expanded prompt');
  });

  it('should update expanded prompt when provided', async () => {
    const testRequest = await createTestRequest();

    const updateInput: UpdateImageRequestStatus = {
      id: testRequest.id,
      status: 'processing',
      expanded_prompt: 'Updated and expanded prompt with more details'
    };

    const result = await updateRequestStatus(updateInput);

    expect(result.id).toEqual(testRequest.id);
    expect(result.status).toEqual('processing');
    expect(result.expanded_prompt).toEqual('Updated and expanded prompt with more details');
    expect(result.user_idea).toEqual('Test user idea');
  });

  it('should update request status to failed', async () => {
    const testRequest = await createTestRequest();
    const failedAt = new Date();

    const updateInput: UpdateImageRequestStatus = {
      id: testRequest.id,
      status: 'failed',
      completed_at: failedAt
    };

    const result = await updateRequestStatus(updateInput);

    expect(result.id).toEqual(testRequest.id);
    expect(result.status).toEqual('failed');
    expect(result.completed_at).toEqual(failedAt);
    expect(result.image_url).toBeNull();
  });

  it('should save updated status to database', async () => {
    const testRequest = await createTestRequest();

    const updateInput: UpdateImageRequestStatus = {
      id: testRequest.id,
      status: 'completed',
      image_url: 'https://example.com/final-image.png',
      completed_at: new Date()
    };

    const result = await updateRequestStatus(updateInput);

    // Query database directly to verify the update was persisted
    const updatedRequests = await db.select()
      .from(imageGenerationRequestsTable)
      .where(eq(imageGenerationRequestsTable.id, result.id))
      .execute();

    expect(updatedRequests).toHaveLength(1);
    expect(updatedRequests[0].status).toEqual('completed');
    expect(updatedRequests[0].image_url).toEqual('https://example.com/final-image.png');
    expect(updatedRequests[0].completed_at).toBeInstanceOf(Date);
  });

  it('should handle null image_url explicitly', async () => {
    const testRequest = await createTestRequest();

    const updateInput: UpdateImageRequestStatus = {
      id: testRequest.id,
      status: 'failed',
      image_url: null,
      completed_at: new Date()
    };

    const result = await updateRequestStatus(updateInput);

    expect(result.id).toEqual(testRequest.id);
    expect(result.status).toEqual('failed');
    expect(result.image_url).toBeNull();
    expect(result.completed_at).toBeInstanceOf(Date);
  });

  it('should throw error when request ID does not exist', async () => {
    const updateInput: UpdateImageRequestStatus = {
      id: 999999, // Non-existent ID
      status: 'processing'
    };

    await expect(updateRequestStatus(updateInput)).rejects.toThrow(/not found/i);
  });

  it('should update only specified fields, leaving others unchanged', async () => {
    const testRequest = await createTestRequest();

    // First update - set processing status and expanded prompt
    await updateRequestStatus({
      id: testRequest.id,
      status: 'processing',
      expanded_prompt: 'First update prompt'
    });

    // Second update - only change status, leave expanded_prompt unchanged
    const result = await updateRequestStatus({
      id: testRequest.id,
      status: 'completed',
      image_url: 'https://example.com/image.jpg'
    });

    expect(result.status).toEqual('completed');
    expect(result.image_url).toEqual('https://example.com/image.jpg');
    expect(result.expanded_prompt).toEqual('First update prompt'); // Should remain unchanged
    expect(result.user_idea).toEqual('Test user idea'); // Original value preserved
  });
});