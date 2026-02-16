import 'dotenv/config';
import 'reflect-metadata';
import * as bcrypt from 'bcrypt';
import dataSource from './data-source';
import { User, UserRole } from '../modules/users/user.entity';

async function seed() {
    await dataSource.initialize();
    console.log('✅ Database connected');

    const userRepo = dataSource.getRepository(User);

    // Check if admin already exists
    const existing = await userRepo.findOne({
        where: { email: 'admin@example.com' },
    });

    if (existing) {
        console.log('⚠️  Admin user already exists');
        await dataSource.destroy();
        return;
    }

    // Create admin user
    const passwordHash = await bcrypt.hash('admin123', 10);
    const admin = userRepo.create({
        email: 'admin@example.com',
        name: 'Admin User',
        passwordHash,
        role: UserRole.ADMIN,
        isActive: true,
    });

    await userRepo.save(admin);
    console.log('✅ Admin user created:');
    console.log('   Email: admin@example.com');
    console.log('   Password: admin123');

    await dataSource.destroy();
}

seed().catch((error) => {
    console.error('❌ Seed failed:', error);
    process.exit(1);
});
