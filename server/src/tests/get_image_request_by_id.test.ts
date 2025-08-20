import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { imageGenerationRequestsTable } from '../db/schema';
import { getImageRequestById } from '../handlers/get_image_request_by_id';

// Test data for image generation requests
const testImageRequest = {
  user_idea: 'A beautiful sunset over mountains',
  expanded_prompt: 'A breathtaking sunset painting the sky in vibrant oranges and pinks over majestic snow-capped mountains, with a serene lake reflecting the colors in the foreground',
  image_url: 'https://example.com/generated-image.jpg',
  status: 'completed' as const,
  completed_at: new Date()
};

const pendingImageRequest = {
  user_idea: 'A futuristic city',
  expanded_prompt: 'A sprawling futuristic city with towering glass buildings, flying cars, and neon lights illuminating the night sky',
  image_url: null,
  status: 'pending' as const,
  completed_at: null
};

describe('getImageRequestById', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should return image request when ID exists', async () => {
    // Insert test data
    const insertResult = await db.insert(imageGenerationRequestsTable)
      .values(testImageRequest)
      .returning()
      .execute();

    const insertedId = insertResult[0].id;

    // Get the request by ID
    const result = await getImageRequestById(insertedId);

    // Verify the result
    expect(result).not.toBeNull();
    expect(result!.id).toEqual(insertedId);
    expect(result!.user_idea).toEqual('A beautiful sunset over mountains');
    expect(result!.expanded_prompt).toEqual(testImageRequest.expanded_prompt);
    expect(result!.image_url).toEqual('https://example.com/generated-image.jpg');
    expect(result!.status).toEqual('completed');
    expect(result!.created_at).toBeInstanceOf(Date);
    expect(result!.completed_at).toBeInstanceOf(Date);
  });

  it('should return null when ID does not exist', async () => {
    const result = await getImageRequestById(999);
    expect(result).toBeNull();
  });

  it('should handle pending requests without image_url', async () => {
    // Insert pending request
    const insertResult = await db.insert(imageGenerationRequestsTable)
      .values(pendingImageRequest)
      .returning()
      .execute();

    const insertedId = insertResult[0].id;

    // Get the request by ID
    const result = await getImageRequestById(insertedId);

    // Verify the result
    expect(result).not.toBeNull();
    expect(result!.id).toEqual(insertedId);
    expect(result!.user_idea).toEqual('A futuristic city');
    expect(result!.expanded_prompt).toEqual(pendingImageRequest.expanded_prompt);
    expect(result!.image_url).toBeNull();
    expect(result!.status).toEqual('pending');
    expect(result!.created_at).toBeInstanceOf(Date);
    expect(result!.completed_at).toBeNull();
  });

  it('should handle failed requests', async () => {
    const failedRequest = {
      user_idea: 'Invalid request',
      expanded_prompt: 'This request will fail',
      image_url: null,
      status: 'failed' as const,
      completed_at: new Date()
    };

    // Insert failed request
    const insertResult = await db.insert(imageGenerationRequestsTable)
      .values(failedRequest)
      .returning()
      .execute();

    const insertedId = insertResult[0].id;

    // Get the request by ID
    const result = await getImageRequestById(insertedId);

    // Verify the result
    expect(result).not.toBeNull();
    expect(result!.id).toEqual(insertedId);
    expect(result!.status).toEqual('failed');
    expect(result!.image_url).toBeNull();
    expect(result!.completed_at).toBeInstanceOf(Date);
  });

  it('should handle processing requests', async () => {
    const processingRequest = {
      user_idea: 'A cat playing with yarn',
      expanded_prompt: 'An adorable orange tabby cat playfully batting at a ball of colorful yarn in a cozy living room',
      image_url: null,
      status: 'processing' as const,
      completed_at: null
    };

    // Insert processing request
    const insertResult = await db.insert(imageGenerationRequestsTable)
      .values(processingRequest)
      .returning()
      .execute();

    const insertedId = insertResult[0].id;

    // Get the request by ID
    const result = await getImageRequestById(insertedId);

    // Verify the result
    expect(result).not.toBeNull();
    expect(result!.id).toEqual(insertedId);
    expect(result!.user_idea).toEqual('A cat playing with yarn');
    expect(result!.status).toEqual('processing');
    expect(result!.image_url).toBeNull();
    expect(result!.completed_at).toBeNull();
  });

  it('should return correct data types', async () => {
    // Insert test data
    const insertResult = await db.insert(imageGenerationRequestsTable)
      .values(testImageRequest)
      .returning()
      .execute();

    const insertedId = insertResult[0].id;

    // Get the request by ID
    const result = await getImageRequestById(insertedId);

    // Verify data types
    expect(result).not.toBeNull();
    expect(typeof result!.id).toBe('number');
    expect(typeof result!.user_idea).toBe('string');
    expect(typeof result!.expanded_prompt).toBe('string');
    expect(typeof result!.image_url).toBe('string');
    expect(typeof result!.status).toBe('string');
    expect(result!.created_at).toBeInstanceOf(Date);
    expect(result!.completed_at).toBeInstanceOf(Date);
  });

  it('should handle zero as valid ID', async () => {
    // This test ensures we handle edge case where ID might be 0
    const result = await getImageRequestById(0);
    expect(result).toBeNull();
  });

  it('should handle negative IDs', async () => {
    const result = await getImageRequestById(-1);
    expect(result).toBeNull();
  });
});