import { afterEach, beforeEach, describe, expect, it, mock } from 'bun:test';
import { resetDB, createDB } from '../helpers';
import { db } from '../db';
import { imageGenerationRequestsTable } from '../db/schema';
import { type CreateImageRequestInput } from '../schema';
import { eq } from 'drizzle-orm';

const testInput: CreateImageRequestInput = {
    user_idea: 'A beautiful sunset over mountains'
};

describe('processFullRequest', () => {
    beforeEach(async () => {
        await resetDB();
        await createDB();
    });

    afterEach(async () => {
        await resetDB();
    });

    it('should process complete request successfully', async () => {
        // Mock the external handlers for this test
        mock.module('../handlers/expand_prompt', () => ({
            expandPrompt: mock(() => Promise.resolve({ expanded_prompt: 'A detailed AI-generated prompt' }))
        }));

        mock.module('../handlers/generate_image', () => ({
            generateImage: mock(() => Promise.resolve({ image_url: 'https://example.com/generated-image.jpg' }))
        }));

        // Import after mocking
        const { processFullRequest } = await import('../handlers/process_full_request');
        const result = await processFullRequest(testInput);

        // Verify final result
        expect(result.user_idea).toEqual('A beautiful sunset over mountains');
        expect(result.expanded_prompt).toEqual('A detailed AI-generated prompt');
        expect(result.image_url).toEqual('https://example.com/generated-image.jpg');
        expect(result.status).toEqual('completed');
        expect(result.id).toBeDefined();
        expect(result.created_at).toBeInstanceOf(Date);
        expect(result.completed_at).toBeInstanceOf(Date);
    });

    it('should save completed request to database', async () => {
        // Mock the external handlers for this test
        mock.module('../handlers/expand_prompt', () => ({
            expandPrompt: mock(() => Promise.resolve({ expanded_prompt: 'A detailed AI-generated prompt' }))
        }));

        mock.module('../handlers/generate_image', () => ({
            generateImage: mock(() => Promise.resolve({ image_url: 'https://example.com/generated-image.jpg' }))
        }));

        // Import after mocking
        const { processFullRequest } = await import('../handlers/process_full_request');
        const result = await processFullRequest(testInput);

        // Query database to verify final state
        const requests = await db.select()
            .from(imageGenerationRequestsTable)
            .where(eq(imageGenerationRequestsTable.id, result.id))
            .execute();

        expect(requests).toHaveLength(1);
        const request = requests[0];
        expect(request.user_idea).toEqual('A beautiful sunset over mountains');
        expect(request.expanded_prompt).toEqual('A detailed AI-generated prompt');
        expect(request.image_url).toEqual('https://example.com/generated-image.jpg');
        expect(request.status).toEqual('completed');
        expect(request.completed_at).toBeInstanceOf(Date);
    });

    it('should handle prompt expansion failure', async () => {
        // Mock expand prompt to fail
        mock.module('../handlers/expand_prompt', () => ({
            expandPrompt: mock(() => Promise.reject(new Error('AI service unavailable')))
        }));

        mock.module('../handlers/generate_image', () => ({
            generateImage: mock(() => Promise.resolve({ image_url: 'https://example.com/generated-image.jpg' }))
        }));

        // Import after mocking
        const { processFullRequest } = await import('../handlers/process_full_request');
        const result = await processFullRequest(testInput);

        // Verify failed result
        expect(result.user_idea).toEqual('A beautiful sunset over mountains');
        expect(result.status).toEqual('failed');
        expect(result.id).toBeDefined();
        expect(result.completed_at).toBeInstanceOf(Date);

        // Verify database state
        const requests = await db.select()
            .from(imageGenerationRequestsTable)
            .where(eq(imageGenerationRequestsTable.id, result.id))
            .execute();

        expect(requests).toHaveLength(1);
        expect(requests[0].status).toEqual('failed');
        expect(requests[0].completed_at).toBeInstanceOf(Date);
    });

    it('should handle image generation failure', async () => {
        // Mock handlers - expand works, generate fails
        mock.module('../handlers/expand_prompt', () => ({
            expandPrompt: mock(() => Promise.resolve({ expanded_prompt: 'A detailed AI-generated prompt' }))
        }));

        mock.module('../handlers/generate_image', () => ({
            generateImage: mock(() => Promise.reject(new Error('Image generation failed')))
        }));

        // Import after mocking
        const { processFullRequest } = await import('../handlers/process_full_request');
        const result = await processFullRequest(testInput);

        // Verify failed result
        expect(result.user_idea).toEqual('A beautiful sunset over mountains');
        expect(result.expanded_prompt).toEqual('A detailed AI-generated prompt');
        expect(result.status).toEqual('failed');
        expect(result.id).toBeDefined();
        expect(result.completed_at).toBeInstanceOf(Date);
        expect(result.image_url).toBeNull();

        // Verify database state shows processing attempt
        const requests = await db.select()
            .from(imageGenerationRequestsTable)
            .where(eq(imageGenerationRequestsTable.id, result.id))
            .execute();

        expect(requests).toHaveLength(1);
        expect(requests[0].status).toEqual('failed');
        expect(requests[0].expanded_prompt).toEqual('A detailed AI-generated prompt');
        expect(requests[0].completed_at).toBeInstanceOf(Date);
    });

    it('should handle multiple sequential requests', async () => {
        // Mock the external handlers for this test
        mock.module('../handlers/expand_prompt', () => ({
            expandPrompt: mock(() => Promise.resolve({ expanded_prompt: 'A detailed AI-generated prompt' }))
        }));

        mock.module('../handlers/generate_image', () => ({
            generateImage: mock(() => Promise.resolve({ image_url: 'https://example.com/generated-image.jpg' }))
        }));

        // Import after mocking
        const { processFullRequest } = await import('../handlers/process_full_request');

        const input1: CreateImageRequestInput = {
            user_idea: 'First sunset idea'
        };
        const input2: CreateImageRequestInput = {
            user_idea: 'Second mountain idea'
        };

        // Process both requests
        const result1 = await processFullRequest(input1);
        const result2 = await processFullRequest(input2);

        // Verify both completed successfully with different IDs
        expect(result1.status).toEqual('completed');
        expect(result2.status).toEqual('completed');
        expect(result1.id).not.toEqual(result2.id);
        expect(result1.user_idea).toEqual('First sunset idea');
        expect(result2.user_idea).toEqual('Second mountain idea');

        // Verify database has both records
        const allRequests = await db.select()
            .from(imageGenerationRequestsTable)
            .execute();

        expect(allRequests).toHaveLength(2);
        expect(allRequests.every(req => req.status === 'completed')).toBe(true);
    });

    it('should track request progression through statuses', async () => {
        // Mock the external handlers for this test
        mock.module('../handlers/expand_prompt', () => ({
            expandPrompt: mock(() => Promise.resolve({ expanded_prompt: 'A detailed AI-generated prompt' }))
        }));

        mock.module('../handlers/generate_image', () => ({
            generateImage: mock(() => Promise.resolve({ image_url: 'https://example.com/generated-image.jpg' }))
        }));

        // Import after mocking
        const { processFullRequest } = await import('../handlers/process_full_request');
        const result = await processFullRequest(testInput);

        // Final state should show completion
        expect(result.status).toEqual('completed');
        expect(result.expanded_prompt).not.toEqual(''); // Should have expanded prompt
        expect(result.image_url).toBeTruthy(); // Should have image URL
        expect(result.completed_at).toBeInstanceOf(Date);
        
        // Verify creation timestamp is before completion timestamp
        expect(result.created_at.getTime()).toBeLessThanOrEqual(result.completed_at!.getTime());
    });
});