import { Elysia } from "elysia";
import { fetchRequestHandler } from '@trpc/server/adapters/fetch';
import { appRouter, createTRPCContext } from '@databuddy/rpc';
import { query } from "./routes/query";
import { assistant } from "./routes/assistant";
import { health } from "./routes/health";
import { autumnHandler } from "autumn-js/elysia";
import cors from "@elysiajs/cors";
import { auth } from "@databuddy/auth";

const app = new Elysia()
  .use(cors({
    credentials: true,
    origin: [
      /(?:^|\.)databuddy\.cc$/,
      ...(process.env.NODE_ENV === 'development' ? ['http://localhost:3000'] : [])
    ]
  }))
  .use(autumnHandler({
    identify: async ({ request }) => {
      try {
        const session = await auth.api.getSession({
          headers: request.headers,
        });

        if (!session?.user?.id) {
          return {
            customerId: undefined,
            customerData: {},
          };
        }

        return {
          customerId: session.user.id,
          customerData: {
            name: session.user.name,
            email: session.user.email,
          },
        };
      } catch (error) {
        console.error("[Autumn] Error in identify function:", error);
        throw error;
      }
    },
  }))
  .use(query)
  .use(assistant)
  .use(health)
  .all('/trpc/*', async ({ request }) => {
    return fetchRequestHandler({
      endpoint: '/trpc',
      router: appRouter,
      req: request,
      createContext: () => createTRPCContext({ headers: request.headers }),
    });
  })
  .onError(({ error, code }) => {
    console.error(error);

    if (error instanceof Error && error.message === 'Unauthorized') {
      return new Response(JSON.stringify({
        success: false,
        error: 'Authentication required',
        code: 'AUTH_REQUIRED'
      }), {
        status: 401,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    return { success: false, code };
  })

export default {
  fetch: app.fetch,
  port: 3001
}

process.on('SIGINT', () => {
  console.log('SIGINT signal received, shutting down...');
  process.exit(0);
});

process.on('SIGTERM', () => {
  console.log('SIGTERM signal received, shutting down...');
  process.exit(0);
});