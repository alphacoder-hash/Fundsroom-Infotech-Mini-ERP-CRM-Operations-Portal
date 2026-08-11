import 'dotenv/config';
import bcrypt from 'bcrypt';
import { Pool } from 'pg';
import { PrismaPg } from '@prisma/adapter-pg';
import { PrismaClient } from '@prisma/client';

const pool = new Pool({ connectionString: process.env.DATABASE_URL });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter } as any);

async function main() {
  console.log('🌱 Seeding database...');

  const password = await bcrypt.hash('Admin@123', 10);

  const users = [
    { email: 'admin@fundsroom.com', passwordHash: password, role: 'ADMIN' as const },
    { email: 'sales@fundsroom.com', passwordHash: password, role: 'SALES' as const },
    { email: 'warehouse@fundsroom.com', passwordHash: password, role: 'WAREHOUSE' as const },
    { email: 'accounts@fundsroom.com', passwordHash: password, role: 'ACCOUNTS' as const },
  ];

  for (const user of users) {
    await prisma.user.upsert({
      where: { email: user.email },
      update: {},
      create: user,
    });
    console.log(`✅ User created: ${user.email} [${user.role}]`);
  }

  const products = [
    { name: 'Product A - Widget', sku: 'PROD-001', category: 'Electronics', unitPrice: 499.99, currentStock: 100, minStockAlert: 10 },
    { name: 'Product B - Gadget', sku: 'PROD-002', category: 'Electronics', unitPrice: 999.99, currentStock: 50, minStockAlert: 5 },
    { name: 'Product C - Component', sku: 'PROD-003', category: 'Parts', unitPrice: 149.99, currentStock: 200, minStockAlert: 20 },
  ];

  for (const product of products) {
    await prisma.product.upsert({
      where: { sku: product.sku },
      update: {},
      create: product,
    });
    console.log(`✅ Product created: ${product.name}`);
  }

  await prisma.customer.upsert({
    where: { id: 'demo-customer-001' },
    update: {},
    create: {
      id: 'demo-customer-001',
      name: 'Ramesh Shah',
      mobile: '9876543210',
      email: 'ramesh@example.com',
      businessName: 'Shah Traders',
      type: 'WHOLESALE',
      status: 'ACTIVE',
      address: 'Mumbai, Maharashtra',
    },
  });
  console.log('✅ Demo customer created');

  console.log('\n🎉 Seeding complete!\n');
  console.log('Test Credentials (all use password: Admin@123)');
  console.log('─────────────────────────────────────────────');
  console.log('Admin:     admin@fundsroom.com');
  console.log('Sales:     sales@fundsroom.com');
  console.log('Warehouse: warehouse@fundsroom.com');
  console.log('Accounts:  accounts@fundsroom.com');
}

main()
  .catch((e) => { console.error(e); process.exit(1); })
  .finally(async () => { await prisma.$disconnect(); });
