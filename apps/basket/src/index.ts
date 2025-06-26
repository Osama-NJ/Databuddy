
// import './polyfills/compression'

import { Elysia } from 'elysia'
import basketRouter from './routes/basket';
import stripeRouter from './routes/stripe';
import { logger } from './lib/logger';
// import { checkBotId } from "botid/server";

const app = new Elysia()
  .onError(({ error }) => {
    logger.error(new Error(`${error instanceof Error ? error.name : 'Unknown'}: ${error instanceof Error ? error.message : 'Unknown'}`));
  })
  .onBeforeHandle(async ({ request, set }) => {
    // const { isBot } = await checkBotId();
    // if (isBot) {
    //   return new Response(null, { status: 403 });
    // }
    const origin = request.headers.get('origin')
    if (origin) {
      set.headers ??= {}
      set.headers['Access-Control-Allow-Origin'] = origin
      set.headers['Access-Control-Allow-Methods'] = 'POST, GET, OPTIONS, PUT, DELETE'
      set.headers['Access-Control-Allow-Headers'] = 'Content-Type, Authorization, X-Requested-With, databuddy-client-id, databuddy-sdk-name, databuddy-sdk-version'
      set.headers['Access-Control-Allow-Credentials'] = 'true'
    }
  })
  .options('*', () => new Response(null, { status: 204 }))
  .use(basketRouter)
  .use(stripeRouter)
  .get('/health', () => ({ status: 'ok', version: '1.0.0' }))

export default {
  port: process.env.PORT || 4000,
  fetch: app.fetch,
}
