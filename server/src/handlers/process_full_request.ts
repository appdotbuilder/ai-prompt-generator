import { db } from '../db';
import { imageGenerationRequestsTable } from '../db/schema';
import { type CreateImageRequestInput, type ImageGenerationRequest } from '../schema';
import { expandPrompt } from './expand_prompt';
import { generateImage } from './generate_image';
import { eq } from 'drizzle-orm';

export const processFullRequest = async (input: CreateImageRequestInput): Promise<ImageGenerationRequest> => {
    let requestId: number | undefined;
    
    try {
        // Step 1: Create initial request with 'pending' status
        const initialResult = await db.insert(imageGenerationRequestsTable)
            .values({
                user_idea: input.user_idea,
                expanded_prompt: '', // Will be updated after expansion
                status: 'pending'
            })
            .returning()
            .execute();
        
        const initialRequest = initialResult[0];
        requestId = initialRequest.id;

        // Step 2: Expand the user idea into a detailed prompt using AI
        const { expanded_prompt } = await expandPrompt(input.user_idea);

        // Step 3: Update status to 'processing' and save expanded prompt
        await db.update(imageGenerationRequestsTable)
            .set({
                expanded_prompt,
                status: 'processing'
            })
            .where(eq(imageGenerationRequestsTable.id, requestId))
            .execute();

        // Step 4: Generate image using the expanded prompt
        const { image_url } = await generateImage(expanded_prompt);

        // Step 5: Update status to 'completed' with image URL and completion timestamp
        const completedResult = await db.update(imageGenerationRequestsTable)
            .set({
                image_url,
                status: 'completed',
                completed_at: new Date()
            })
            .where(eq(imageGenerationRequestsTable.id, requestId))
            .returning()
            .execute();

        return completedResult[0];

    } catch (error) {
        console.error('Full request processing failed:', error);
        
        // Step 6: Handle any errors by setting status to 'failed'
        if (requestId) {
            const failedResult = await db.update(imageGenerationRequestsTable)
                .set({
                    status: 'failed',
                    completed_at: new Date()
                })
                .where(eq(imageGenerationRequestsTable.id, requestId))
                .returning()
                .execute();
            
            return failedResult[0];
        }
        
        // If we couldn't even create the initial request, re-throw the error
        throw error;
    }
};