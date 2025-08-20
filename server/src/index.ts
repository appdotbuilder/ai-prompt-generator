import { initTRPC } from '@trpc/server';
import { createHTTPServer } from '@trpc/server/adapters/standalone';
import 'dotenv/config';
import cors from 'cors';
import superjson from 'superjson';
import { z } from 'zod';

// Import schemas
import { 
  createImageRequestInputSchema,
  updateImageRequestStatusSchema
} from './schema';

// Import handlers
import { createImageRequest } from './handlers/create_image_request';
import { expandPrompt } from './handlers/expand_prompt';
import { generateImage } from './handlers/generate_image';
import { getImageRequests } from './handlers/get_image_requests';
import { getImageRequestById } from './handlers/get_image_request_by_id';
import { updateRequestStatus } from './handlers/update_request_status';
import { processFullRequest } from './handlers/process_full_request';

const t = initTRPC.create({
  transformer: superjson,
});

const publicProcedure = t.procedure;
const router = t.router;

const appRouter = router({
  // Health check endpoint
  healthcheck: publicProcedure.query(() => {
    return { status: 'ok', timestamp: new Date().toISOString() };
  }),

  // Create a new image generation request (basic flow)
  createImageRequest: publicProcedure
    .input(createImageRequestInputSchema)
    .mutation(({ input }) => createImageRequest(input)),

  // Process complete request flow (idea -> expanded prompt -> image generation)
  processFullRequest: publicProcedure
    .input(createImageRequestInputSchema)
    .mutation(({ input }) => processFullRequest(input)),

  // Expand a user idea into a detailed prompt
  expandPrompt: publicProcedure
    .input(z.object({ userIdea: z.string().min(1) }))
    .query(({ input }) => expandPrompt(input.userIdea)),

  // Generate image from expanded prompt
  generateImage: publicProcedure
    .input(z.object({ expandedPrompt: z.string().min(1) }))
    .mutation(({ input }) => generateImage(input.expandedPrompt)),

  // Get all image generation requests
  getImageRequests: publicProcedure
    .query(() => getImageRequests()),

  // Get specific image request by ID
  getImageRequestById: publicProcedure
    .input(z.object({ id: z.number() }))
    .query(({ input }) => getImageRequestById(input.id)),

  // Update request status (for manual status updates)
  updateRequestStatus: publicProcedure
    .input(updateImageRequestStatusSchema)
    .mutation(({ input }) => updateRequestStatus(input)),
});

export type AppRouter = typeof appRouter;

async function start() {
  const port = process.env['SERVER_PORT'] || 2022;
  const server = createHTTPServer({
    middleware: (req, res, next) => {
      cors()(req, res, next);
    },
    router: appRouter,
    createContext() {
      return {};
    },
  });
  server.listen(port);
  console.log(`TRPC server listening at port: ${port}`);
}

start();