import { db } from '../db';
import { imageGenerationRequestsTable } from '../db/schema';
import { type CreateImageRequestInput, type ImageGenerationRequest } from '../schema';

export const createImageRequest = async (input: CreateImageRequestInput): Promise<ImageGenerationRequest> => {
  try {
    // For now, we'll create a basic expanded prompt based on the user idea
    // In a real implementation, this would call an AI service to expand the prompt
    const expandedPrompt = `Create a detailed, high-quality artistic image based on this concept: ${input.user_idea}. Make it visually striking, well-composed, and artistically engaging with rich colors and professional lighting.`;

    // Insert the image generation request into the database
    const result = await db.insert(imageGenerationRequestsTable)
      .values({
        user_idea: input.user_idea,
        expanded_prompt: expandedPrompt,
        status: 'pending'
        // created_at will be set automatically by the database default
        // image_url and completed_at remain null for pending requests
      })
      .returning()
      .execute();

    return result[0];
  } catch (error) {
    console.error('Image request creation failed:', error);
    throw error;
  }
};