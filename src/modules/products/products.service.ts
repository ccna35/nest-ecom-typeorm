import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service';
import { Product, UserRole } from '@prisma/client';
import { CreateProductDto } from './dto/create-product.dto';
import { UpdateProductDto } from './dto/update-product.dto';

type AuthUser = {
  userId: string;
  role: UserRole;
};

@Injectable()
export class ProductsService {
  constructor(private readonly prisma: PrismaService) {}

  async create(dto: CreateProductDto, user: AuthUser): Promise<Product> {
    const existingSku = await this.prisma.product.findUnique({
      where: { sku: dto.sku },
    });
    if (existingSku) throw new BadRequestException('SKU already exists');

    const category = await this.prisma.category.findUnique({
      where: { id: dto.categoryId },
    });
    if (!category) throw new BadRequestException('Invalid categoryId');

    const product = await this.prisma.product.create({
      data: {
        sku: dto.sku,
        name: dto.name,
        description: dto.description ?? null,
        price: dto.price,
        stock: dto.stock ?? 0,
        isActive: dto.isActive ?? true,
        categoryId: category.id,
        createdById: user.userId,
      },
    });

    return product;
  }

  findAll(): Promise<Product[]> {
    return this.prisma.product.findMany({
      orderBy: { createdAt: 'desc' },
    });
  }

  async findOne(id: string): Promise<Product> {
    const product = await this.prisma.product.findUnique({
      where: { id },
      include: { category: true },
    });
    if (!product) throw new NotFoundException('Product not found');
    return product;
  }

  async update(id: string, dto: UpdateProductDto, user: AuthUser): Promise<Product> {
    const product = await this.findOne(id);

    // check if user is seller and owns the product
    if (user.role === UserRole.seller && product.createdById !== user.userId) {
      throw new BadRequestException('You can only update your own products');
    }

    if (dto.sku && dto.sku !== product.sku) {
      const existingSku = await this.prisma.product.findUnique({
        where: { sku: dto.sku },
      });
      if (existingSku) throw new BadRequestException('SKU already exists');
    }

    if (dto.categoryId && dto.categoryId !== product.categoryId) {
      const category = await this.prisma.category.findUnique({
        where: { id: dto.categoryId },
      });
      if (!category) throw new BadRequestException('Invalid categoryId');
    }

    return this.prisma.product.update({
      where: { id },
      data: {
        ...dto,
        description: dto.description ?? product.description,
      },
    });
  }

  async remove(id: string, user: AuthUser): Promise<void> {
    const product = await this.findOne(id);
    if (user.role === UserRole.seller && product.createdById !== user.userId) {
      throw new BadRequestException('You can only delete your own products');
    }
    await this.prisma.product.delete({
      where: { id },
    });
  }
}
