import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateExpenseDto, UpdateExpenseDto } from './dto';

@Injectable()
export class ExpensesService {
  constructor(private readonly prisma: PrismaService) {}

  async getExpenses() {
    return await this.prisma.expense.findMany({
      include: {
        group: true,
        payer: true,
        participants: {
          include: {
            user: true,
          },
        },
      },
    });
  }

  async getExpenseById(id: string) {
    const expense = await this.prisma.expense.findUnique({
      where: { id },
      include: {
        group: true,
        payer: true,
        participants: {
          include: {
            user: true,
          },
        },
      },
    });

    if (!expense) {
      throw new NotFoundException(`Expense with ID ${id} not found`);
    }

    return expense;
  }

  async getExpensesByGroup(groupId: string) {
    return await this.prisma.expense.findMany({
      where: { groupId },
      include: {
        group: true,
        payer: true,
        participants: {
          include: {
            user: true,
          },
        },
      },
    });
  }

  async getExpensesByUser(userId: string) {
    return await this.prisma.expense.findMany({
      where: {
        OR: [
          { payerId: userId },
          {
            participants: {
              some: {
                userId: userId,
              },
            },
          },
        ],
      },
      include: {
        group: true,
        payer: true,
        participants: {
          include: {
            user: true,
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    });
  }

  async createExpense(createExpenseDto: CreateExpenseDto) {
    const { participants, ...expenseData } = createExpenseDto;

    return await this.prisma.$transaction(async prisma => {
      // Create the expense
      const expense = await prisma.expense.create({
        data: expenseData,
        include: {
          group: true,
          payer: true,
        },
      });

      // Create participants
      if (participants && participants.length > 0) {
        await prisma.expenseParticipant.createMany({
          data: participants.map(participant => ({
            expenseId: expense.id,
            userId: participant.userId,
            amountOwed: participant.amountOwed,
          })),
        });
      }

      // Return the complete expense with participants
      return await prisma.expense.findUnique({
        where: { id: expense.id },
        include: {
          group: true,
          payer: true,
          participants: {
            include: {
              user: true,
            },
          },
        },
      });
    });
  }

  async updateExpense(id: string, updateExpenseDto: UpdateExpenseDto) {
    const { participants, ...expenseData } = updateExpenseDto;

    // Check if expense exists
    const existingExpense = await this.prisma.expense.findUnique({
      where: { id },
    });

    if (!existingExpense) {
      throw new NotFoundException(`Expense with ID ${id} not found`);
    }

    return await this.prisma.$transaction(async prisma => {
      // Update the expense
      await prisma.expense.update({
        where: { id },
        data: expenseData,
        include: {
          group: true,
          payer: true,
        },
      });

      // Update participants if provided
      if (participants) {
        // Delete existing participants
        await prisma.expenseParticipant.deleteMany({
          where: { expenseId: id },
        });

        // Create new participants
        if (participants.length > 0) {
          await prisma.expenseParticipant.createMany({
            data: participants.map(participant => ({
              expenseId: id,
              userId: participant.userId,
              amountOwed: participant.amountOwed,
            })),
          });
        }
      }

      // Return the complete expense with participants
      return await prisma.expense.findUnique({
        where: { id },
        include: {
          group: true,
          payer: true,
          participants: {
            include: {
              user: true,
            },
          },
        },
      });
    });
  }

  async updateExpenseParticipant(
    expenseId: string,
    participantId: string,
    data: { isSettled: boolean },
  ) {
    // Check if expense exists
    const existingExpense = await this.prisma.expense.findUnique({
      where: { id: expenseId },
    });

    if (!existingExpense) {
      throw new NotFoundException(`Expense with ID ${expenseId} not found`);
    }

    // Check if participant exists
    const existingParticipant = await this.prisma.expenseParticipant.findUnique(
      {
        where: { id: participantId },
      },
    );

    if (!existingParticipant) {
      throw new NotFoundException(
        `Participant with ID ${participantId} not found`,
      );
    }

    // Update participant
    await this.prisma.expenseParticipant.update({
      where: { id: participantId },
      data: {
        isSettled: data.isSettled,
        settledAt: data.isSettled ? new Date() : null,
      },
    });

    // Return the updated expense
    return await this.getExpenseById(expenseId);
  }

  async deleteExpense(id: string) {
    // Check if expense exists
    const existingExpense = await this.prisma.expense.findUnique({
      where: { id },
    });

    if (!existingExpense) {
      throw new NotFoundException(`Expense with ID ${id} not found`);
    }

    // Delete the expense (participants will be deleted automatically due to cascade)
    await this.prisma.expense.delete({
      where: { id },
    });

    return { message: 'Expense deleted successfully' };
  }
}
