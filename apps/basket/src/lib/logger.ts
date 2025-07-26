import { Logtail } from '@logtail/edge';

const token = process.env.LOGTAIL_SOURCE_TOKEN as string;
export const logger = new Logtail(token, {
	endpoint: 's1447431.eu-nbg-2.betterstackdata.com',
	batchSize: 10,
	batchInterval: 1000,
});

// Log levels to ensure we only log important events
// export enum LogLevel {
//     ERROR = 'error',
//     WARN = 'warn',
//     INFO = 'info',
//     DEBUG = 'debug'
// }

// const log = (level: LogLevel, message: string, data?: any) => {
//     logger.log(level, message, data);
// };

// const pinoLogger = pino({
//     level: 'info',
//     transport: {
//         target: 'pino-pretty',
//     },
// });

// export { pinoLogger as logger };
