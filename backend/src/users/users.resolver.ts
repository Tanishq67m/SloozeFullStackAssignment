import { Resolver, Query, ObjectType, Field } from '@nestjs/graphql';
import { UseGuards } from '@nestjs/common';
import { RolesGuard } from '../common/roles.guard';
import { Roles, Role } from '../common/roles.decorator';
import { CurrentUser } from '../common/current-user.decorator';
import { PrismaService } from '../prisma/prisma.service';

@ObjectType()
class UserType {
  @Field() id: string;
  @Field() name: string;
  @Field() email: string;
  @Field() role: string;
  @Field(() => String, { nullable: true }) country?: string | null;
}

@Resolver()
@UseGuards(RolesGuard)
export class UsersResolver {
  constructor(private prisma: PrismaService) {}

  @Query(() => UserType)
  @Roles(Role.ADMIN, Role.MANAGER, Role.MEMBER)
  me(@CurrentUser() user: any): UserType {
    return {
      id: user.sub,
      name: user.name,
      email: user.email,
      role: user.role,
      country: user.country,
    };
  }

  // Returns all users — used by identity switcher on the frontend
  @Query(() => [UserType])
  @Roles(Role.ADMIN, Role.MANAGER, Role.MEMBER)
  async teamMembers(): Promise<UserType[]> {
    return this.prisma.user.findMany({
      select: { id: true, name: true, email: true, role: true, country: true },
      orderBy: [{ role: 'asc' }, { name: 'asc' }],
    });
  }
}
