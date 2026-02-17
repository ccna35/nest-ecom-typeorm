import { Test } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { BadRequestException, NotFoundException } from '@nestjs/common';
import { Repository } from 'typeorm';
import { SellerApplicationsService } from './seller-applications.service';
import { SellerApplication, ApplicationStatus } from './seller-application.entity';
import { UsersService } from '../users/users.service';
import { SellerProfilesService } from '../seller-profiles/seller-profiles.service';
import { UserRole } from '../users/user.entity';

describe('SellerApplicationsService', () => {
  let service: SellerApplicationsService;
  let repository: jest.Mocked<Repository<SellerApplication>>;
  let usersService: jest.Mocked<UsersService>;
  let sellerProfilesService: jest.Mocked<SellerProfilesService>;

  const mockUser = {
    id: 'u1',
    email: 'test@example.com',
    name: 'Test User',
    role: UserRole.CUSTOMER,
    isActive: true,
    passwordHash: 'hash',
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  const mockApplication: SellerApplication = {
    id: 'a1',
    userId: 'u1',
    storeName: 'Test Store',
    storeDescription: 'A test store description with more than 50 characters',
    status: ApplicationStatus.PENDING,
    rejectionReason: null,
    reviewedById: null,
    reviewedBy: null,
    reviewedAt: null,
    createdAt: new Date(),
    updatedAt: new Date(),
    user: mockUser as any,
  };

  beforeEach(async () => {
    const module = await Test.createTestingModule({
      providers: [
        SellerApplicationsService,
        {
          provide: getRepositoryToken(SellerApplication),
          useValue: {
            create: jest.fn(),
            save: jest.fn(),
            findOne: jest.fn(),
            find: jest.fn(),
          },
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
    repository = module.get(getRepositoryToken(SellerApplication));
    usersService = module.get(UsersService);
    sellerProfilesService = module.get(SellerProfilesService);
  });

  describe('create', () => {
    it('should create a seller application', async () => {
      usersService.findOne.mockResolvedValue(mockUser as any);
      repository.findOne.mockResolvedValue(null);
      sellerProfilesService.findByUserId.mockResolvedValue(null);
      repository.create.mockReturnValue(mockApplication);
      repository.save.mockResolvedValue(mockApplication);

      const result = await service.create('u1', {
        storeName: 'Test Store',
        storeDescription: 'A test store description with more than 50 characters',
      });

      expect(result).toEqual(mockApplication);
      expect(repository.create).toHaveBeenCalledWith({
        userId: 'u1',
        storeName: 'Test Store',
        storeDescription: 'A test store description with more than 50 characters',
        status: ApplicationStatus.PENDING,
      });
    });

    it('should throw BadRequestException if user is not a customer', async () => {
      usersService.findOne.mockResolvedValue({ ...mockUser, role: UserRole.SELLER } as any);

      await expect(
        service.create('u1', {
          storeName: 'Test Store',
          storeDescription: 'A test store description with more than 50 characters',
        }),
      ).rejects.toThrow(BadRequestException);
    });

    it('should throw BadRequestException if application already exists', async () => {
      usersService.findOne.mockResolvedValue(mockUser as any);
      repository.findOne.mockResolvedValue(mockApplication);

      await expect(
        service.create('u1', {
          storeName: 'Test Store',
          storeDescription: 'A test store description with more than 50 characters',
        }),
      ).rejects.toThrow(BadRequestException);
    });

    it('should throw BadRequestException if seller profile already exists', async () => {
      usersService.findOne.mockResolvedValue(mockUser as any);
      repository.findOne.mockResolvedValue(null);
      sellerProfilesService.findByUserId.mockResolvedValue({} as any);

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
      repository.find.mockResolvedValue([mockApplication]);

      const result = await service.findAll();

      expect(repository.find).toHaveBeenCalledWith({
        where: {},
        relations: ['user', 'reviewedBy'],
        order: { createdAt: 'DESC' },
      });
      expect(result).toEqual([mockApplication]);
    });

    it('should filter by status if provided', async () => {
      repository.find.mockResolvedValue([mockApplication]);

      await service.findAll(ApplicationStatus.PENDING);

      expect(repository.find).toHaveBeenCalledWith({
        where: { status: ApplicationStatus.PENDING },
        relations: ['user', 'reviewedBy'],
        order: { createdAt: 'DESC' },
      });
    });
  });

  describe('findOne', () => {
    it('should return application by id', async () => {
      repository.findOne.mockResolvedValue(mockApplication);

      const result = await service.findOne('a1');

      expect(result).toEqual(mockApplication);
    });

    it('should throw NotFoundException if not found', async () => {
      repository.findOne.mockResolvedValue(null);

      await expect(service.findOne('a2')).rejects.toThrow(NotFoundException);
    });
  });

  describe('approve', () => {
    it('should approve application and create seller profile', async () => {
      const approvedApplication = {
        ...mockApplication,
        status: ApplicationStatus.APPROVED,
        reviewedById: 'admin1',
        reviewedAt: expect.any(Date),
      };
      repository.findOne.mockResolvedValue(mockApplication);
      repository.save.mockResolvedValue(approvedApplication);
      usersService.update.mockResolvedValue({} as any);
      sellerProfilesService.create.mockResolvedValue({} as any);

      const result = await service.approve('a1', 'admin1');

      expect(usersService.update).toHaveBeenCalledWith('u1', { role: UserRole.SELLER });
      expect(sellerProfilesService.create).toHaveBeenCalledWith(
        'u1',
        'Test Store',
        'A test store description with more than 50 characters',
      );
      expect(result.status).toBe(ApplicationStatus.APPROVED);
    });

    it('should throw BadRequestException if application is not pending', async () => {
      repository.findOne.mockResolvedValue({
        ...mockApplication,
        status: ApplicationStatus.APPROVED,
      });

      await expect(service.approve('a1', 'admin1')).rejects.toThrow(BadRequestException);
    });
  });

  describe('reject', () => {
    it('should reject application with reason', async () => {
      const pendingApplication = { ...mockApplication, status: ApplicationStatus.PENDING };
      const rejectedApplication = {
        ...mockApplication,
        status: ApplicationStatus.REJECTED,
        rejectionReason: 'Not enough information',
        reviewedById: 'admin1',
        reviewedAt: expect.any(Date),
      };
      repository.findOne.mockResolvedValue(pendingApplication);
      repository.save.mockResolvedValue(rejectedApplication);

      const result = await service.reject('a1', 'admin1', 'Not enough information');

      expect(result.status).toBe(ApplicationStatus.REJECTED);
      expect(result.rejectionReason).toBe('Not enough information');
    });

    it('should throw BadRequestException if application is not pending', async () => {
      repository.findOne.mockResolvedValue({
        ...mockApplication,
        status: ApplicationStatus.REJECTED,
      });

      await expect(service.reject('a1', 'admin1', 'reason')).rejects.toThrow(BadRequestException);
    });
  });
});
