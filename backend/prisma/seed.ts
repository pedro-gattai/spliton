/* eslint-disable @typescript-eslint/no-misused-promises */
import { PrismaClient } from '@prisma/client';
import * as dotenv from 'dotenv';
import * as fs from 'fs';
import * as path from 'path';

// Carregar variáveis de ambiente
dotenv.config({ path: '.env' });

// Verificar variáveis de ambiente
console.log('🔍 Verificando variáveis de ambiente...');
console.log('DATABASE_URL:', process.env.DATABASE_URL);
console.log('NODE_ENV:', process.env.NODE_ENV);
console.log('Diretório atual:', process.cwd());
console.log('Arquivo .env existe:', fs.existsSync('.env'));
console.log('Caminho completo do .env:', path.resolve('.env'));

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Iniciando seed completo do banco de dados...');

  // Limpar dados existentes
  console.log('🧹 Limpando dados existentes...');
  await prisma.settlement.deleteMany();
  await prisma.expenseParticipant.deleteMany();
  await prisma.expense.deleteMany();
  await prisma.balance.deleteMany();
  await prisma.groupMember.deleteMany();
  await prisma.group.deleteMany();
  await prisma.user.deleteMany();

  // ===== CRIAR USUÁRIOS =====
  console.log('👥 Criando usuários...');

  const users = await Promise.all([
    prisma.user.create({
      data: {
        telegramId: BigInt(123456789),
        username: 'joao_silva',
        firstName: 'João',
        lastName: 'Silva',
        tonWalletAddress:
          'EQD123456789012345678901234567890123456789012345678901234567890',
      },
    }),
    prisma.user.create({
      data: {
        telegramId: BigInt(987654321),
        username: 'maria_santos',
        firstName: 'Maria',
        lastName: 'Santos',
        tonWalletAddress:
          'EQD987654321098765432109876543210987654321098765432109876543210',
      },
    }),
    prisma.user.create({
      data: {
        telegramId: BigInt(555666777),
        username: 'pedro_oliveira',
        firstName: 'Pedro',
        lastName: 'Oliveira',
        tonWalletAddress:
          'EQD555666777888999000111222333444555666777888999000111222333444',
      },
    }),
    prisma.user.create({
      data: {
        telegramId: BigInt(111222333),
        username: 'ana_costa',
        firstName: 'Ana',
        lastName: 'Costa',
        tonWalletAddress:
          'EQD111222333444555666777888999000111222333444555666777888999000',
      },
    }),
    prisma.user.create({
      data: {
        telegramId: BigInt(444555666),
        username: 'carlos_lima',
        firstName: 'Carlos',
        lastName: 'Lima',
        tonWalletAddress:
          'EQD444555666777888999000111222333444555666777888999000111222333',
      },
    }),
    prisma.user.create({
      data: {
        telegramId: BigInt(777888999),
        username: 'julia_ferreira',
        firstName: 'Júlia',
        lastName: 'Ferreira',
        tonWalletAddress:
          'EQD777888999000111222333444555666777888999000111222333444555666',
      },
    }),
  ]);

  const [joao, maria, pedro, ana, carlos, julia] = users;
  console.log('✅ Usuários criados:', users.length);

  // ===== CRIAR GRUPOS =====
  console.log('🏠 Criando grupos...');

  const groups = await Promise.all([
    prisma.group.create({
      data: {
        name: 'Viagem para a Praia',
        description:
          'Grupo para dividir despesas da viagem de fim de semana na praia',
        createdBy: joao.id,
        inviteCode: 'PRAIA2024',
      },
    }),
    prisma.group.create({
      data: {
        name: 'Apartamento Compartilhado',
        description: 'Despesas do apartamento que dividimos',
        createdBy: maria.id,
        inviteCode: 'APTO123',
      },
    }),
    prisma.group.create({
      data: {
        name: 'Grupo de Estudos',
        description: 'Despesas de material e cursos de estudo',
        createdBy: pedro.id,
        inviteCode: 'ESTUDOS456',
      },
    }),
    prisma.group.create({
      data: {
        name: 'Festa de Aniversário',
        description: 'Organização da festa de aniversário da Ana',
        createdBy: ana.id,
        inviteCode: 'FESTA789',
      },
    }),
  ]);

  const [grupoPraia, grupoApto, grupoEstudos, grupoFesta] = groups;
  console.log('✅ Grupos criados:', groups.length);

  // ===== ADICIONAR MEMBROS AOS GRUPOS =====
  console.log('👥 Adicionando membros aos grupos...');

  // Grupo Praia: João (admin), Maria, Pedro, Ana
  await prisma.groupMember.createMany({
    data: [
      { groupId: grupoPraia.id, userId: joao.id, role: 'ADMIN' },
      { groupId: grupoPraia.id, userId: maria.id, role: 'MEMBER' },
      { groupId: grupoPraia.id, userId: pedro.id, role: 'MEMBER' },
      { groupId: grupoPraia.id, userId: ana.id, role: 'MEMBER' },
    ],
  });

  // Grupo Apartamento: Maria (admin), João, Carlos
  await prisma.groupMember.createMany({
    data: [
      { groupId: grupoApto.id, userId: maria.id, role: 'ADMIN' },
      { groupId: grupoApto.id, userId: joao.id, role: 'MEMBER' },
      { groupId: grupoApto.id, userId: carlos.id, role: 'MEMBER' },
    ],
  });

  // Grupo Estudos: Pedro (admin), Ana, Júlia
  await prisma.groupMember.createMany({
    data: [
      { groupId: grupoEstudos.id, userId: pedro.id, role: 'ADMIN' },
      { groupId: grupoEstudos.id, userId: ana.id, role: 'MEMBER' },
      { groupId: grupoEstudos.id, userId: julia.id, role: 'MEMBER' },
    ],
  });

  // Grupo Festa: Ana (admin), Maria, Júlia, Carlos
  await prisma.groupMember.createMany({
    data: [
      { groupId: grupoFesta.id, userId: ana.id, role: 'ADMIN' },
      { groupId: grupoFesta.id, userId: maria.id, role: 'MEMBER' },
      { groupId: grupoFesta.id, userId: julia.id, role: 'MEMBER' },
      { groupId: grupoFesta.id, userId: carlos.id, role: 'MEMBER' },
    ],
  });

  console.log('✅ Membros adicionados aos grupos');

  // ===== CRIAR DESPESAS =====
  console.log('💰 Criando despesas...');

  const expenses = await Promise.all([
    // Despesas do Grupo Praia
    prisma.expense.create({
      data: {
        groupId: grupoPraia.id,
        payerId: joao.id,
        description: 'Almoço no restaurante da praia',
        amount: 200.0,
        category: 'Alimentação',
        splitType: 'EQUAL',
      },
    }),
    prisma.expense.create({
      data: {
        groupId: grupoPraia.id,
        payerId: maria.id,
        description: 'Combustível para a viagem',
        amount: 150.0,
        category: 'Transporte',
        splitType: 'EQUAL',
      },
    }),
    prisma.expense.create({
      data: {
        groupId: grupoPraia.id,
        payerId: pedro.id,
        description: 'Passeio de barco',
        amount: 300.0,
        category: 'Lazer',
        splitType: 'CUSTOM',
      },
    }),

    // Despesas do Grupo Apartamento
    prisma.expense.create({
      data: {
        groupId: grupoApto.id,
        payerId: maria.id,
        description: 'Conta de luz',
        amount: 120.0,
        category: 'Moradia',
        splitType: 'EQUAL',
      },
    }),
    prisma.expense.create({
      data: {
        groupId: grupoApto.id,
        payerId: joao.id,
        description: 'Internet',
        amount: 89.9,
        category: 'Moradia',
        splitType: 'EQUAL',
      },
    }),
    prisma.expense.create({
      data: {
        groupId: grupoApto.id,
        payerId: carlos.id,
        description: 'Limpeza do apartamento',
        amount: 80.0,
        category: 'Moradia',
        splitType: 'EQUAL',
      },
    }),

    // Despesas do Grupo Estudos
    prisma.expense.create({
      data: {
        groupId: grupoEstudos.id,
        payerId: pedro.id,
        description: 'Curso online de programação',
        amount: 299.0,
        category: 'Educação',
        splitType: 'EQUAL',
      },
    }),
    prisma.expense.create({
      data: {
        groupId: grupoEstudos.id,
        payerId: ana.id,
        description: 'Material de estudo',
        amount: 75.5,
        category: 'Educação',
        splitType: 'EQUAL',
      },
    }),

    // Despesas do Grupo Festa
    prisma.expense.create({
      data: {
        groupId: grupoFesta.id,
        payerId: ana.id,
        description: 'Decoração da festa',
        amount: 180.0,
        category: 'Evento',
        splitType: 'EQUAL',
      },
    }),
    prisma.expense.create({
      data: {
        groupId: grupoFesta.id,
        payerId: maria.id,
        description: 'Bolo de aniversário',
        amount: 120.0,
        category: 'Alimentação',
        splitType: 'EQUAL',
      },
    }),
    prisma.expense.create({
      data: {
        groupId: grupoFesta.id,
        payerId: julia.id,
        description: 'Bebidas',
        amount: 200.0,
        category: 'Alimentação',
        splitType: 'EQUAL',
      },
    }),
  ]);

  const [
    almocoPraia,
    combustivel,
    passeioBarco,
    contaLuz,
    internet,
    limpeza,
    cursoProgramacao,
    materialEstudo,
    decoracao,
    bolo,
    bebidas,
  ] = expenses;

  console.log('✅ Despesas criadas:', expenses.length);

  // ===== ADICIONAR PARTICIPANTES DAS DESPESAS =====
  console.log('👥 Adicionando participantes das despesas...');

  // Almoço na praia (4 pessoas, R$ 50 cada)
  await prisma.expenseParticipant.createMany({
    data: [
      {
        expenseId: almocoPraia.id,
        userId: joao.id,
        amountOwed: 50.0,
        isSettled: true,
        settledAt: new Date(),
      },
      {
        expenseId: almocoPraia.id,
        userId: maria.id,
        amountOwed: 50.0,
        isSettled: false,
      },
      {
        expenseId: almocoPraia.id,
        userId: pedro.id,
        amountOwed: 50.0,
        isSettled: false,
      },
      {
        expenseId: almocoPraia.id,
        userId: ana.id,
        amountOwed: 50.0,
        isSettled: false,
      },
    ],
  });

  // Combustível (4 pessoas, R$ 37.50 cada)
  await prisma.expenseParticipant.createMany({
    data: [
      {
        expenseId: combustivel.id,
        userId: joao.id,
        amountOwed: 37.5,
        isSettled: false,
      },
      {
        expenseId: combustivel.id,
        userId: maria.id,
        amountOwed: 37.5,
        isSettled: true,
        settledAt: new Date(),
      },
      {
        expenseId: combustivel.id,
        userId: pedro.id,
        amountOwed: 37.5,
        isSettled: false,
      },
      {
        expenseId: combustivel.id,
        userId: ana.id,
        amountOwed: 37.5,
        isSettled: false,
      },
    ],
  });

  // Passeio de barco (divisão customizada)
  await prisma.expenseParticipant.createMany({
    data: [
      {
        expenseId: passeioBarco.id,
        userId: joao.id,
        amountOwed: 100.0,
        isSettled: false,
      },
      {
        expenseId: passeioBarco.id,
        userId: maria.id,
        amountOwed: 80.0,
        isSettled: false,
      },
      {
        expenseId: passeioBarco.id,
        userId: pedro.id,
        amountOwed: 120.0,
        isSettled: true,
        settledAt: new Date(),
      },
      {
        expenseId: passeioBarco.id,
        userId: ana.id,
        amountOwed: 0.0,
        isSettled: true,
        settledAt: new Date(),
      },
    ],
  });

  // Conta de luz (3 pessoas, R$ 40 cada)
  await prisma.expenseParticipant.createMany({
    data: [
      {
        expenseId: contaLuz.id,
        userId: maria.id,
        amountOwed: 40.0,
        isSettled: true,
        settledAt: new Date(),
      },
      {
        expenseId: contaLuz.id,
        userId: joao.id,
        amountOwed: 40.0,
        isSettled: false,
      },
      {
        expenseId: contaLuz.id,
        userId: carlos.id,
        amountOwed: 40.0,
        isSettled: false,
      },
    ],
  });

  // Internet (3 pessoas, R$ 29.97 cada)
  await prisma.expenseParticipant.createMany({
    data: [
      {
        expenseId: internet.id,
        userId: joao.id,
        amountOwed: 29.97,
        isSettled: true,
        settledAt: new Date(),
      },
      {
        expenseId: internet.id,
        userId: maria.id,
        amountOwed: 29.97,
        isSettled: false,
      },
      {
        expenseId: internet.id,
        userId: carlos.id,
        amountOwed: 29.97,
        isSettled: false,
      },
    ],
  });

  // Limpeza (3 pessoas, R$ 26.67 cada)
  await prisma.expenseParticipant.createMany({
    data: [
      {
        expenseId: limpeza.id,
        userId: maria.id,
        amountOwed: 26.67,
        isSettled: false,
      },
      {
        expenseId: limpeza.id,
        userId: joao.id,
        amountOwed: 26.67,
        isSettled: false,
      },
      {
        expenseId: limpeza.id,
        userId: carlos.id,
        amountOwed: 26.67,
        isSettled: true,
        settledAt: new Date(),
      },
    ],
  });

  // Curso de programação (3 pessoas, R$ 99.67 cada)
  await prisma.expenseParticipant.createMany({
    data: [
      {
        expenseId: cursoProgramacao.id,
        userId: pedro.id,
        amountOwed: 99.67,
        isSettled: true,
        settledAt: new Date(),
      },
      {
        expenseId: cursoProgramacao.id,
        userId: ana.id,
        amountOwed: 99.67,
        isSettled: false,
      },
      {
        expenseId: cursoProgramacao.id,
        userId: julia.id,
        amountOwed: 99.67,
        isSettled: false,
      },
    ],
  });

  // Material de estudo (3 pessoas, R$ 25.17 cada)
  await prisma.expenseParticipant.createMany({
    data: [
      {
        expenseId: materialEstudo.id,
        userId: pedro.id,
        amountOwed: 25.17,
        isSettled: false,
      },
      {
        expenseId: materialEstudo.id,
        userId: ana.id,
        amountOwed: 25.17,
        isSettled: true,
        settledAt: new Date(),
      },
      {
        expenseId: materialEstudo.id,
        userId: julia.id,
        amountOwed: 25.17,
        isSettled: false,
      },
    ],
  });

  // Decoração da festa (4 pessoas, R$ 45 cada)
  await prisma.expenseParticipant.createMany({
    data: [
      {
        expenseId: decoracao.id,
        userId: ana.id,
        amountOwed: 45.0,
        isSettled: true,
        settledAt: new Date(),
      },
      {
        expenseId: decoracao.id,
        userId: maria.id,
        amountOwed: 45.0,
        isSettled: false,
      },
      {
        expenseId: decoracao.id,
        userId: julia.id,
        amountOwed: 45.0,
        isSettled: false,
      },
      {
        expenseId: decoracao.id,
        userId: carlos.id,
        amountOwed: 45.0,
        isSettled: false,
      },
    ],
  });

  // Bolo (4 pessoas, R$ 30 cada)
  await prisma.expenseParticipant.createMany({
    data: [
      {
        expenseId: bolo.id,
        userId: ana.id,
        amountOwed: 30.0,
        isSettled: false,
      },
      {
        expenseId: bolo.id,
        userId: maria.id,
        amountOwed: 30.0,
        isSettled: true,
        settledAt: new Date(),
      },
      {
        expenseId: bolo.id,
        userId: julia.id,
        amountOwed: 30.0,
        isSettled: false,
      },
      {
        expenseId: bolo.id,
        userId: carlos.id,
        amountOwed: 30.0,
        isSettled: false,
      },
    ],
  });

  // Bebidas (4 pessoas, R$ 50 cada)
  await prisma.expenseParticipant.createMany({
    data: [
      {
        expenseId: bebidas.id,
        userId: ana.id,
        amountOwed: 50.0,
        isSettled: false,
      },
      {
        expenseId: bebidas.id,
        userId: maria.id,
        amountOwed: 50.0,
        isSettled: false,
      },
      {
        expenseId: bebidas.id,
        userId: julia.id,
        amountOwed: 50.0,
        isSettled: true,
        settledAt: new Date(),
      },
      {
        expenseId: bebidas.id,
        userId: carlos.id,
        amountOwed: 50.0,
        isSettled: false,
      },
    ],
  });

  console.log('✅ Participantes das despesas adicionados');

  // ===== CRIAR LIQUIDAÇÕES (SETTLEMENTS) =====
  console.log('💸 Criando liquidações...');

  const settlements = await Promise.all([
    // Liquidação do grupo praia - Maria paga para João
    prisma.settlement.create({
      data: {
        groupId: grupoPraia.id,
        fromUserId: maria.id,
        toUserId: joao.id,
        amount: 50.0,
        status: 'COMPLETED',
        tonTransactionHash:
          'TON123456789012345678901234567890123456789012345678901234567890',
        completedAt: new Date(),
      },
    }),

    // Liquidação do grupo apartamento - Carlos paga para Maria
    prisma.settlement.create({
      data: {
        groupId: grupoApto.id,
        fromUserId: carlos.id,
        toUserId: maria.id,
        amount: 40.0,
        status: 'PENDING',
      },
    }),

    // Liquidação do grupo estudos - Júlia paga para Pedro
    prisma.settlement.create({
      data: {
        groupId: grupoEstudos.id,
        fromUserId: julia.id,
        toUserId: pedro.id,
        amount: 99.67,
        status: 'PROCESSING',
        tonTransactionHash:
          'TON987654321098765432109876543210987654321098765432109876543210',
      },
    }),

    // Liquidação da festa - Carlos paga para Ana
    prisma.settlement.create({
      data: {
        groupId: grupoFesta.id,
        fromUserId: carlos.id,
        toUserId: ana.id,
        amount: 45.0,
        status: 'FAILED',
        tonTransactionHash:
          'TON555666777888999000111222333444555666777888999000111222333444',
      },
    }),
  ]);

  console.log('✅ Liquidações criadas:', settlements.length);

  // ===== CRIAR SALDOS =====
  console.log('💰 Criando saldos...');

  await prisma.balance.createMany({
    data: [
      // Saldos do Grupo Praia
      { groupId: grupoPraia.id, userId: joao.id, balance: 87.5 }, // João pagou 200+150, deve receber 50+37.50+100
      { groupId: grupoPraia.id, userId: maria.id, balance: -37.5 }, // Maria pagou 150, deve 50+37.50+80
      { groupId: grupoPraia.id, userId: pedro.id, balance: -170.0 }, // Pedro pagou 300, deve 50+37.50+120
      { groupId: grupoPraia.id, userId: ana.id, balance: -50.0 }, // Ana deve 50+37.50+80

      // Saldos do Grupo Apartamento
      { groupId: grupoApto.id, userId: maria.id, balance: 40.0 }, // Maria pagou 120, deve receber 40
      { groupId: grupoApto.id, userId: joao.id, balance: -29.97 }, // João pagou 89.90, deve 40+29.97
      { groupId: grupoApto.id, userId: carlos.id, balance: -10.03 }, // Carlos pagou 80, deve 40+29.97

      // Saldos do Grupo Estudos
      { groupId: grupoEstudos.id, userId: pedro.id, balance: 74.5 }, // Pedro pagou 299, deve receber 99.67+25.17
      { groupId: grupoEstudos.id, userId: ana.id, balance: -25.17 }, // Ana pagou 75.50, deve 99.67+25.17
      { groupId: grupoEstudos.id, userId: julia.id, balance: -99.67 }, // Júlia deve 99.67+25.17

      // Saldos do Grupo Festa
      { groupId: grupoFesta.id, userId: ana.id, balance: 45.0 }, // Ana pagou 180, deve receber 45+30+50
      { groupId: grupoFesta.id, userId: maria.id, balance: -15.0 }, // Maria pagou 120, deve 45+30+50
      { groupId: grupoFesta.id, userId: julia.id, balance: -15.0 }, // Júlia pagou 200, deve 45+30+50
      { groupId: grupoFesta.id, userId: carlos.id, balance: -15.0 }, // Carlos deve 45+30+50
    ],
  });

  console.log('✅ Saldos criados');

  // ===== RESUMO FINAL =====
  console.log('\n📊 RESUMO DO SEED:');
  console.log('==================');
  console.log(`👥 Usuários: ${users.length}`);
  console.log(`🏠 Grupos: ${groups.length}`);
  console.log(`💰 Despesas: ${expenses.length}`);
  console.log(`💸 Liquidações: ${settlements.length}`);
  console.log(`📈 Saldos calculados para todos os grupos`);

  console.log('\n🎯 Cenários criados:');
  console.log('- Grupo de viagem com 4 pessoas e 3 despesas');
  console.log('- Apartamento compartilhado com 3 pessoas e 3 despesas');
  console.log('- Grupo de estudos com 3 pessoas e 2 despesas');
  console.log('- Festa de aniversário com 4 pessoas e 3 despesas');
  console.log('- Diferentes tipos de divisão (equal e custom)');
  console.log(
    '- Liquidações em diferentes status (pending, processing, completed, failed)',
  );
  console.log('- Saldos positivos e negativos para todos os usuários');

  console.log('\n🎉 Seed completo concluído com sucesso!');
  console.log(
    '💡 Use "npm run prisma:studio" para visualizar os dados no navegador',
  );
}

main()
  .catch((e) => {
    console.error('❌ Erro durante o seed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
