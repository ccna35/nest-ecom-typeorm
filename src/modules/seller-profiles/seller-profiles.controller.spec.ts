import { Test } from '@nestjs/testing';
import { SellerProfilesController } from './seller-profiles.controller';
import { SellerProfilesService } from './seller-profiles.service';
import { UserRole } from '@prisma/client';

describe('SellerProfilesController', () => {
  let controller: SellerProfilesController;
  let service: jest.Mocked<SellerProfilesService>;

  const mockProfile = {
    id: 'p1',
    userId: 'u1',
    storeName: 'Test Store',
    storeDescription: 'Test description',
    logoUrl: null,
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  const mockRequest = (userId: string) => ({
    user: { userId, role: UserRole.seller },
  });

  beforeEach(async () => {
    const module = await Test.createTestingModule({
      controllers: [SellerProfilesController],
      providers: [
        {
          provide: SellerProfilesService,
          useValue: {
            findAll: jest.fn(),
            findByUserId: jest.fn(),
            update: jest.fn(),
          },
        },
      ],
    }).compile();

    controller = module.get(SellerProfilesController);
    service = module.get(SellerProfilesService);
  });

  describe('findAll', () => {
    it('should return all seller profiles', async () => {
      service.findAll.mockResolvedValue([mockProfile] as any);

      const result = await controller.findAll();

      expect(service.findAll).toHaveBeenCalled();
      expect(result).toEqual([mockProfile]);
    });
  });

  describe('getMyProfile', () => {
    it('should return current seller profile', async () => {
      service.findByUserId.mockResolvedValue(mockProfile as any);

      const result = await controller.getMyProfile(mockRequest('u1') as any);

      expect(service.findByUserId).toHaveBeenCalledWith('u1');
      expect(result).toEqual(mockProfile);
    });
  });

  describe('updateMyProfile', () => {
    it('should update current seller profile', async () => {
      const updatedProfile = { ...mockProfile, storeName: 'Updated Store' };
      service.update.mockResolvedValue(updatedProfile as any);

      const result = await controller.updateMyProfile(mockRequest('u1') as any, {
        storeName: 'Updated Store',
      });

      expect(service.update).toHaveBeenCalledWith('u1', { storeName: 'Updated Store' });
      expect(result.storeName).toBe('Updated Store');
    });
  });

  describe('getProfileByUserId', () => {
    it('should return profile by userId', async () => {
      service.findByUserId.mockResolvedValue(mockProfile as any);

      const result = await controller.getProfileByUserId('u1');

      expect(service.findByUserId).toHaveBeenCalledWith('u1');
      expect(result).toEqual(mockProfile);
    });
  });
});
