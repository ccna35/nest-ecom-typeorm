import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service';
import { SellerApplication, ApplicationStatus, UserRole } from '@prisma/client';
import { CreateSellerApplicationDto } from './dto/create-seller-application.dto';
import { UsersService } from '../users/users.service';
import { SellerProfilesService } from '../seller-profiles/seller-profiles.service';

@Injectable()
export class SellerApplicationsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly usersService: UsersService,
    private readonly sellerProfilesService: SellerProfilesService,
  ) {}

  async create(userId: string, dto: CreateSellerApplicationDto): Promise<SellerApplication> {
    const user = await this.usersService.findOne(userId);

    // Check user is a customer
    if (user.role !== UserRole.customer) {
      throw new BadRequestException('Only customers can apply to become sellers');
    }

    // Check if application already exists
    const existing = await this.prisma.sellerApplication.findUnique({
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

    const application = await this.prisma.sellerApplication.create({
      data: {
        userId,
        storeName: dto.storeName,
        storeDescription: dto.storeDescription,
        status: ApplicationStatus.pending,
      },
    });

    return application;
  }

  async findAll(status?: ApplicationStatus): Promise<SellerApplication[]> {
    return this.prisma.sellerApplication.findMany({
      ...(status && { where: { status } }),
      include: { user: true, reviewedBy: true },
      orderBy: { createdAt: 'desc' },
    });
  }

  async findOne(id: string): Promise<SellerApplication> {
    const application = await this.prisma.sellerApplication.findUnique({
      where: { id },
      include: { user: true, reviewedBy: true },
    });
    if (!application) {
      throw new NotFoundException('Application not found');
    }
    return application;
  }

  async findByUserId(userId: string): Promise<SellerApplication | null> {
    return this.prisma.sellerApplication.findUnique({
      where: { userId },
      include: { user: true, reviewedBy: true },
    });
  }

  async approve(applicationId: string, adminId: string): Promise<SellerApplication> {
    const application = await this.findOne(applicationId);

    if (application.status !== ApplicationStatus.pending) {
      throw new BadRequestException('Only pending applications can be approved');
    }

    // Update application status
    const updatedApplication = await this.prisma.sellerApplication.update({
      where: { id: applicationId },
      data: {
        status: ApplicationStatus.approved,
        reviewedById: adminId,
        reviewedAt: new Date(),
      },
      include: { user: true, reviewedBy: true },
    });

    // Update user role to SELLER
    await this.usersService.update(application.userId, {
      role: UserRole.seller,
    });

    // Create seller profile
    await this.sellerProfilesService.create(
      application.userId,
      application.storeName,
      application.storeDescription,
    );

    // TODO: Send approval email to user

    return updatedApplication;
  }

  async reject(
    applicationId: string,
    adminId: string,
    rejectionReason: string,
  ): Promise<SellerApplication> {
    const application = await this.findOne(applicationId);

    if (application.status !== ApplicationStatus.pending) {
      throw new BadRequestException('Only pending applications can be rejected');
    }

    const updatedApplication = await this.prisma.sellerApplication.update({
      where: { id: applicationId },
      data: {
        status: ApplicationStatus.rejected,
        rejectionReason,
        reviewedById: adminId,
        reviewedAt: new Date(),
      },
      include: { user: true, reviewedBy: true },
    });

    // TODO: Send rejection email to user with reason

    return updatedApplication;
  }
}
