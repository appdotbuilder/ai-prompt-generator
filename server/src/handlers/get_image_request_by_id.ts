import { db } from '../db';
import { imageGenerationRequestsTable } from '../db/schema';
import { eq } from 'drizzle-orm';
import { type ImageGenerationRequest } from '../schema';

export const getImageRequestById = async (id: number): Promise<ImageGenerationRequest | null> => {
  try {
    // Query the database for the image generation request by ID
    const results = await db.select()
      .from(imageGenerationRequestsTable)
      .where(eq(imageGenerationRequestsTable.id, id))
      .limit(1)
      .execute();

    // Return null if no record found
    if (results.length === 0) {
      return null;
    }

    const request = results[0];

    // Return the request data with proper type conversion
    return {
      id: request.id,
      user_idea: request.user_idea,
      expanded_prompt: request.expanded_prompt,
      image_url: request.image_url,
      status: request.status,
      created_at: request.created_at,
      completed_at: request.completed_at
    };
  } catch (error) {
    console.error('Failed to get image request by ID:', error);
    throw error;
  }
};