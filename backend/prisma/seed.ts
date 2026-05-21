import 'dotenv/config';
import { PrismaClient } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import { Pool } from 'pg';
import {
  MURCIA_SERVICE_BOUNDARY,
  SUPPORTED_CITIES,
} from '../src/common/utils/geofence';

const pool = new Pool({ connectionString: process.env.DATABASE_URL });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

async function main() {
  console.log('Seeding MurGo (Murcia service area) delivery data...');

  await prisma.serviceArea.updateMany({
    where: { name: { not: 'Murcia' } },
    data: { isActive: false },
  });

  await prisma.serviceArea.upsert({
    where: { name: 'Murcia' },
    create: {
      name: 'Murcia',
      province: 'Negros Occidental',
      country: 'Philippines',
      boundaryGeo: MURCIA_SERVICE_BOUNDARY as object,
      centerLat: 10.604,
      centerLng: 123.041,
      isActive: true,
    },
    update: {
      boundaryGeo: MURCIA_SERVICE_BOUNDARY as object,
      centerLat: 10.604,
      centerLng: 123.041,
      isActive: true,
    },
  });

  const supportedNames = SUPPORTED_CITIES.map((c) => c.name);
  await prisma.supportedCity.updateMany({
    where: { name: { notIn: [...supportedNames] } },
    data: { isActive: false },
  });

  for (const city of SUPPORTED_CITIES) {
    await prisma.supportedCity.upsert({
      where: { name: city.name },
      create: {
        name: city.name,
        latitude: city.lat,
        longitude: city.lng,
        isActive: true,
      },
      update: { latitude: city.lat, longitude: city.lng },
    });
  }

  await prisma.deliveryFeeConfig.upsert({
    where: { id: 'default-fee' },
    create: {
      id: 'default-fee',
      name: 'Default Murcia',
      baseFee: 49,
      perKmRate: 10,
      flatFeeKm: 2,
      flatFeeAmount: 49,
      isActive: true,
    },
    update: { isActive: true },
  });

  await prisma.commissionConfig.upsert({
    where: { id: 'default-commission' },
    create: {
      id: 'default-commission',
      name: 'Default Platform Commission',
      platformRate: 10,
      merchantRate: 90,
      isActive: true,
    },
    update: {},
  });

  await prisma.promoCode.upsert({
    where: { code: 'MURGO50' },
    create: {
      code: 'MURGO50',
      description: 'Welcome promo for Murcia customers',
      discountType: 'PERCENTAGE',
      discountValue: 10,
      minOrderAmount: 200,
      maxDiscount: 50,
      usageLimit: 1000,
      isActive: true,
    },
    update: {},
  });

  await prisma.promoCode.upsert({
    where: { code: 'MURCIA20' },
    create: {
      code: 'MURCIA20',
      description: 'Murcia special - ₱20 off',
      discountType: 'FIXED',
      discountValue: 20,
      minOrderAmount: 150,
      usageLimit: 500,
      isActive: true,
    },
    update: {},
  });

  const adminUser = await prisma.user.upsert({
    where: { email: 'kramdano@gmail.com' },
    create: {
      clerkId: 'pending_clerk_link',
      email: 'kramdano@gmail.com',
      firstName: 'MurGo',
      lastName: 'Admin',
      role: 'ADMIN',
      isActive: true,
    },
    update: { role: 'ADMIN', isActive: true },
  });

  const merchantUser = await prisma.user.upsert({
    where: { email: 'merchant@negrosdelivery.ph' },
    create: {
      clerkId: 'seed_merchant_clerk_id',
      email: 'merchant@negrosdelivery.ph',
      firstName: 'Maria',
      lastName: 'Santos',
      role: 'MERCHANT',
      phone: '+639171234567',
    },
    update: {},
  });

  const merchant = await prisma.merchant.upsert({
    where: { userId: merchantUser.id },
    create: {
      userId: merchantUser.id,
      businessName: 'MurGo Chicken House',
      description: 'Chicken inasal and Filipino favorites in Murcia',
      phone: '+639171234567',
      email: 'merchant@negrosdelivery.ph',
      address: 'National Highway, Murcia (Poblacion)',
      city: 'Murcia (Poblacion)',
      latitude: 10.604,
      longitude: 123.041,
      status: 'APPROVED',
      isOpen: true,
      openingTime: '08:00',
      closingTime: '22:00',
    },
    update: {
      status: 'APPROVED',
      isOpen: true,
      businessName: 'MurGo Chicken House',
      address: 'National Highway, Murcia (Poblacion)',
      city: 'Murcia (Poblacion)',
      latitude: 10.604,
      longitude: 123.041,
    },
  });

  const categories = [
    { name: 'Inasal', sortOrder: 1 },
    { name: 'Rice Meals', sortOrder: 2 },
    { name: 'Drinks', sortOrder: 3 },
  ];

  const categoryMap: Record<string, string> = {};
  for (const cat of categories) {
    const created = await prisma.category.upsert({
      where: {
        merchantId_name: { merchantId: merchant.id, name: cat.name },
      },
      create: { merchantId: merchant.id, ...cat },
      update: {},
    });
    categoryMap[cat.name] = created.id;
  }

  const products = [
    {
      name: 'Chicken Inasal Pecho',
      description: 'Grilled chicken breast with garlic rice',
      price: 149,
      stock: 50,
      categoryId: categoryMap['Inasal'],
    },
    {
      name: 'Chicken Inasal Paa',
      description: 'Grilled chicken leg quarter',
      price: 129,
      stock: 50,
      categoryId: categoryMap['Inasal'],
    },
    {
      name: 'Pork Sisig Rice Bowl',
      description: 'Sizzling sisig with steamed rice',
      price: 119,
      discountPrice: 99,
      stock: 30,
      categoryId: categoryMap['Rice Meals'],
    },
    {
      name: 'Iced Tea',
      description: 'House blend iced tea',
      price: 45,
      stock: 100,
      categoryId: categoryMap['Drinks'],
    },
  ];

  for (const product of products) {
    const existing = await prisma.product.findFirst({
      where: { merchantId: merchant.id, name: product.name },
    });
    if (!existing) {
      await prisma.product.create({
        data: { merchantId: merchant.id, ...product },
      });
    }
  }

  const merchant2User = await prisma.user.upsert({
    where: { email: 'silay@negrosdelivery.ph' },
    create: {
      clerkId: 'seed_merchant2_clerk_id',
      email: 'silay@negrosdelivery.ph',
      firstName: 'Juan',
      lastName: 'Dela Cruz',
      role: 'MERCHANT',
    },
    update: {},
  });

  const merchant2 = await prisma.merchant.upsert({
    where: { userId: merchant2User.id },
    create: {
      userId: merchant2User.id,
      businessName: 'Murcia Snack Corner',
      description: 'Local snacks, rice meals, and drinks in Murcia',
      phone: '+639181234567',
      email: 'silay@negrosdelivery.ph',
      address: 'Blumentritt, Murcia',
      city: 'Blumentritt',
      latitude: 10.612,
      longitude: 123.028,
      status: 'APPROVED',
      isOpen: true,
    },
    update: {
      status: 'APPROVED',
      businessName: 'Murcia Snack Corner',
      address: 'Blumentritt, Murcia',
      city: 'Blumentritt',
      latitude: 10.612,
      longitude: 123.028,
    },
  });

  const snackProducts = [
    { name: 'Lumpia (6pcs)', price: 90, stock: 40 },
    { name: 'Pancit Guisado', price: 85, stock: 25 },
    { name: 'Iced Coffee', price: 55, stock: 60 },
  ];

  for (const p of snackProducts) {
    const existing = await prisma.product.findFirst({
      where: { merchantId: merchant2.id, name: p.name },
    });
    if (!existing) {
      await prisma.product.create({ data: { merchantId: merchant2.id, ...p } });
    }
  }

  const riderUser = await prisma.user.upsert({
    where: { email: 'rider@negrosdelivery.ph' },
    create: {
      clerkId: 'seed_rider_clerk_id',
      email: 'rider@negrosdelivery.ph',
      firstName: 'Pedro',
      lastName: 'Garcia',
      role: 'RIDER',
      phone: '+639191234567',
    },
    update: {},
  });

  await prisma.rider.upsert({
    where: { userId: riderUser.id },
    create: {
      userId: riderUser.id,
      vehicleType: 'motorcycle',
      licenseNumber: 'NOC-RIDER-001',
      status: 'OFFLINE',
      currentLat: 10.604,
      currentLng: 123.041,
    },
    update: {},
  });

  const customerUser = await prisma.user.upsert({
    where: { email: 'customer@negrosdelivery.ph' },
    create: {
      clerkId: 'seed_customer_clerk_id',
      email: 'customer@negrosdelivery.ph',
      firstName: 'Ana',
      lastName: 'Reyes',
      role: 'CUSTOMER',
      phone: '+639201234567',
    },
    update: {},
  });

  const customer = await prisma.customer.upsert({
    where: { userId: customerUser.id },
    create: { userId: customerUser.id },
    update: {},
  });

  await prisma.address.upsert({
    where: { id: 'seed-address-murcia' },
    create: {
      id: 'seed-address-murcia',
      customerId: customer.id,
      label: 'Home',
      street: 'National Highway',
      barangay: 'Murcia (Poblacion)',
      city: 'Murcia (Poblacion)',
      latitude: 10.603,
      longitude: 123.04,
      isDefault: true,
    },
    update: {},
  });

  console.log('Seed completed successfully!');
  console.log(`Admin: ${adminUser.email}`);
  console.log(`Merchant: ${merchant.businessName}`);
  console.log(`Customer: ${customerUser.email}`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
    await pool.end();
  });
