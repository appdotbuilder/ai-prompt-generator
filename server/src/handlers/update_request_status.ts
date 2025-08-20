import { db } from '../db';
import { imageGenerationRequestsTable } from '../db/schema';
import { type UpdateImageRequestStatus, type ImageGenerationRequest } from '../schema';
import { eq } from 'drizzle-orm';

export const updateRequestStatus = async (input: UpdateImageRequestStatus): Promise<ImageGenerationRequest> => {
  try {
    // Build the update object with only provided fields
    const updateData: any = {
      status: input.status
    };

    // Add optional fields if they are provided
    if (input.expanded_prompt !== undefined) {
      updateData.expanded_prompt = input.expanded_prompt;
    }

    if (input.image_url !== undefined) {
      updateData.image_url = input.image_url;
    }

    if (input.completed_at !== undefined) {
      updateData.completed_at = input.completed_at;
    }

    // Update the record in the database
    const result = await db.update(imageGenerationRequestsTable)
      .set(updateData)
      .where(eq(imageGenerationRequestsTable.id, input.id))
      .returning()
      .execute();

    if (result.length === 0) {
      throw new Error(`Image generation request with id ${input.id} not found`);
    }

    return result[0];
  } catch (error) {
    console.error('Request status update failed:', error);
    throw error;
  }
};