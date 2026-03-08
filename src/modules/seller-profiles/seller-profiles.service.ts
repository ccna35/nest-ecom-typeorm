import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service';
import { SellerProfile } from '@prisma/client';
import { UpdateSellerProfileDto } from './dto/update-seller-profile.dto';

@Injectable()
export class SellerProfilesService {
  constructor(private readonly prisma: PrismaService) {}

  async create(
    userId: string,
    storeName: string,
    storeDescription: string,
  ): Promise<SellerProfile> {
    const existing = await this.prisma.sellerProfile.findUnique({
      where: { userId },
    });
    if (existing) {
      throw new BadRequestException('Seller profile already exists');
    }

    const profile = await this.prisma.sellerProfile.create({
      data: {
        userId,
        storeName,
        storeDescription,
      },
    });

    return profile;
  }

  async findAll(): Promise<SellerProfile[]> {
    return this.prisma.sellerProfile.findMany({
      include: { user: true },
      orderBy: { createdAt: 'desc' },
    });
  }

  async findByUserId(userId: string): Promise<SellerProfile | null> {
    return this.prisma.sellerProfile.findUnique({
      where: { userId },
      include: { user: true },
    });
  }

  async update(userId: string, dto: UpdateSellerProfileDto): Promise<SellerProfile> {
    const profile = await this.findByUserId(userId);
    if (!profile) {
      throw new NotFoundException('Seller profile not found');
    }

    return this.prisma.sellerProfile.update({
      where: { userId },
      data: dto,
    });
  }

  async remove(userId: string): Promise<void> {
    const profile = await this.findByUserId(userId);
    if (!profile) {
      throw new NotFoundException('Seller profile not found');
    }

    await this.prisma.sellerProfile.delete({
      where: { userId },
    });
  }
}
