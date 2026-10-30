import {
  Injectable,
  CanActivate,
  ExecutionContext,
  HttpException,
  HttpStatus,
  Logger,
} from '@nestjs/common';
import type { Request, Response } from 'express';

@Injectable()
export class AuthRateLimitGuard implements CanActivate {
  private readonly logger = new Logger(AuthRateLimitGuard.name);

  // Maximum 5 login/registration attempts per 60 seconds per client IP
  private readonly maxAttempts = 5;
  private readonly windowMs = 60 * 1000;

  private ipHits = new Map<string, number[]>();

  constructor() {
    // Periodic garbage collection every 2 minutes
    setInterval(() => this.cleanupExpired(), 2 * 60 * 1000);
  }

  canActivate(context: ExecutionContext): boolean {
    const http = context.switchToHttp();
    const req = http.getRequest<Request>();
    const res = http.getResponse<Response>();
    const now = Date.now();

    const rawIp =
      req.headers['x-forwarded-for'] ||
      req.socket.remoteAddress ||
      'unknown-ip';
    const clientIp = Array.isArray(rawIp)
      ? rawIp[0]
      : String(rawIp).split(',')[0].trim();

    const timestamps = this.ipHits.get(clientIp) || [];
    const validTimestamps = timestamps.filter((t) => now - t < this.windowMs);

    if (validTimestamps.length >= this.maxAttempts) {
      const oldest = validTimestamps[0];
      const waitSec = Math.max(
        1,
        Math.ceil((this.windowMs - (now - oldest)) / 1000),
      );
      res.setHeader('Retry-After', waitSec);

      this.logger.warn(
        `Auth rate limit reached for IP [${clientIp}]: ${validTimestamps.length}/${this.maxAttempts} in 1m`,
      );

      throw new HttpException(
        {
          statusCode: HttpStatus.TOO_MANY_REQUESTS,
          message: `Too many authentication attempts. Please wait ${waitSec} seconds before trying again.`,
          error: 'Too Many Requests',
          retryAfterSeconds: waitSec,
        },
        HttpStatus.TOO_MANY_REQUESTS,
      );
    }

    validTimestamps.push(now);
    this.ipHits.set(clientIp, validTimestamps);

    return true;
  }

  private cleanupExpired() {
    const now = Date.now();
    for (const [ip, timestamps] of this.ipHits.entries()) {
      const valid = timestamps.filter((t) => now - t < this.windowMs);
      if (valid.length === 0) {
        this.ipHits.delete(ip);
      } else {
        this.ipHits.set(ip, valid);
      }
    }
  }
}
