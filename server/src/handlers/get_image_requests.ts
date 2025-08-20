import { db } from '../db';
import { imageGenerationRequestsTable } from '../db/schema';
import { type ImageGenerationRequest } from '../schema';
import { desc } from 'drizzle-orm';

export const getImageRequests = async (): Promise<ImageGenerationRequest[]> => {
  try {
    // Query all image generation requests ordered by creation date (most recent first)
    const results = await db.select()
      .from(imageGenerationRequestsTable)
      .orderBy(desc(imageGenerationRequestsTable.created_at))
      .execute();

    // Return results as-is since all fields are already in correct types
    // (no numeric conversions needed as we don't have numeric columns)
    return results;
  } catch (error) {
    console.error('Failed to fetch image generation requests:', error);
    throw error;
  }
};