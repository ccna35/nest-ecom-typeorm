import { Test } from '@nestjs/testing';
import { SellerApplicationsController } from './seller-applications.controller';
import { SellerApplicationsService } from './seller-applications.service';
import { ApplicationStatus, UserRole } from '@prisma/client';

describe('SellerApplicationsController', () => {
  let controller: SellerApplicationsController;
  let service: jest.Mocked<SellerApplicationsService>;

  const mockApplication = {
    id: 'a1',
    userId: 'u1',
    storeName: 'Test Store',
    storeDescription: 'A test store description',
    status: ApplicationStatus.pending,
    rejectionReason: null,
    reviewedById: null,
    reviewedAt: null,
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  const mockRequest = (userId: string, role: UserRole = UserRole.customer) => ({
    user: { userId, role },
  });

  beforeEach(async () => {
    const module = await Test.createTestingModule({
      controllers: [SellerApplicationsController],
      providers: [
        {
          provide: SellerApplicationsService,
          useValue: {
            create: jest.fn(),
            findByUserId: jest.fn(),
            findAll: jest.fn(),
            findOne: jest.fn(),
            approve: jest.fn(),
            reject: jest.fn(),
          },
        },
      ],
    }).compile();

    controller = module.get(SellerApplicationsController);
    service = module.get(SellerApplicationsService);
  });

  describe('create', () => {
    it('should create seller application', async () => {
      service.create.mockResolvedValue(mockApplication as any);

      const result = await controller.create(mockRequest('u1') as any, {
        storeName: 'Test Store',
        storeDescription: 'A test store description',
      });

      expect(service.create).toHaveBeenCalledWith('u1', {
        storeName: 'Test Store',
        storeDescription: 'A test store description',
      });
      expect(result).toEqual(mockApplication);
    });
  });

  describe('getMyApplication', () => {
    it('should return user own application', async () => {
      service.findByUserId.mockResolvedValue(mockApplication as any);

      const result = await controller.getMyApplication(mockRequest('u1') as any);

      expect(service.findByUserId).toHaveBeenCalledWith('u1');
      expect(result).toEqual(mockApplication);
    });
  });

  describe('findAll', () => {
    it('should return all applications', async () => {
      service.findAll.mockResolvedValue([mockApplication] as any);

      const result = await controller.findAll();

      expect(service.findAll).toHaveBeenCalledWith(undefined);
      expect(result).toEqual([mockApplication]);
    });

    it('should filter by status if provided', async () => {
      service.findAll.mockResolvedValue([mockApplication] as never);

      await controller.findAll(ApplicationStatus.pending);

      expect(service.findAll).toHaveBeenCalledWith(ApplicationStatus.pending);
    });
  });

  describe('findOne', () => {
    it('should return application by id', async () => {
      service.findOne.mockResolvedValue(mockApplication as any);

      const result = await controller.findOne('a1');

      expect(service.findOne).toHaveBeenCalledWith('a1');
      expect(result).toEqual(mockApplication);
    });
  });

  describe('approve', () => {
    it('should approve application', async () => {
      const approvedApplication = { ...mockApplication, status: ApplicationStatus.approved };
      service.approve.mockResolvedValue(approvedApplication as never);

      const result = await controller.approve('a1', mockRequest('admin1', UserRole.admin) as never);

      expect(service.approve).toHaveBeenCalledWith('a1', 'admin1');
      expect(result.status).toBe(ApplicationStatus.approved);
    });
  });

  describe('reject', () => {
    it('should reject application with reason', async () => {
      const rejectedApplication = {
        ...mockApplication,
        status: ApplicationStatus.rejected,
        rejectionReason: 'Not enough information',
      };
      service.reject.mockResolvedValue(rejectedApplication as never);

      const result = await controller.reject('a1', mockRequest('admin1', UserRole.admin) as never, {
        rejectionReason: 'Not enough information',
      });

      expect(service.reject).toHaveBeenCalledWith('a1', 'admin1', 'Not enough information');
      expect(result.status).toBe(ApplicationStatus.rejected);
    });
  });
});
