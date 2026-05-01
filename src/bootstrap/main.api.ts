import { env } from '@/config';
import { startExpressApp } from '@/interfaces/api';
import { getLogger } from '@/shared/logger';

const logger = getLogger();
const PORT = env.EXPRESS.PORT;

startExpressApp(PORT, logger);