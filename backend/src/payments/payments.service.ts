import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class PaymentsService {
  constructor(private prisma: PrismaService) {}

  getMyPaymentMethods(userId: string) {
    return this.prisma.paymentMethod.findMany({
      where: { userId },
      orderBy: [{ isDefault: 'desc' }, { createdAt: 'desc' }],
    });
  }

  async addPaymentMethod(userId: string, type: string, last4: string, provider: string, isDefault: boolean) {
    if (isDefault) {
      // Unset existing default
      await this.prisma.paymentMethod.updateMany({
        where: { userId, isDefault: true },
        data: { isDefault: false },
      });
    }
    return this.prisma.paymentMethod.create({
      data: { userId, type, last4, provider, isDefault },
    });
  }

  async removePaymentMethod(id: string, userId: string) {
    const method = await this.prisma.paymentMethod.findUnique({ where: { id } });
    if (!method) throw new NotFoundException('Payment method not found');
    if (method.userId !== userId) throw new ForbiddenException('Not your payment method');
    return this.prisma.paymentMethod.delete({ where: { id } });
  }

  async setDefaultPaymentMethod(id: string, userId: string) {
    const method = await this.prisma.paymentMethod.findUnique({ where: { id } });
    if (!method) throw new NotFoundException('Payment method not found');
    if (method.userId !== userId) throw new ForbiddenException('Not your payment method');

    await this.prisma.paymentMethod.updateMany({
      where: { userId, isDefault: true },
      data: { isDefault: false },
    });
    return this.prisma.paymentMethod.update({
      where: { id },
      data: { isDefault: true },
    });
  }
}
