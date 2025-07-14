import { Elysia } from "elysia";
import { fetchRequestHandler } from '@trpc/server/adapters/fetch';
import { appRouter, createTRPCContext } from '@databuddy/rpc';
import { query } from "./routes/query";

import cors from '@elysiajs/cors';

const app = new Elysia();

app.get('/', () => {
  return 'Hello World';
})
  .use(cors({
    credentials: true,
    origin: "https://staging.databuddy.cc"
  }))
  .onRequest(({ set, request }) => {
    set.headers.Vary = 'Origin, Access-Control-Request-Headers';
    set.headers['Access-Control-Allow-Origin'] = 'https://staging.databuddy.cc';
  })
  .use(query)
  .all('/trpc/*', async ({ request }) => {
    return fetchRequestHandler({
      endpoint: '/trpc',
      router: appRouter,
      req: request,
      createContext: () => createTRPCContext({ headers: request.headers }),
    });
  });

app.listen(3001)
  .onStart(() => {
    console.log('Server is running on port 3001');
  });

app.onError(({ error, code }) => {
  console.error(error);
  return {
    success: false,
    code: code
  };
});