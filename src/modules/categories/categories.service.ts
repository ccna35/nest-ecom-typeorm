import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import slugify from 'slugify';
import { Category } from './category.entity';
import { CreateCategoryDto } from './dto/create-category.dto';
import { UpdateCategoryDto } from './dto/update-category.dto';

@Injectable()
export class CategoriesService {
  constructor(
    @InjectRepository(Category)
    private readonly categoriesRepo: Repository<Category>,
  ) {}

  private makeSlug(name: string) {
    return slugify(name, { lower: true, strict: true, trim: true });
  }

  async create(dto: CreateCategoryDto): Promise<Category> {
    const slug = this.makeSlug(dto.name);

    const existing = await this.categoriesRepo.findOne({
      where: [{ name: dto.name }, { slug }],
    });
    if (existing) throw new BadRequestException('Category already exists');

    const category = this.categoriesRepo.create({
      name: dto.name,
      slug,
      description: dto.description ?? null,
    });

    return this.categoriesRepo.save(category);
  }

  findAll(): Promise<Category[]> {
    return this.categoriesRepo.find({ order: { createdAt: 'DESC' } });
  }

  async findOne(id: string): Promise<Category> {
    const category = await this.categoriesRepo.findOne({ where: { id } });
    if (!category) throw new NotFoundException('Category not found');
    return category;
  }

  async update(id: string, dto: UpdateCategoryDto): Promise<Category> {
    const category = await this.findOne(id);

    if (dto.name && dto.name !== category.name) {
      const slug = this.makeSlug(dto.name);
      const existing = await this.categoriesRepo.findOne({ where: [{ name: dto.name }, { slug }] });
      if (existing) throw new BadRequestException('Category already exists');
      category.name = dto.name;
      category.slug = slug;
    }

    if (dto.description !== undefined) {
      category.description = dto.description ?? null;
    }

    return this.categoriesRepo.save(category);
  }

  async remove(id: string): Promise<void> {
    const category = await this.findOne(id);
    await this.categoriesRepo.remove(category);
  }
}
