import request from 'supertest';
import { createExpressApp } from '@/interfaces/api/app';
import { getLogger } from '@/shared/logger';

describe('GET /ping', () => {
  it('should return pong message', async () => {
    const logger = getLogger();
    const app = createExpressApp(logger);

    const response = await request(app).get('/ping');

    expect(response.status).toBe(200);
    expect(response.body).toEqual({ message: 'pong' });
  });
});
