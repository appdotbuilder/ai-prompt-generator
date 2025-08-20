import { afterEach, beforeEach, describe, expect, it } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { imageGenerationRequestsTable } from '../db/schema';
import { type CreateImageRequestInput } from '../schema';
import { createImageRequest } from '../handlers/create_image_request';
import { eq } from 'drizzle-orm';

// Simple test input
const testInput: CreateImageRequestInput = {
  user_idea: 'A majestic dragon flying over a medieval castle at sunset'
};

const shortInput: CreateImageRequestInput = {
  user_idea: 'Cat'
};

const longInput: CreateImageRequestInput = {
  user_idea: 'A complex futuristic cityscape with flying cars, neon lights, towering skyscrapers made of glass and steel, bustling crowds of people in high-tech clothing, holographic advertisements floating in the air, and a dramatic storm brewing in the background with lightning illuminating the scene in electric blue and purple hues, creating a cyberpunk atmosphere that feels both exciting and ominous at the same time'
};

describe('createImageRequest', () => {
  beforeEach(createDB);
  afterEach(resetDB);

  it('should create an image generation request', async () => {
    const result = await createImageRequest(testInput);

    // Basic field validation
    expect(result.user_idea).toEqual('A majestic dragon flying over a medieval castle at sunset');
    expect(result.expanded_prompt).toContain('A majestic dragon flying over a medieval castle at sunset');
    expect(result.expanded_prompt).toContain('Create a detailed, high-quality artistic image');
    expect(result.status).toEqual('pending');
    expect(result.image_url).toBeNull();
    expect(result.completed_at).toBeNull();
    expect(result.id).toBeDefined();
    expect(result.created_at).toBeInstanceOf(Date);
  });

  it('should save image request to database', async () => {
    const result = await createImageRequest(testInput);

    // Query the database to verify the record was saved
    const requests = await db.select()
      .from(imageGenerationRequestsTable)
      .where(eq(imageGenerationRequestsTable.id, result.id))
      .execute();

    expect(requests).toHaveLength(1);
    expect(requests[0].user_idea).toEqual('A majestic dragon flying over a medieval castle at sunset');
    expect(requests[0].expanded_prompt).toContain('Create a detailed, high-quality artistic image');
    expect(requests[0].status).toEqual('pending');
    expect(requests[0].image_url).toBeNull();
    expect(requests[0].completed_at).toBeNull();
    expect(requests[0].created_at).toBeInstanceOf(Date);
  });

  it('should handle short user ideas', async () => {
    const result = await createImageRequest(shortInput);

    expect(result.user_idea).toEqual('Cat');
    expect(result.expanded_prompt).toContain('Cat');
    expect(result.expanded_prompt).toContain('Create a detailed, high-quality artistic image');
    expect(result.status).toEqual('pending');
    expect(result.id).toBeDefined();
  });

  it('should handle long user ideas', async () => {
    const result = await createImageRequest(longInput);

    expect(result.user_idea).toEqual(longInput.user_idea);
    expect(result.expanded_prompt).toContain(longInput.user_idea);
    expect(result.expanded_prompt).toContain('Create a detailed, high-quality artistic image');
    expect(result.status).toEqual('pending');
    expect(result.id).toBeDefined();
  });

  it('should create multiple requests with unique IDs', async () => {
    const result1 = await createImageRequest(testInput);
    const result2 = await createImageRequest(shortInput);
    const result3 = await createImageRequest(longInput);

    // Verify each has a unique ID
    expect(result1.id).not.toEqual(result2.id);
    expect(result2.id).not.toEqual(result3.id);
    expect(result1.id).not.toEqual(result3.id);

    // Verify all were saved
    const allRequests = await db.select()
      .from(imageGenerationRequestsTable)
      .execute();

    expect(allRequests).toHaveLength(3);
  });

  it('should set created_at to current timestamp', async () => {
    const beforeCreation = new Date();
    const result = await createImageRequest(testInput);
    const afterCreation = new Date();

    expect(result.created_at).toBeInstanceOf(Date);
    expect(result.created_at.getTime()).toBeGreaterThanOrEqual(beforeCreation.getTime());
    expect(result.created_at.getTime()).toBeLessThanOrEqual(afterCreation.getTime());
  });

  it('should properly initialize nullable fields', async () => {
    const result = await createImageRequest(testInput);

    // These fields should be null for new pending requests
    expect(result.image_url).toBeNull();
    expect(result.completed_at).toBeNull();
    
    // This field should be set to the default enum value
    expect(result.status).toEqual('pending');
  });
});