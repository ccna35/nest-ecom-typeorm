import { Test } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { BadRequestException, NotFoundException } from '@nestjs/common';
import { Repository } from 'typeorm';
import { SellerProfilesService } from './seller-profiles.service';
import { SellerProfile } from './seller-profile.entity';

describe('SellerProfilesService', () => {
  let service: SellerProfilesService;
  let repository: jest.Mocked<Repository<SellerProfile>>;

  const mockProfile: SellerProfile = {
    id: 'p1',
    userId: 'u1',
    storeName: 'Test Store',
    storeDescription: 'Test description of the store',
    logoUrl: null,
    createdAt: new Date(),
    updatedAt: new Date(),
    user: {} as any,
  };

  beforeEach(async () => {
    const module = await Test.createTestingModule({
      providers: [
        SellerProfilesService,
        {
          provide: getRepositoryToken(SellerProfile),
          useValue: {
            create: jest.fn(),
            save: jest.fn(),
            findOne: jest.fn(),
            find: jest.fn(),
            remove: jest.fn(),
          },
        },
      ],
    }).compile();

    service = module.get(SellerProfilesService);
    repository = module.get(getRepositoryToken(SellerProfile));
  });

  describe('create', () => {
    it('should create a seller profile', async () => {
      repository.findOne.mockResolvedValue(null);
      repository.create.mockReturnValue(mockProfile);
      repository.save.mockResolvedValue(mockProfile);

      const result = await service.create('u1', 'Test Store', 'Test description of the store');

      expect(repository.findOne).toHaveBeenCalledWith({ where: { userId: 'u1' } });
      expect(repository.create).toHaveBeenCalledWith({
        userId: 'u1',
        storeName: 'Test Store',
        storeDescription: 'Test description of the store',
      });
      expect(result).toEqual(mockProfile);
    });

    it('should throw BadRequestException if profile already exists', async () => {
      repository.findOne.mockResolvedValue(mockProfile);

      await expect(service.create('u1', 'Test Store', 'Test description')).rejects.toThrow(
        BadRequestException,
      );
    });
  });

  describe('findAll', () => {
    it('should return all seller profiles', async () => {
      repository.find.mockResolvedValue([mockProfile]);

      const result = await service.findAll();

      expect(repository.find).toHaveBeenCalledWith({
        relations: ['user'],
        order: { createdAt: 'DESC' },
      });
      expect(result).toEqual([mockProfile]);
    });
  });

  describe('findByUserId', () => {
    it('should return profile by userId', async () => {
      repository.findOne.mockResolvedValue(mockProfile);

      const result = await service.findByUserId('u1');

      expect(repository.findOne).toHaveBeenCalledWith({
        where: { userId: 'u1' },
        relations: ['user'],
      });
      expect(result).toEqual(mockProfile);
    });

    it('should return null if profile not found', async () => {
      repository.findOne.mockResolvedValue(null);

      const result = await service.findByUserId('u2');

      expect(result).toBeNull();
    });
  });

  describe('update', () => {
    it('should update seller profile', async () => {
      const updatedProfile = { ...mockProfile, storeName: 'Updated Store' };
      repository.findOne.mockResolvedValue(mockProfile);
      repository.save.mockResolvedValue(updatedProfile);

      const result = await service.update('u1', { storeName: 'Updated Store' });

      expect(result.storeName).toBe('Updated Store');
    });

    it('should throw NotFoundException if profile not found', async () => {
      repository.findOne.mockResolvedValue(null);

      await expect(service.update('u2', { storeName: 'Updated' })).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  describe('remove', () => {
    it('should remove seller profile', async () => {
      repository.findOne.mockResolvedValue(mockProfile);
      repository.remove.mockResolvedValue(mockProfile);

      await service.remove('u1');

      expect(repository.remove).toHaveBeenCalledWith(mockProfile);
    });

    it('should throw NotFoundException if profile not found', async () => {
      repository.findOne.mockResolvedValue(null);

      await expect(service.remove('u2')).rejects.toThrow(NotFoundException);
    });
  });
});
