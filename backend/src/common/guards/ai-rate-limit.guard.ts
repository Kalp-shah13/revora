import {
  Injectable,
  CanActivate,
  ExecutionContext,
  HttpException,
  HttpStatus,
  Logger,
} from '@nestjs/common';
import { Request, Response } from 'express';

interface RateLimitConfig {
  deviceMax: number;
  deviceWindowMs: number;
  ipMax: number;
  ipWindowMs: number;
  businessMax: number;
  businessWindowMs: number;
}

@Injectable()
export class AiRateLimitGuard implements CanActivate {
  private readonly logger = new Logger(AiRateLimitGuard.name);

  // Default rate limit limits:
  // - Device session: 5 generations per 5 minutes
  // - Shared IP: 60 requests per 1 minute (safe for 20-30 real users on shared Wi-Fi)
  // - Business: 60 generations per 1 minute
  private readonly config: RateLimitConfig = {
    deviceMax: 5,
    deviceWindowMs: 5 * 60 * 1000,
    ipMax: 60,
    ipWindowMs: 60 * 1000,
    businessMax: 60,
    businessWindowMs: 60 * 1000,
  };

  private deviceHits = new Map<string, number[]>();
  private ipHits = new Map<string, number[]>();
  private businessHits = new Map<string, number[]>();

  constructor() {
    // Periodic garbage collection every 2 minutes to keep memory clean
    setInterval(() => this.cleanupExpired(), 2 * 60 * 1000);
  }

  canActivate(context: ExecutionContext): boolean {
    const http = context.switchToHttp();
    const req = http.getRequest<Request>();
    const res = http.getResponse<Response>();
    const now = Date.now();

    // 1. Resolve Device / Browser Session ID from headers
    const rawSession =
      req.headers['x-client-session-id'] ||
      req.headers['x-session-id'] ||
      req.cookies?.['revora_session_id'] ||
      req.cookies?.['gleam_session_id'];

    const sessionId = Array.isArray(rawSession)
      ? String(rawSession[0])
      : typeof rawSession === 'string' && rawSession.trim()
        ? rawSession.trim()
        : null;

    // 2. Resolve Client IP (handles proxies & load balancers)
    const rawIp =
      req.headers['x-forwarded-for'] ||
      req.socket.remoteAddress ||
      'unknown-ip';
    const clientIp = Array.isArray(rawIp)
      ? rawIp[0]
      : String(rawIp).split(',')[0].trim();

    // 3. Resolve Business ID from body
    const businessId = String(req.body?.business_id || 'unknown-business');

    // ── Tier 1: Per-Device Session Check ──────────────────────────────────────
    if (sessionId) {
      const timestamps = this.deviceHits.get(sessionId) || [];
      const validTimestamps = timestamps.filter(
        (t) => now - t < this.config.deviceWindowMs,
      );

      if (validTimestamps.length >= this.config.deviceMax) {
        const oldest = validTimestamps[0];
        const waitSec = Math.max(
          1,
          Math.ceil((this.config.deviceWindowMs - (now - oldest)) / 1000),
        );
        res.setHeader('Retry-After', waitSec);

        this.logger.warn(
          `Device session [${sessionId.slice(0, 8)}] rate-limited (${validTimestamps.length}/${this.config.deviceMax} in 5m)`,
        );

        throw new HttpException(
          {
            statusCode: HttpStatus.TOO_MANY_REQUESTS,
            message:
              'You have generated several review options recently. Please select one of your generated drafts or wait a couple of minutes before generating again.',
            error: 'Too Many Requests',
            retryAfterSeconds: waitSec,
          },
          HttpStatus.TOO_MANY_REQUESTS,
        );
      }

      validTimestamps.push(now);
      this.deviceHits.set(sessionId, validTimestamps);
    }

    // ── Tier 2: Per-Business Quota Check ──────────────────────────────────────
    if (businessId && businessId !== 'unknown-business') {
      const bTimestamps = this.businessHits.get(businessId) || [];
      const validBTimestamps = bTimestamps.filter(
        (t) => now - t < this.config.businessWindowMs,
      );

      if (validBTimestamps.length >= this.config.businessMax) {
        res.setHeader('Retry-After', 30);
        this.logger.warn(`Business [${businessId}] quota throttle triggered`);

        throw new HttpException(
          {
            statusCode: HttpStatus.TOO_MANY_REQUESTS,
            message:
              'High traffic volume right now. Please wait a few seconds and try again.',
            error: 'Too Many Requests',
            retryAfterSeconds: 30,
          },
          HttpStatus.TOO_MANY_REQUESTS,
        );
      }

      validBTimestamps.push(now);
      this.businessHits.set(businessId, validBTimestamps);
    }

    // ── Tier 3: Shared IP Ceiling Check (Bot / DDoS Prevention) ───────────────
    const ipTimestamps = this.ipHits.get(clientIp) || [];
    const validIpTimestamps = ipTimestamps.filter(
      (t) => now - t < this.config.ipWindowMs,
    );

    if (validIpTimestamps.length >= this.config.ipMax) {
      res.setHeader('Retry-After', 60);
      this.logger.warn(
        `IP [${clientIp}] exceeded ceiling (${validIpTimestamps.length}/${this.config.ipMax} in 1m)`,
      );

      throw new HttpException(
        {
          statusCode: HttpStatus.TOO_MANY_REQUESTS,
          message:
            'Too many requests from this network. Please wait a minute and try again.',
          error: 'Too Many Requests',
          retryAfterSeconds: 60,
        },
        HttpStatus.TOO_MANY_REQUESTS,
      );
    }

    validIpTimestamps.push(now);
    this.ipHits.set(clientIp, validIpTimestamps);

    return true;
  }

  private cleanupExpired() {
    const now = Date.now();

    for (const [key, timestamps] of this.deviceHits.entries()) {
      const valid = timestamps.filter(
        (t) => now - t < this.config.deviceWindowMs,
      );
      if (valid.length === 0) {
        this.deviceHits.delete(key);
      } else {
        this.deviceHits.set(key, valid);
      }
    }

    for (const [key, timestamps] of this.ipHits.entries()) {
      const valid = timestamps.filter((t) => now - t < this.config.ipWindowMs);
      if (valid.length === 0) {
        this.ipHits.delete(key);
      } else {
        this.ipHits.set(key, valid);
      }
    }

    for (const [key, timestamps] of this.businessHits.entries()) {
      const valid = timestamps.filter(
        (t) => now - t < this.config.businessWindowMs,
      );
      if (valid.length === 0) {
        this.businessHits.delete(key);
      } else {
        this.businessHits.set(key, valid);
      }
    }
  }
}
