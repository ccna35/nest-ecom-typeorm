import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Category } from '../categories/category.entity';
import { Product } from './product.entity';
import { CreateProductDto } from './dto/create-product.dto';
import { UpdateProductDto } from './dto/update-product.dto';

@Injectable()
export class ProductsService {
  constructor(
    @InjectRepository(Product)
    private readonly productsRepo: Repository<Product>,
    @InjectRepository(Category)
    private readonly categoriesRepo: Repository<Category>,
  ) {}

  async create(dto: CreateProductDto): Promise<Product> {
    const existingSku = await this.productsRepo.findOne({ where: { sku: dto.sku } });
    if (existingSku) throw new BadRequestException('SKU already exists');

    const category = await this.categoriesRepo.findOne({ where: { id: dto.categoryId } });
    if (!category) throw new BadRequestException('Invalid categoryId');

    const product = this.productsRepo.create({
      sku: dto.sku,
      name: dto.name,
      description: dto.description ?? null,
      price: dto.price,
      stock: dto.stock ?? 0,
      isActive: dto.isActive ?? true,
      category,
      categoryId: category.id,
    });

    return this.productsRepo.save(product);
  }

  findAll(): Promise<Product[]> {
    return this.productsRepo.find({
      relations: { category: true },
      order: { createdAt: 'DESC' },
    });
  }

  async findOne(id: string): Promise<Product> {
    const product = await this.productsRepo.findOne({
      where: { id },
      relations: { category: true },
    });
    if (!product) throw new NotFoundException('Product not found');
    return product;
  }

  async update(id: string, dto: UpdateProductDto): Promise<Product> {
    const product = await this.findOne(id);

    if (dto.sku && dto.sku !== product.sku) {
      const existingSku = await this.productsRepo.findOne({ where: { sku: dto.sku } });
      if (existingSku) throw new BadRequestException('SKU already exists');
    }

    if (dto.categoryId && dto.categoryId !== product.categoryId) {
      const category = await this.categoriesRepo.findOne({ where: { id: dto.categoryId } });
      if (!category) throw new BadRequestException('Invalid categoryId');
      product.category = category;
      product.categoryId = category.id;
    }

    Object.assign(product, {
      ...dto,
      description: dto.description ?? product.description,
    });

    return this.productsRepo.save(product);
  }

  async remove(id: string): Promise<void> {
    const product = await this.findOne(id);
    await this.productsRepo.remove(product);
  }
}
