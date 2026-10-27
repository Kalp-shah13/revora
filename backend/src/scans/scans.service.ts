import {
  Injectable,
  BadRequestException,
  HttpException,
  HttpStatus,
  Logger,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateScanDto } from './dto/create-scan.dto';

interface RateLimitRecord {
  count: number;
  resetAt: number;
}

@Injectable()
export class ScansService {
  private readonly logger = new Logger(ScansService.name);
  private ipLimits = new Map<string, RateLimitRecord>();
  // Sliding window cache: businessId:ip:userAgent -> timestamp of last recorded scan
  private recentScans = new Map<string, number>();

  constructor(private prisma: PrismaService) {
    // Periodically prune stale deduplication entries every 10 minutes
    setInterval(() => this.pruneStaleRecords(), 10 * 60 * 1000).unref();
  }

  private pruneStaleRecords() {
    const now = Date.now();
    for (const [key, timestamp] of this.recentScans.entries()) {
      if (now - timestamp > 15 * 60 * 1000) {
        this.recentScans.delete(key);
      }
    }
    for (const [ip, record] of this.ipLimits.entries()) {
      if (now > record.resetAt) {
        this.ipLimits.delete(ip);
      }
    }
  }

  private checkRateLimit(ip: string): boolean {
    const now = Date.now();
    const record = this.ipLimits.get(ip);

    if (!record || now > record.resetAt) {
      this.ipLimits.set(ip, { count: 1, resetAt: now + 60_000 });
      return true;
    }

    if (record.count >= 30) {
      return false;
    }

    record.count++;
    return true;
  }

  /**
   * Checks whether the same IP/Device already scanned this business
   * within a 10-minute sliding window (anti-metric inflation).
   */
  private isDuplicateScan(businessId: string, ip: string, userAgent?: string): boolean {
    const cleanUa = (userAgent || '').substring(0, 60);
    const key = `${businessId}:${ip}:${cleanUa}`;
    const now = Date.now();
    const lastScan = this.recentScans.get(key);

    const DEDUPE_WINDOW_MS = 10 * 60 * 1000; // 10 minutes

    if (lastScan && now - lastScan < DEDUPE_WINDOW_MS) {
      return true;
    }

    this.recentScans.set(key, now);
    return false;
  }

  async recordScan(dto: CreateScanDto, ip: string, userAgent?: string) {
    if (!this.checkRateLimit(ip)) {
      throw new HttpException('Too many requests', HttpStatus.TOO_MANY_REQUESTS);
    }

    const business = await this.prisma.business.findUnique({
      where: { id: dto.business_id },
    });

    if (!business || !business.isActive) {
      throw new BadRequestException('Invalid or inactive business_id');
    }

    // Check sliding window deduplication
    if (this.isDuplicateScan(dto.business_id, ip, userAgent)) {
      this.logger.debug(
        `[Scan Deduplicated] Business ${dto.business_id} from ${ip} within 10m window`,
      );
      return { data: { success: true, deduplicated: true } };
    }

    await this.prisma.qrScan.create({
      data: {
        businessId: dto.business_id,
        userAgent: userAgent || null,
      },
    });

    return { data: { success: true, deduplicated: false } };
  }
}
