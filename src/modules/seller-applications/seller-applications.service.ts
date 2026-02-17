import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { SellerApplication, ApplicationStatus } from './seller-application.entity';
import { CreateSellerApplicationDto } from './dto/create-seller-application.dto';
import { UsersService } from '../users/users.service';
import { SellerProfilesService } from '../seller-profiles/seller-profiles.service';
import { UserRole } from '../users/user.entity';

@Injectable()
export class SellerApplicationsService {
  constructor(
    @InjectRepository(SellerApplication)
    private readonly applicationsRepo: Repository<SellerApplication>,
    private readonly usersService: UsersService,
    private readonly sellerProfilesService: SellerProfilesService,
  ) {}

  async create(userId: string, dto: CreateSellerApplicationDto): Promise<SellerApplication> {
    const user = await this.usersService.findOne(userId);

    // Check user is a customer
    if (user.role !== UserRole.CUSTOMER) {
      throw new BadRequestException('Only customers can apply to become sellers');
    }

    // Check if application already exists
    const existing = await this.applicationsRepo.findOne({
      where: { userId },
    });
    if (existing) {
      throw new BadRequestException('You have already submitted an application');
    }

    // Check if seller profile already exists
    const existingProfile = await this.sellerProfilesService.findByUserId(userId);
    if (existingProfile) {
      throw new BadRequestException('You already have a seller profile');
    }

    const application = this.applicationsRepo.create({
      userId,
      storeName: dto.storeName,
      storeDescription: dto.storeDescription,
      status: ApplicationStatus.PENDING,
    });

    return this.applicationsRepo.save(application);
  }

  async findAll(status?: ApplicationStatus): Promise<SellerApplication[]> {
    const where = status ? { status } : {};
    return this.applicationsRepo.find({
      where,
      relations: ['user', 'reviewedBy'],
      order: { createdAt: 'DESC' },
    });
  }

  async findOne(id: string): Promise<SellerApplication> {
    const application = await this.applicationsRepo.findOne({
      where: { id },
      relations: ['user', 'reviewedBy'],
    });
    if (!application) {
      throw new NotFoundException('Application not found');
    }
    return application;
  }

  async findByUserId(userId: string): Promise<SellerApplication | null> {
    return this.applicationsRepo.findOne({
      where: { userId },
      relations: ['user', 'reviewedBy'],
    });
  }

  async approve(applicationId: string, adminId: string): Promise<SellerApplication> {
    const application = await this.findOne(applicationId);

    if (application.status !== ApplicationStatus.PENDING) {
      throw new BadRequestException('Only pending applications can be approved');
    }

    // Update application status
    application.status = ApplicationStatus.APPROVED;
    application.reviewedById = adminId;
    application.reviewedAt = new Date();

    // Update user role to SELLER
    await this.usersService.update(application.userId, {
      role: UserRole.SELLER,
    });

    // Create seller profile
    await this.sellerProfilesService.create(
      application.userId,
      application.storeName,
      application.storeDescription,
    );

    const updatedApplication = await this.applicationsRepo.save(application);

    // TODO: Send approval email to user

    return updatedApplication;
  }

  async reject(
    applicationId: string,
    adminId: string,
    rejectionReason: string,
  ): Promise<SellerApplication> {
    const application = await this.findOne(applicationId);

    if (application.status !== ApplicationStatus.PENDING) {
      throw new BadRequestException('Only pending applications can be rejected');
    }

    application.status = ApplicationStatus.REJECTED;
    application.rejectionReason = rejectionReason;
    application.reviewedById = adminId;
    application.reviewedAt = new Date();

    const updatedApplication = await this.applicationsRepo.save(application);

    // TODO: Send rejection email to user with reason

    return updatedApplication;
  }
}
