import { z } from 'zod';

// Image generation request schema
export const imageGenerationRequestSchema = z.object({
  id: z.number(),
  user_idea: z.string(),
  expanded_prompt: z.string(),
  image_url: z.string().nullable(),
  status: z.enum(['pending', 'processing', 'completed', 'failed']),
  created_at: z.coerce.date(),
  completed_at: z.coerce.date().nullable()
});

export type ImageGenerationRequest = z.infer<typeof imageGenerationRequestSchema>;

// Input schema for creating image generation requests
export const createImageRequestInputSchema = z.object({
  user_idea: z.string().min(1, "User idea cannot be empty").max(500, "User idea is too long")
});

export type CreateImageRequestInput = z.infer<typeof createImageRequestInputSchema>;

// Input schema for updating request status
export const updateImageRequestStatusSchema = z.object({
  id: z.number(),
  status: z.enum(['pending', 'processing', 'completed', 'failed']),
  expanded_prompt: z.string().optional(),
  image_url: z.string().nullable().optional(),
  completed_at: z.coerce.date().nullable().optional()
});

export type UpdateImageRequestStatus = z.infer<typeof updateImageRequestStatusSchema>;

// Response schema for expanded prompt
export const expandedPromptResponseSchema = z.object({
  expanded_prompt: z.string()
});

export type ExpandedPromptResponse = z.infer<typeof expandedPromptResponseSchema>;

// Response schema for generated image
export const generatedImageResponseSchema = z.object({
  image_url: z.string()
});

export type GeneratedImageResponse = z.infer<typeof generatedImageResponseSchema>;