import { Injectable, NotFoundException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as QRCode from 'qrcode';
import * as os from 'os';
import { PrismaService } from '../prisma/prisma.service';

function getLocalNetworkIp(): string | null {
  const interfaces = os.networkInterfaces();
  for (const name of Object.keys(interfaces)) {
    for (const iface of interfaces[name] || []) {
      if (iface.family === 'IPv4' && !iface.internal) {
        return iface.address;
      }
    }
  }
  return null;
}

@Injectable()
export class QrService {
  constructor(
    private prisma: PrismaService,
    private configService: ConfigService,
  ) {}

  private getBaseUrl(requestHost?: string): string {
    // If request provided a specific host header (e.g. 192.168.1.200:3000), prioritize it
    if (requestHost && !requestHost.includes('localhost') && !requestHost.includes('127.0.0.1')) {
      const proto = requestHost.startsWith('http') ? '' : 'http://';
      return `${proto}${requestHost}`;
    }

    const envUrl = this.configService.get<string>('FRONTEND_URL');
    if (envUrl && !envUrl.includes('localhost') && !envUrl.includes('127.0.0.1')) {
      return envUrl;
    }

    // In local dev, auto-resolve the PC's actual LAN IP so mobile devices scanning the QR can connect
    const localIp = getLocalNetworkIp();
    if (localIp) {
      return `http://${localIp}:3000`;
    }

    return envUrl || 'http://localhost:3000';
  }

  async getQrForOwner(ownerId: string, requestHost?: string, businessId?: string) {
    const whereClause: any = { ownerId };
    if (businessId) {
      whereClause.id = businessId;
    }
    const business = await this.prisma.business.findFirst({
      where: whereClause,
    });

    if (!business) {
      throw new NotFoundException('Business not found for this account');
    }

    return this.generateQrData(business, requestHost);
  }

  async generateQrForBusinessIdAdmin(businessId: string, requestHost?: string) {
    const business = await this.prisma.business.findUnique({
      where: { id: businessId },
    });

    if (!business) {
      throw new NotFoundException('Business not found');
    }

    return this.generateQrData(business, requestHost);
  }

  private async generateQrData(
    business: { slug: string; name?: string; accent_color?: string | null },
    requestHost?: string,
  ) {
    const reviewUrl = `${this.getBaseUrl(requestHost)}/review/${business.slug}`;

    const pngDataUrl = await QRCode.toDataURL(reviewUrl, {
      width: 400,
      margin: 2,
      color: {
        dark: '#0F172A',
        light: '#FFFFFF',
      },
    });

    const svgString = await QRCode.toString(reviewUrl, {
      type: 'svg',
      margin: 2,
    });

    return {
      data: {
        review_url: reviewUrl,
        png_data_url: pngDataUrl,
        svg: svgString,
        business_name: business.name || 'Your Business',
        accent_color: business.accent_color || '#3B82F6',
      },
    };
  }
}
