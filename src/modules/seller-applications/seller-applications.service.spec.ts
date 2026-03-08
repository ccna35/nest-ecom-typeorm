import { Test } from '@nestjs/testing';
import { BadRequestException, NotFoundException } from '@nestjs/common';
import { SellerApplicationsService } from './seller-applications.service';
import { SellerApplication, ApplicationStatus, User, UserRole } from '@prisma/client';
import { UsersService } from '../users/users.service';
import { SellerProfilesService } from '../seller-profiles/seller-profiles.service';
import { PrismaService } from '../../database/prisma.service';

describe('SellerApplicationsService', () => {
  let service: SellerApplicationsService;
  let prismaService: {
    sellerApplication: {
      create: jest.Mock;
      findUnique: jest.Mock;
      findMany: jest.Mock;
      update: jest.Mock;
    };
  };
  let usersService: jest.Mocked<UsersService>;
  let sellerProfilesService: jest.Mocked<SellerProfilesService>;

  const mockUser: User = {
    id: 'u1',
    email: 'test@example.com',
    name: 'Test User',
    role: UserRole.customer,
    isActive: true,
    passwordHash: 'hash',
    avatarUrl: null,
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  const mockApplication: SellerApplication = {
    id: 'a1',
    userId: 'u1',
    storeName: 'Test Store',
    storeDescription: 'A test store description with more than 50 characters',
    status: ApplicationStatus.pending,
    rejectionReason: null,
    reviewedById: null,
    reviewedAt: null,
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  beforeEach(async () => {
    const mockPrismaService = {
      sellerApplication: {
        create: jest.fn(),
        findUnique: jest.fn(),
        findMany: jest.fn(),
        update: jest.fn(),
      },
    };

    const module = await Test.createTestingModule({
      providers: [
        SellerApplicationsService,
        {
          provide: PrismaService,
          useValue: mockPrismaService,
        },
        {
          provide: UsersService,
          useValue: {
            findOne: jest.fn(),
            update: jest.fn(),
          },
        },
        {
          provide: SellerProfilesService,
          useValue: {
            findByUserId: jest.fn(),
            create: jest.fn(),
          },
        },
      ],
    }).compile();

    service = module.get(SellerApplicationsService);
    prismaService = module.get(PrismaService) as typeof prismaService;
    usersService = module.get(UsersService);
    sellerProfilesService = module.get(SellerProfilesService);
  });

  describe('create', () => {
    it('should create a seller application', async () => {
      usersService.findOne.mockResolvedValue(mockUser);
      prismaService.sellerApplication.findUnique.mockResolvedValue(null);
      sellerProfilesService.findByUserId.mockResolvedValue(null);
      prismaService.sellerApplication.create.mockResolvedValue(mockApplication);

      const result = await service.create('u1', {
        storeName: 'Test Store',
        storeDescription: 'A test store description with more than 50 characters',
      });

      expect(result).toEqual(mockApplication);
      expect(prismaService.sellerApplication.create).toHaveBeenCalledWith({
        data: {
          userId: 'u1',
          storeName: 'Test Store',
          storeDescription: 'A test store description with more than 50 characters',
          status: ApplicationStatus.pending,
        },
      });
    });

    it('should throw BadRequestException if user is not a customer', async () => {
      usersService.findOne.mockResolvedValue({ ...mockUser, role: UserRole.seller });

      await expect(
        service.create('u1', {
          storeName: 'Test Store',
          storeDescription: 'A test store description with more than 50 characters',
        }),
      ).rejects.toThrow(BadRequestException);
    });

    it('should throw BadRequestException if application already exists', async () => {
      usersService.findOne.mockResolvedValue(mockUser);
      prismaService.sellerApplication.findUnique.mockResolvedValue(mockApplication);

      await expect(
        service.create('u1', {
          storeName: 'Test Store',
          storeDescription: 'A test store description with more than 50 characters',
        }),
      ).rejects.toThrow(BadRequestException);
    });

    it('should throw BadRequestException if seller profile already exists', async () => {
      usersService.findOne.mockResolvedValue(mockUser);
      prismaService.sellerApplication.findUnique.mockResolvedValue(null);
      sellerProfilesService.findByUserId.mockResolvedValue({} as never);

      await expect(
        service.create('u1', {
          storeName: 'Test Store',
          storeDescription: 'A test store description with more than 50 characters',
        }),
      ).rejects.toThrow(BadRequestException);
    });
  });

  describe('findAll', () => {
    it('should return all applications', async () => {
      prismaService.sellerApplication.findMany.mockResolvedValue([mockApplication]);

      const result = await service.findAll();

      expect(prismaService.sellerApplication.findMany).toHaveBeenCalledWith({
        include: { user: true, reviewedBy: true },
        orderBy: { createdAt: 'desc' },
      });
      expect(result).toEqual([mockApplication]);
    });

    it('should filter by status if provided', async () => {
      prismaService.sellerApplication.findMany.mockResolvedValue([mockApplication]);

      await service.findAll(ApplicationStatus.pending);

      expect(prismaService.sellerApplication.findMany).toHaveBeenCalledWith({
        where: { status: ApplicationStatus.pending },
        include: { user: true, reviewedBy: true },
        orderBy: { createdAt: 'desc' },
      });
    });
  });

  describe('findOne', () => {
    it('should return application by id', async () => {
      prismaService.sellerApplication.findUnique.mockResolvedValue(mockApplication);

      const result = await service.findOne('a1');

      expect(result).toEqual(mockApplication);
    });

    it('should throw NotFoundException if not found', async () => {
      prismaService.sellerApplication.findUnique.mockResolvedValue(null);

      await expect(service.findOne('a2')).rejects.toThrow(NotFoundException);
    });
  });

  describe('approve', () => {
    it('should approve application and create seller profile', async () => {
      const approvedApplication = {
        ...mockApplication,
        status: ApplicationStatus.approved,
        reviewedById: 'admin1',
        reviewedAt: expect.any(Date) as Date,
      };
      prismaService.sellerApplication.findUnique.mockResolvedValue(mockApplication);
      prismaService.sellerApplication.update.mockResolvedValue(approvedApplication);
      usersService.update.mockResolvedValue({} as never);
      sellerProfilesService.create.mockResolvedValue({} as never);

      const result = await service.approve('a1', 'admin1');

      expect(usersService.update).toHaveBeenCalledWith('u1', { role: UserRole.seller });
      expect(sellerProfilesService.create).toHaveBeenCalledWith(
        'u1',
        'Test Store',
        'A test store description with more than 50 characters',
      );
      expect(result.status).toBe(ApplicationStatus.approved);
    });

    it('should throw BadRequestException if application is not pending', async () => {
      prismaService.sellerApplication.findUnique.mockResolvedValue({
        ...mockApplication,
        status: ApplicationStatus.approved,
      });

      await expect(service.approve('a1', 'admin1')).rejects.toThrow(BadRequestException);
    });
  });

  describe('reject', () => {
    it('should reject application with reason', async () => {
      const pendingApplication = { ...mockApplication, status: ApplicationStatus.pending };
      const rejectedApplication = {
        ...mockApplication,
        status: ApplicationStatus.rejected,
        rejectionReason: 'Not enough information',
        reviewedById: 'admin1',
        reviewedAt: expect.any(Date) as Date,
      };
      prismaService.sellerApplication.findUnique.mockResolvedValue(pendingApplication);
      prismaService.sellerApplication.update.mockResolvedValue(rejectedApplication);

      const result = await service.reject('a1', 'admin1', 'Not enough information');

      expect(result.status).toBe(ApplicationStatus.rejected);
      expect(result.rejectionReason).toBe('Not enough information');
    });

    it('should throw BadRequestException if application is not pending', async () => {
      prismaService.sellerApplication.findUnique.mockResolvedValue({
        ...mockApplication,
        status: ApplicationStatus.rejected,
      });

      await expect(service.reject('a1', 'admin1', 'reason')).rejects.toThrow(BadRequestException);
    });
  });
});
