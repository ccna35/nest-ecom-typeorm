import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import slugify from 'slugify';
import { PrismaService } from '../../database/prisma.service';
import { Category } from '@prisma/client';
import { CreateCategoryDto } from './dto/create-category.dto';
import { UpdateCategoryDto } from './dto/update-category.dto';

@Injectable()
export class CategoriesService {
  constructor(private readonly prisma: PrismaService) {}

  private makeSlug(name: string) {
    return slugify(name, { lower: true, strict: true, trim: true });
  }

  async create(dto: CreateCategoryDto): Promise<Category> {
    const slug = this.makeSlug(dto.name);

    const existing = await this.prisma.category.findFirst({
      where: {
        OR: [{ name: dto.name }, { slug }],
      },
    });
    if (existing) throw new BadRequestException('Category already exists');

    const category = await this.prisma.category.create({
      data: {
        name: dto.name,
        slug,
        description: dto.description ?? null,
      },
    });

    return category;
  }

  findAll(): Promise<Category[]> {
    return this.prisma.category.findMany({
      orderBy: { createdAt: 'desc' },
    });
  }

  async findOne(id: string): Promise<Category> {
    const category = await this.prisma.category.findUnique({
      where: { id },
    });
    if (!category) throw new NotFoundException('Category not found');
    return category;
  }

  async update(id: string, dto: UpdateCategoryDto): Promise<Category> {
    const category = await this.findOne(id);

    if (dto.name && dto.name !== category.name) {
      const slug = this.makeSlug(dto.name);
      const existing = await this.prisma.category.findFirst({
        where: {
          OR: [{ name: dto.name }, { slug }],
        },
      });
      if (existing) throw new BadRequestException('Category already exists');
    }

    return this.prisma.category.update({
      where: { id },
      data: {
        ...(dto.name && { name: dto.name, slug: this.makeSlug(dto.name) }),
        ...(dto.description !== undefined && { description: dto.description ?? null }),
      },
    });
  }

  async remove(id: string): Promise<void> {
    await this.findOne(id);
    await this.prisma.category.delete({
      where: { id },
    });
  }
}
