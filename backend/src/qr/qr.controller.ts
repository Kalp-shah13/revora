import { Controller, Get, Post, Body, Req, Query } from '@nestjs/common';
import type { Request } from 'express';
import { QrService } from './qr.service';
import { AdminGenerateQrDto } from './dto/generate-qr.dto';
import { Roles } from '../common/decorators/roles.decorator';
import { CurrentUser } from '../common/decorators/current-user.decorator';

@Controller()
export class QrController {
  constructor(private qrService: QrService) {}

  @Roles('business_owner', 'super_admin')
  @Get('dashboard/qr')
  async getDashboardQr(
    @CurrentUser('id') ownerId: string,
    @Req() req: Request,
    @Query('businessId') businessId?: string,
  ) {
    const host = (req.headers['x-forwarded-host'] as string) || (req.headers['host'] as string);
    return this.qrService.getQrForOwner(ownerId, host, businessId);
  }

  @Roles('super_admin')
  @Post('admin/qr/generate')
  async generateAdminQr(
    @Body() dto: AdminGenerateQrDto,
    @Req() req: Request,
  ) {
    const host = (req.headers['x-forwarded-host'] as string) || (req.headers['host'] as string);
    return this.qrService.generateQrForBusinessIdAdmin(dto.business_id, host);
  }
}
