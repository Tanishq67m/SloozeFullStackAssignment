import { PrismaClient, Role, Country, OrderStatus, PaymentStatus } from '@prisma/client';
import * as bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Seeding Slooze Food App...\n');

  // ─── Clean existing data ───────────────────────────────────────────────────
  await prisma.payment.deleteMany();
  await prisma.orderItem.deleteMany();
  await prisma.order.deleteMany();
  await prisma.paymentMethod.deleteMany();
  await prisma.menuItem.deleteMany();
  await prisma.restaurant.deleteMany();
  await prisma.user.deleteMany();

  const hash = (pw: string) => bcrypt.hashSync(pw, 10);

  // ─── Users ────────────────────────────────────────────────────────────────
  console.log('👤 Creating users...');

  const nickFury = await prisma.user.create({
    data: {
      email: 'nick.fury@shield.com',
      password: hash('password123'),
      name: 'Nick Fury',
      role: Role.ADMIN,
      country: null, // Admin has global access — no country restriction
    },
  });

  const captainMarvel = await prisma.user.create({
    data: {
      email: 'captain.marvel@shield.com',
      password: hash('password123'),
      name: 'Captain Marvel',
      role: Role.MANAGER,
      country: Country.INDIA,
    },
  });

  const captainAmerica = await prisma.user.create({
    data: {
      email: 'captain.america@shield.com',
      password: hash('password123'),
      name: 'Captain America',
      role: Role.MANAGER,
      country: Country.AMERICA,
    },
  });

  const thanos = await prisma.user.create({
    data: {
      email: 'thanos@shield.com',
      password: hash('password123'),
      name: 'Thanos',
      role: Role.MEMBER,
      country: Country.INDIA,
    },
  });

  const thor = await prisma.user.create({
    data: {
      email: 'thor@shield.com',
      password: hash('password123'),
      name: 'Thor',
      role: Role.MEMBER,
      country: Country.INDIA,
    },
  });

  const travis = await prisma.user.create({
    data: {
      email: 'travis@shield.com',
      password: hash('password123'),
      name: 'Travis',
      role: Role.MEMBER,
      country: Country.AMERICA,
    },
  });

  console.log('  ✓ Nick Fury (Admin · Global)');
  console.log('  ✓ Captain Marvel (Manager · India)');
  console.log('  ✓ Captain America (Manager · America)');
  console.log('  ✓ Thanos (Member · India)');
  console.log('  ✓ Thor (Member · India)');
  console.log('  ✓ Travis (Member · America)');

  // ─── Payment Methods ──────────────────────────────────────────────────────
  console.log('\n💳 Creating payment methods...');

  const nickFuryCard = await prisma.paymentMethod.create({
    data: {
      userId: nickFury.id,
      type: 'CREDIT_CARD',
      last4: '0007',
      provider: 'Visa',
      isDefault: true,
    },
  });

  const marvelUPI = await prisma.paymentMethod.create({
    data: {
      userId: captainMarvel.id,
      type: 'UPI',
      last4: 'marvel@upi',
      provider: 'PhonePe',
      isDefault: true,
    },
  });

  const americaCard = await prisma.paymentMethod.create({
    data: {
      userId: captainAmerica.id,
      type: 'CREDIT_CARD',
      last4: '1945',
      provider: 'Mastercard',
      isDefault: true,
    },
  });

  const thanosCard = await prisma.paymentMethod.create({
    data: {
      userId: thanos.id,
      type: 'DEBIT_CARD',
      last4: '5050',
      provider: 'RuPay',
      isDefault: true,
    },
  });

  await prisma.paymentMethod.create({
    data: {
      userId: thor.id,
      type: 'UPI',
      last4: 'thor@upi',
      provider: 'GPay',
      isDefault: true,
    },
  });

  await prisma.paymentMethod.create({
    data: {
      userId: travis.id,
      type: 'CREDIT_CARD',
      last4: '4242',
      provider: 'Visa',
      isDefault: true,
    },
  });

  console.log('  ✓ Payment methods created for all users');

  // ─── Restaurants — India ──────────────────────────────────────────────────
  console.log('\n🍽️  Creating restaurants...');

  const spicePalace = await prisma.restaurant.create({
    data: {
      name: 'Spice Palace',
      description: 'Authentic North Indian cuisine with rich gravies and tandoor specialties',
      cuisine: 'North Indian',
      country: Country.INDIA,
      rating: 4.5,
      address: 'Connaught Place, New Delhi, India',
      imageUrl: 'https://images.unsplash.com/photo-1585937421612-70a008356fbe?w=800',
    },
  });

  const mumbaiMasala = await prisma.restaurant.create({
    data: {
      name: 'Mumbai Masala',
      description: 'Street-style Mumbai favorites — pav bhaji, vada pav, and more',
      cuisine: 'Street Food',
      country: Country.INDIA,
      rating: 4.3,
      address: 'Juhu Beach, Mumbai, India',
      imageUrl: 'https://images.unsplash.com/photo-1567188040759-fb8a883dc6d8?w=800',
    },
  });

  const biryaniHouse = await prisma.restaurant.create({
    data: {
      name: 'Biryani House',
      description: 'Hyderabadi dum biryani cooked in the traditional way',
      cuisine: 'Hyderabadi',
      country: Country.INDIA,
      rating: 4.7,
      address: 'Banjara Hills, Hyderabad, India',
      imageUrl: 'https://images.unsplash.com/photo-1563379091339-03246963d51a?w=800',
    },
  });

  // ─── Restaurants — America ────────────────────────────────────────────────

  const burgerBarn = await prisma.restaurant.create({
    data: {
      name: 'Burger Barn',
      description: 'Classic American smash burgers with hand-cut fries since 1987',
      cuisine: 'American',
      country: Country.AMERICA,
      rating: 4.4,
      address: '5th Avenue, New York, NY, USA',
      imageUrl: 'https://images.unsplash.com/photo-1568901346375-23c9450c58cd?w=800',
    },
  });

  const texasBBQ = await prisma.restaurant.create({
    data: {
      name: 'Texas BBQ House',
      description: 'Low and slow smoked meats, brisket, ribs, and all the fixings',
      cuisine: 'BBQ',
      country: Country.AMERICA,
      rating: 4.6,
      address: 'Congress Ave, Austin, TX, USA',
      imageUrl: 'https://images.unsplash.com/photo-1544025162-d76538b2a681?w=800',
    },
  });

  const thePizzaLoft = await prisma.restaurant.create({
    data: {
      name: 'The Pizza Loft',
      description: 'New York-style thin crust pizza with premium toppings',
      cuisine: 'Italian-American',
      country: Country.AMERICA,
      rating: 4.2,
      address: 'Sunset Blvd, Los Angeles, CA, USA',
      imageUrl: 'https://images.unsplash.com/photo-1565299624946-b28f40a0ae38?w=800',
    },
  });

  console.log('  ✓ 3 restaurants in India');
  console.log('  ✓ 3 restaurants in America');

  // ─── Menu Items — India ───────────────────────────────────────────────────
  console.log('\n🍴 Creating menu items...');

  await prisma.menuItem.createMany({
    data: [
      // Spice Palace
      { restaurantId: spicePalace.id, name: 'Butter Chicken', description: 'Tender chicken in rich tomato-cream sauce', price: 320, category: 'Main Course' },
      { restaurantId: spicePalace.id, name: 'Dal Makhani', description: 'Slow-cooked black lentils with cream and butter', price: 240, category: 'Main Course' },
      { restaurantId: spicePalace.id, name: 'Garlic Naan', description: 'Tandoor-baked flatbread with garlic butter', price: 60, category: 'Breads' },
      { restaurantId: spicePalace.id, name: 'Paneer Tikka', description: 'Marinated cottage cheese grilled in tandoor', price: 280, category: 'Starters' },
      { restaurantId: spicePalace.id, name: 'Mango Lassi', description: 'Chilled yogurt drink with Alphonso mango', price: 120, category: 'Beverages' },
      // Mumbai Masala
      { restaurantId: mumbaiMasala.id, name: 'Pav Bhaji', description: 'Spiced vegetable mash with buttered pav rolls', price: 150, category: 'Main Course' },
      { restaurantId: mumbaiMasala.id, name: 'Vada Pav', description: 'Spiced potato fritter in a soft bun — the Mumbai burger', price: 40, category: 'Snacks' },
      { restaurantId: mumbaiMasala.id, name: 'Bhel Puri', description: 'Puffed rice with tamarind chutney and veggies', price: 80, category: 'Snacks' },
      { restaurantId: mumbaiMasala.id, name: 'Cutting Chai', description: 'Mumbai\'s signature half-cup spiced tea', price: 30, category: 'Beverages' },
      // Biryani House
      { restaurantId: biryaniHouse.id, name: 'Hyderabadi Dum Biryani', description: 'Aromatic basmati with slow-cooked mutton', price: 420, category: 'Main Course' },
      { restaurantId: biryaniHouse.id, name: 'Chicken Biryani', description: 'Spiced chicken layered with saffron rice', price: 350, category: 'Main Course' },
      { restaurantId: biryaniHouse.id, name: 'Raita', description: 'Cooling yogurt with cucumber and mint', price: 60, category: 'Sides' },
      { restaurantId: biryaniHouse.id, name: 'Shahi Tukda', description: 'Fried bread in saffron-flavored rabri', price: 150, category: 'Desserts' },
    ],
  });

  // ─── Menu Items — America ─────────────────────────────────────────────────
  await prisma.menuItem.createMany({
    data: [
      // Burger Barn
      { restaurantId: burgerBarn.id, name: 'Classic Smash Burger', description: 'Double smash patty, American cheese, pickles, special sauce', price: 14.99, category: 'Burgers' },
      { restaurantId: burgerBarn.id, name: 'Bacon BBQ Burger', description: 'Crispy bacon, cheddar, caramelized onions, BBQ sauce', price: 17.99, category: 'Burgers' },
      { restaurantId: burgerBarn.id, name: 'Hand-Cut Fries', description: 'Seasoned skin-on fries with house dipping sauce', price: 5.99, category: 'Sides' },
      { restaurantId: burgerBarn.id, name: 'Vanilla Milkshake', description: 'Thick hand-spun vanilla shake', price: 6.99, category: 'Beverages' },
      // Texas BBQ House
      { restaurantId: texasBBQ.id, name: 'Brisket Plate', description: '1/2 lb smoked brisket with two sides', price: 22.99, category: 'BBQ Plates' },
      { restaurantId: texasBBQ.id, name: 'Baby Back Ribs', description: 'Full rack slow-smoked fall-off-the-bone ribs', price: 34.99, category: 'BBQ Plates' },
      { restaurantId: texasBBQ.id, name: 'Pulled Pork Sandwich', description: 'Smoked pulled pork on brioche with slaw', price: 13.99, category: 'Sandwiches' },
      { restaurantId: texasBBQ.id, name: 'Mac & Cheese', description: 'Smoked cheddar mac — the best side in Texas', price: 7.99, category: 'Sides' },
      // The Pizza Loft
      { restaurantId: thePizzaLoft.id, name: 'Margherita Pizza', description: 'San Marzano tomato, fresh mozzarella, basil', price: 16.99, category: 'Pizzas' },
      { restaurantId: thePizzaLoft.id, name: 'Pepperoni Pizza', description: 'Double pepperoni on our classic red sauce', price: 19.99, category: 'Pizzas' },
      { restaurantId: thePizzaLoft.id, name: 'Garlic Bread', description: 'Toasted with herb butter and parmesan', price: 5.99, category: 'Starters' },
      { restaurantId: thePizzaLoft.id, name: 'Tiramisu', description: 'House-made Italian classic', price: 7.99, category: 'Desserts' },
    ],
  });

  console.log('  ✓ 13 menu items for India restaurants');
  console.log('  ✓ 12 menu items for America restaurants');

  // ─── Sample Orders ────────────────────────────────────────────────────────
  console.log('\n📦 Creating sample orders...');

  // Fetch menu items for references
  const butterChicken = await prisma.menuItem.findFirst({ where: { name: 'Butter Chicken' } });
  const garlicNaan    = await prisma.menuItem.findFirst({ where: { name: 'Garlic Naan' } });
  const smashBurger   = await prisma.menuItem.findFirst({ where: { name: 'Classic Smash Burger' } });
  const fries         = await prisma.menuItem.findFirst({ where: { name: 'Hand-Cut Fries' } });

  // Thanos orders from Spice Palace (India)
  const thanosOrder = await prisma.order.create({
    data: {
      userId: thanos.id,
      restaurantId: spicePalace.id,
      country: Country.INDIA,
      status: OrderStatus.DELIVERED,
      totalAmount: 380,
      orderItems: {
        create: [
          { menuItemId: butterChicken!.id, quantity: 1, unitPrice: 320, totalPrice: 320 },
          { menuItemId: garlicNaan!.id,    quantity: 1, unitPrice: 60,  totalPrice: 60 },
        ],
      },
    },
  });

  await prisma.payment.create({
    data: {
      orderId: thanosOrder.id,
      paymentMethodId: thanosCard.id,
      amount: 380,
      status: PaymentStatus.COMPLETED,
    },
  });

  // Travis orders from Burger Barn (America)
  const travisPayment = await prisma.paymentMethod.findFirst({ where: { userId: travis.id } });
  const travisOrder = await prisma.order.create({
    data: {
      userId: travis.id,
      restaurantId: burgerBarn.id,
      country: Country.AMERICA,
      status: OrderStatus.CONFIRMED,
      totalAmount: 20.98,
      orderItems: {
        create: [
          { menuItemId: smashBurger!.id, quantity: 1, unitPrice: 14.99, totalPrice: 14.99 },
          { menuItemId: fries!.id,        quantity: 1, unitPrice: 5.99,  totalPrice: 5.99 },
        ],
      },
    },
  });

  await prisma.payment.create({
    data: {
      orderId: travisOrder.id,
      paymentMethodId: travisPayment!.id,
      amount: 20.98,
      status: PaymentStatus.COMPLETED,
    },
  });

  // Nick Fury (Admin) — has a pending order in India (to demo global access)
  const dalbotham = await prisma.menuItem.findFirst({ where: { name: 'Dal Makhani' } });
  const furyOrder = await prisma.order.create({
    data: {
      userId: nickFury.id,
      restaurantId: spicePalace.id,
      country: Country.INDIA,
      status: OrderStatus.PENDING,
      totalAmount: 240,
      orderItems: {
        create: [
          { menuItemId: dalbotham!.id, quantity: 1, unitPrice: 240, totalPrice: 240 },
        ],
      },
    },
  });

  await prisma.payment.create({
    data: {
      orderId: furyOrder.id,
      paymentMethodId: nickFuryCard.id,
      amount: 240,
      status: PaymentStatus.PENDING,
    },
  });

  console.log('  ✓ Thanos → Spice Palace (DELIVERED, India)');
  console.log('  ✓ Travis → Burger Barn (CONFIRMED, America)');
  console.log('  ✓ Nick Fury → Spice Palace (PENDING, India — admin global demo)');

  // ─── Summary ──────────────────────────────────────────────────────────────
  console.log('\n✅ Seed complete!\n');
  console.log('─────────────────────────────────────────────');
  console.log('🔑 All user passwords: password123');
  console.log('─────────────────────────────────────────────');
  console.log('👤 nick.fury@shield.com      → Admin (Global)');
  console.log('👤 captain.marvel@shield.com → Manager (India)');
  console.log('👤 captain.america@shield.com→ Manager (America)');
  console.log('👤 thanos@shield.com         → Member (India)');
  console.log('👤 thor@shield.com           → Member (India)');
  console.log('👤 travis@shield.com         → Member (America)');
  console.log('─────────────────────────────────────────────\n');
}

main()
  .catch((e) => {
    console.error('❌ Seed failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
