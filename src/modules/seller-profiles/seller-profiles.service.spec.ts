import { Test } from '@nestjs/testing';
import { BadRequestException, NotFoundException } from '@nestjs/common';
import { SellerProfilesService } from './seller-profiles.service';
import { SellerProfile } from '@prisma/client';
import { PrismaService } from '../../database/prisma.service';

describe('SellerProfilesService', () => {
  let service: SellerProfilesService;
  let prismaService: {
    sellerProfile: {
      create: jest.Mock;
      findUnique: jest.Mock;
      findMany: jest.Mock;
      update: jest.Mock;
      delete: jest.Mock;
    };
  };

  const mockProfile: SellerProfile = {
    id: 'p1',
    userId: 'u1',
    storeName: 'Test Store',
    storeDescription: 'Test description of the store',
    logoUrl: null,
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  beforeEach(async () => {
    const mockPrismaService = {
      sellerProfile: {
        create: jest.fn(),
        findUnique: jest.fn(),
        findMany: jest.fn(),
        update: jest.fn(),
        delete: jest.fn(),
      },
    };

    const module = await Test.createTestingModule({
      providers: [
        SellerProfilesService,
        {
          provide: PrismaService,
          useValue: mockPrismaService,
        },
      ],
    }).compile();

    service = module.get(SellerProfilesService);
    prismaService = module.get(PrismaService) as typeof prismaService;
  });

  describe('create', () => {
    it('should create a seller profile', async () => {
      prismaService.sellerProfile.findUnique.mockResolvedValue(null);
      prismaService.sellerProfile.create.mockResolvedValue(mockProfile);

      const result = await service.create('u1', 'Test Store', 'Test description of the store');

      expect(prismaService.sellerProfile.findUnique).toHaveBeenCalledWith({
        where: { userId: 'u1' },
      });
      expect(prismaService.sellerProfile.create).toHaveBeenCalledWith({
        data: {
          userId: 'u1',
          storeName: 'Test Store',
          storeDescription: 'Test description of the store',
        },
      });
      expect(result).toEqual(mockProfile);
    });

    it('should throw BadRequestException if profile already exists', async () => {
      prismaService.sellerProfile.findUnique.mockResolvedValue(mockProfile);

      await expect(service.create('u1', 'Test Store', 'Test description')).rejects.toThrow(
        BadRequestException,
      );
    });
  });

  describe('findAll', () => {
    it('should return all seller profiles', async () => {
      prismaService.sellerProfile.findMany.mockResolvedValue([mockProfile]);

      const result = await service.findAll();

      expect(prismaService.sellerProfile.findMany).toHaveBeenCalledWith({
        include: { user: true },
        orderBy: { createdAt: 'desc' },
      });
      expect(result).toEqual([mockProfile]);
    });
  });

  describe('findByUserId', () => {
    it('should return profile by userId', async () => {
      prismaService.sellerProfile.findUnique.mockResolvedValue(mockProfile);

      const result = await service.findByUserId('u1');

      expect(prismaService.sellerProfile.findUnique).toHaveBeenCalledWith({
        where: { userId: 'u1' },
        include: { user: true },
      });
      expect(result).toEqual(mockProfile);
    });

    it('should return null if profile not found', async () => {
      prismaService.sellerProfile.findUnique.mockResolvedValue(null);

      const result = await service.findByUserId('u2');

      expect(result).toBeNull();
    });
  });

  describe('update', () => {
    it('should update seller profile', async () => {
      const updatedProfile = { ...mockProfile, storeName: 'Updated Store' };
      prismaService.sellerProfile.findUnique.mockResolvedValue(mockProfile);
      prismaService.sellerProfile.update.mockResolvedValue(updatedProfile);

      const result = await service.update('u1', { storeName: 'Updated Store' });

      expect(result.storeName).toBe('Updated Store');
    });

    it('should throw NotFoundException if profile not found', async () => {
      prismaService.sellerProfile.findUnique.mockResolvedValue(null);

      await expect(service.update('u2', { storeName: 'Updated' })).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  describe('remove', () => {
    it('should remove seller profile', async () => {
      prismaService.sellerProfile.findUnique.mockResolvedValue(mockProfile);
      prismaService.sellerProfile.delete.mockResolvedValue(mockProfile);

      await service.remove('u1');

      expect(prismaService.sellerProfile.delete).toHaveBeenCalledWith({ where: { userId: 'u1' } });
    });

    it('should throw NotFoundException if profile not found', async () => {
      prismaService.sellerProfile.findUnique.mockResolvedValue(null);

      await expect(service.remove('u2')).rejects.toThrow(NotFoundException);
    });
  });
});
