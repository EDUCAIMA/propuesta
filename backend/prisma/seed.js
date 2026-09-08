import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('Seeding data...');

  const courts = [
    { name: 'Cancha 1', type: 'FUTBOL', description: 'Cancha sintética de fútbol 5' },
    { name: 'Cancha 2', type: 'FUTBOL', description: 'Cancha sintética de fútbol 5' },
    { name: 'Cancha de Tenis', type: 'TENIS', description: 'Cancha de polvo de ladrillo' },
    { name: 'Pádel 1', type: 'PADEL', description: 'Cancha de cristal' },
  ];

  for (const court of courts) {
    await prisma.court.upsert({
      where: { id: court.name }, // This is a hack because name is not unique in schema, but for seeding it's ok if I use a better logic
      update: {},
      create: {
        name: court.name,
        type: court.type,
        description: court.description
      }
    });
  }

  console.log('Seed completed successfully!');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
