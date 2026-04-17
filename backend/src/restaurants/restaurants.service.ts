import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { Country } from '../common/roles.decorator';

@Injectable()
export class RestaurantsService {
  constructor(private prisma: PrismaService) {}

  findAll(country?: Country) {
    return this.prisma.restaurant.findMany({
      where: {
        isActive: true,
        ...(country ? { country } : {}),
      },
      include: { menuItems: { where: { isAvailable: true } } },
      orderBy: { rating: 'desc' },
    });
  }

  findOne(id: string) {
    return this.prisma.restaurant.findUnique({
      where: { id },
      include: { menuItems: { where: { isAvailable: true } } },
    });
  }
}
