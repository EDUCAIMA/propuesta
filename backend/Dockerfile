FROM node:20-slim

# Instalar OpenSSL necesario para el motor de Prisma Client
RUN apt-get update && apt-get install -y openssl && rm -rf /var/lib/apt/lists/*

WORKDIR /usr/src/app

COPY package*.json ./
COPY prisma ./prisma/

RUN npm install

COPY . .

RUN npx prisma generate

EXPOSE 4001

# Sincronizar esquema, sembrar usuarios e iniciar el backend
CMD ["sh", "-c", "npx prisma db push && node prisma/seedUsers.js && npm start"]
