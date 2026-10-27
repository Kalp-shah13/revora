import { Controller, Post, Body, Req, Ip } from '@nestjs/common';
import { Request } from 'express';
import { ScansService } from './scans.service';
import { CreateScanDto } from './dto/create-scan.dto';
import { Public } from '../common/decorators/public.decorator';

@Controller('scan')
export class ScansController {
  constructor(private scansService: ScansService) {}

  @Public()
  @Post()
  async recordScan(
    @Body() dto: CreateScanDto,
    @Ip() ip: string,
    @Req() req: Request,
  ) {
    const userAgent = req.headers['user-agent'];
    const clientIp =
      (req.headers['x-forwarded-for'] as string)?.split(',')[0].trim() || ip || 'unknown';
    return this.scansService.recordScan(dto, clientIp, userAgent);
  }
}
