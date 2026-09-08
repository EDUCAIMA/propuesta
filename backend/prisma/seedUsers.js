import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('Seeding users...');

  const hashedPassword = await bcrypt.hash('admin123', 10);

  const admin = await prisma.user.upsert({
    where: { email: 'admin@encanto.com' },
    update: {},
    create: {
      email: 'admin@encanto.com',
      password: hashedPassword,
      name: 'Administrador Encanto',
      role: 'ADMIN',
      permissions: ['/whatsapp', '/canchas', '/piscina', '/restaurante', '/clientes', '/infraestructura']
    }
  });

  console.log('Admin user created:', admin.email);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
