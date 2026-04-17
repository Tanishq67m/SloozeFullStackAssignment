import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { Country } from '../common/roles.decorator';

interface OrderItemInput {
  menuItemId: string;
  quantity: number;
}

@Injectable()
export class OrdersService {
  constructor(private prisma: PrismaService) {}

  async findAll(userId: string, role: string, country?: string) {
    // Admin sees all orders; manager sees country orders; member sees own orders
    const where: any = {};
    if (role === 'ADMIN') {
      // no filter
    } else if (role === 'MANAGER') {
      where.country = country;
    } else {
      where.userId = userId;
    }

    return this.prisma.order.findMany({
      where,
      include: {
        user: { select: { id: true, name: true, email: true, role: true, country: true } },
        restaurant: true,
        orderItems: { include: { menuItem: true } },
        payment: { include: { paymentMethod: true } },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async findOne(id: string) {
    return this.prisma.order.findUnique({
      where: { id },
      include: {
        user: { select: { id: true, name: true, email: true, role: true, country: true } },
        restaurant: true,
        orderItems: { include: { menuItem: true } },
        payment: { include: { paymentMethod: true } },
      },
    });
  }

  async createOrder(userId: string, restaurantId: string, items: OrderItemInput[], notes?: string) {
    const restaurant = await this.prisma.restaurant.findUnique({ where: { id: restaurantId } });
    if (!restaurant) throw new NotFoundException('Restaurant not found');

    // Calculate total from actual menu item prices
    const menuItems = await this.prisma.menuItem.findMany({
      where: { id: { in: items.map((i) => i.menuItemId) }, isAvailable: true },
    });

    if (menuItems.length !== items.length) {
      throw new BadRequestException('One or more menu items are unavailable or not found');
    }

    const orderItemsData = items.map((item) => {
      const menuItem = menuItems.find((m) => m.id === item.menuItemId)!;
      return {
        menuItemId: item.menuItemId,
        quantity: item.quantity,
        unitPrice: menuItem.price,
        totalPrice: menuItem.price * item.quantity,
      };
    });

    const totalAmount = orderItemsData.reduce((sum, i) => sum + i.totalPrice, 0);

    return this.prisma.order.create({
      data: {
        userId,
        restaurantId,
        country: restaurant.country,
        status: 'PENDING',
        totalAmount,
        notes,
        orderItems: { create: orderItemsData },
      },
      include: {
        user: { select: { id: true, name: true, email: true, role: true, country: true } },
        restaurant: true,
        orderItems: { include: { menuItem: true } },
        payment: true,
      },
    });
  }

  async cancelOrder(id: string) {
    const order = await this.prisma.order.findUnique({ where: { id } });
    if (!order) throw new NotFoundException('Order not found');
    if (['DELIVERED', 'CANCELLED'].includes(order.status)) {
      throw new BadRequestException(`Cannot cancel an order with status: ${order.status}`);
    }
    return this.prisma.order.update({
      where: { id },
      data: { status: 'CANCELLED' },
      include: {
        restaurant: true,
        orderItems: { include: { menuItem: true } },
        payment: true,
      },
    });
  }

  async placeOrder(orderId: string, paymentMethodId: string) {
    const order = await this.prisma.order.findUnique({
      where: { id: orderId },
      include: { payment: true },
    });
    if (!order) throw new NotFoundException('Order not found');
    if (order.status !== 'PENDING') {
      throw new BadRequestException('Only PENDING orders can be placed');
    }
    if (order.payment) throw new BadRequestException('Order already has a payment');

    const paymentMethod = await this.prisma.paymentMethod.findUnique({ where: { id: paymentMethodId } });
    if (!paymentMethod) throw new NotFoundException('Payment method not found');

    // Simulate payment success
    const [updatedOrder] = await this.prisma.$transaction([
      this.prisma.order.update({
        where: { id: orderId },
        data: { status: 'CONFIRMED' },
        include: {
          restaurant: true,
          orderItems: { include: { menuItem: true } },
          payment: { include: { paymentMethod: true } },
        },
      }),
      this.prisma.payment.create({
        data: {
          orderId,
          paymentMethodId,
          amount: order.totalAmount,
          status: 'COMPLETED',
        },
      }),
    ]);

    return updatedOrder;
  }
}
