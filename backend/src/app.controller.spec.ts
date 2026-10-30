import { describe, it, expect, beforeEach } from 'vitest';
import { Test, TestingModule } from '@nestjs/testing';
import { AppController } from './app.controller';

describe('AppController', () => {
  let appController: AppController;

  beforeEach(async () => {
    const app: TestingModule = await Test.createTestingModule({
      controllers: [AppController],
    }).compile();

    appController = app.get<AppController>(AppController);
  });

  describe('health check', () => {
    it('should return health status ok for Revora Backend API', () => {
      const res = appController.getHealth();
      expect(res.status).toBe('ok');
      expect(res.service).toBe('Revora Backend API');
      expect(res.timestamp).toBeDefined();
    });
  });
});

