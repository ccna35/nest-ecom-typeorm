import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { SellerProfile } from './seller-profile.entity';
import { UpdateSellerProfileDto } from './dto/update-seller-profile.dto';

@Injectable()
export class SellerProfilesService {
  constructor(
    @InjectRepository(SellerProfile)
    private readonly sellerProfilesRepo: Repository<SellerProfile>,
  ) {}

  async create(
    userId: string,
    storeName: string,
    storeDescription: string,
  ): Promise<SellerProfile> {
    const existing = await this.sellerProfilesRepo.findOne({
      where: { userId },
    });
    if (existing) {
      throw new BadRequestException('Seller profile already exists');
    }

    const profile = this.sellerProfilesRepo.create({
      userId,
      storeName,
      storeDescription,
    });

    return this.sellerProfilesRepo.save(profile);
  }

  async findAll(): Promise<SellerProfile[]> {
    return this.sellerProfilesRepo.find({
      relations: ['user'],
      order: { createdAt: 'DESC' },
    });
  }

  async findByUserId(userId: string): Promise<SellerProfile | null> {
    return this.sellerProfilesRepo.findOne({
      where: { userId },
      relations: ['user'],
    });
  }

  async update(userId: string, dto: UpdateSellerProfileDto): Promise<SellerProfile> {
    const profile = await this.findByUserId(userId);
    if (!profile) {
      throw new NotFoundException('Seller profile not found');
    }

    Object.assign(profile, dto);
    return this.sellerProfilesRepo.save(profile);
  }

  async remove(userId: string): Promise<void> {
    const profile = await this.findByUserId(userId);
    if (!profile) {
      throw new NotFoundException('Seller profile not found');
    }

    await this.sellerProfilesRepo.remove(profile);
  }
}
