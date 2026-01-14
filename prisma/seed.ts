import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Seeding database...');

  // Create products
  const fertilizer = await prisma.product.create({
    data: {
      name: 'NPK Fertilizer',
      description: 'Nitrogen, Phosphorus, and Potassium fertilizer for optimal crop growth',
      category: 'Fertilizers',
      unit: 'kg',
      pricingTiers: {
        create: [
          { minQuantity: 0, maxQuantity: 50, pricePerUnit: 20 },
          { minQuantity: 50, maxQuantity: 100, pricePerUnit: 18 },
          { minQuantity: 100, maxQuantity: null, pricePerUnit: 15 },
        ],
      },
    },
  });

  const seeds = await prisma.product.create({
    data: {
      name: 'Maize Seeds (Hybrid)',
      description: 'High-yield hybrid maize seeds',
      category: 'Seeds',
      unit: 'kg',
      pricingTiers: {
        create: [
          { minQuantity: 0, maxQuantity: 25, pricePerUnit: 150 },
          { minQuantity: 25, maxQuantity: 50, pricePerUnit: 140 },
          { minQuantity: 50, maxQuantity: null, pricePerUnit: 130 },
        ],
      },
    },
  });

  const pesticide = await prisma.product.create({
    data: {
      name: 'Organic Pesticide',
      description: 'Eco-friendly pest control solution',
      category: 'Pesticides',
      unit: 'liters',
      pricingTiers: {
        create: [
          { minQuantity: 0, maxQuantity: 10, pricePerUnit: 80 },
          { minQuantity: 10, maxQuantity: 25, pricePerUnit: 75 },
          { minQuantity: 25, maxQuantity: null, pricePerUnit: 70 },
        ],
      },
    },
  });

  // Create dealers
  const dealer1 = await prisma.dealer.create({
    data: {
      name: 'Green Valley Agri Supplies',
      email: 'contact@greenvalley.co.za',
      phone: '+27123456789',
      latitude: -26.2041,
      longitude: 28.0473,
      address: 'Johannesburg, Gauteng',
      rating: 4.8,
      totalOrdersFulfilled: 150,
      averageDeliveryTime: 24,
    },
  });

  const dealer2 = await prisma.dealer.create({
    data: {
      name: 'Farm Pro Distributors',
      email: 'info@farmpro.co.za',
      phone: '+27123456790',
      latitude: -25.7479,
      longitude: 28.2293,
      address: 'Pretoria, Gauteng',
      rating: 4.5,
      totalOrdersFulfilled: 98,
      averageDeliveryTime: 36,
    },
  });

  const dealer3 = await prisma.dealer.create({
    data: {
      name: 'Harvest Hub',
      email: 'sales@harvesthub.co.za',
      phone: '+27123456791',
      latitude: -29.8587,
      longitude: 31.0218,
      address: 'Durban, KwaZulu-Natal',
      rating: 4.9,
      totalOrdersFulfilled: 220,
      averageDeliveryTime: 18,
    },
  });

  // Create inventory for dealers
  await prisma.inventory.createMany({
    data: [
      // Dealer 1 inventory
      {
        dealerId: dealer1.id,
        productId: fertilizer.id,
        quantity: 500,
        availableQty: 500,
      },
      {
        dealerId: dealer1.id,
        productId: seeds.id,
        quantity: 200,
        availableQty: 200,
      },
      {
        dealerId: dealer1.id,
        productId: pesticide.id,
        quantity: 100,
        availableQty: 100,
      },
      // Dealer 2 inventory
      {
        dealerId: dealer2.id,
        productId: fertilizer.id,
        quantity: 800,
        availableQty: 800,
      },
      {
        dealerId: dealer2.id,
        productId: seeds.id,
        quantity: 150,
        availableQty: 150,
      },
      // Dealer 3 inventory
      {
        dealerId: dealer3.id,
        productId: fertilizer.id,
        quantity: 1000,
        availableQty: 1000,
      },
      {
        dealerId: dealer3.id,
        productId: pesticide.id,
        quantity: 200,
        availableQty: 200,
      },
    ],
  });

  console.log('✅ Database seeded successfully!');
  console.log(`   - Created ${await prisma.product.count()} products`);
  console.log(`   - Created ${await prisma.dealer.count()} dealers`);
  console.log(`   - Created ${await prisma.inventory.count()} inventory items`);
}

main()
  .catch((e) => {
    console.error('❌ Error seeding database:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
