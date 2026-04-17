import {
  Resolver, Query, Mutation, Args, Subscription,
  ObjectType, Field, Float, InputType, Int,
} from '@nestjs/graphql';
import { UseGuards, ForbiddenException } from '@nestjs/common';
import { PubSub } from 'graphql-subscriptions';
import { OrdersService } from './orders.service';
import { RolesGuard } from '../common/roles.guard';
import { CountryGuard } from '../common/country.guard';
import { Roles, Role } from '../common/roles.decorator';
import { CurrentUser } from '../common/current-user.decorator';
import { MenuItemType, RestaurantType } from '../restaurants/restaurants.resolver';

const pubSub = new PubSub();
const ORDER_PLACED_EVENT = 'orderPlaced';

// ─── GraphQL Types ────────────────────────────────────────────────────────────

@ObjectType()
class UserInOrder {
  @Field() id: string;
  @Field() name: string;
  @Field() email: string;
  @Field() role: string;
  @Field({ nullable: true }) country?: string;
}

@ObjectType()
class OrderItemType {
  @Field() id: string;
  @Field(() => Int) quantity: number;
  @Field(() => Float) unitPrice: number;
  @Field(() => Float) totalPrice: number;
  @Field(() => MenuItemType) menuItem: MenuItemType;
}

@ObjectType()
class PaymentMethodType {
  @Field() id: string;
  @Field() type: string;
  @Field() last4: string;
  @Field() provider: string;
  @Field(() => Boolean) isDefault: boolean;
}

@ObjectType()
class PaymentType {
  @Field() id: string;
  @Field(() => Float) amount: number;
  @Field() status: string;
  @Field() transactionRef: string;
  @Field(() => PaymentMethodType, { nullable: true }) paymentMethod?: PaymentMethodType;
}

@ObjectType()
export class OrderType {
  @Field() id: string;
  @Field() status: string;
  @Field(() => Float) totalAmount: number;
  @Field() country: string;
  @Field({ nullable: true }) notes?: string;
  @Field() createdAt: string;
  @Field(() => UserInOrder) user: UserInOrder;
  @Field(() => RestaurantType) restaurant: RestaurantType;
  @Field(() => [OrderItemType]) orderItems: OrderItemType[];
  @Field(() => PaymentType, { nullable: true }) payment?: PaymentType;
}

// ─── Input Types ──────────────────────────────────────────────────────────────

@InputType()
class OrderItemInput {
  @Field() menuItemId: string;
  @Field(() => Int) quantity: number;
}

// ─── Resolver ─────────────────────────────────────────────────────────────────

@Resolver()
@UseGuards(RolesGuard)
export class OrdersResolver {
  constructor(private ordersService: OrdersService) {}

  // VIEW ORDERS — all roles, country-scoped for non-admins
  @Query(() => [OrderType])
  @Roles(Role.ADMIN, Role.MANAGER, Role.MEMBER)
  async orders(@CurrentUser() user: any) {
    return this.ordersService.findAll(user.sub, user.role, user.country);
  }

  @Query(() => OrderType, { nullable: true })
  @Roles(Role.ADMIN, Role.MANAGER, Role.MEMBER)
  async order(@Args('id') id: string, @CurrentUser() user: any) {
    const found = await this.ordersService.findOne(id);
    if (!found) return null;
    CountryGuard.assertCountryAccess(user, found.country);
    // Members can only see their own orders
    if (user.role === Role.MEMBER && found.user.id !== user.sub) {
      throw new ForbiddenException('You can only view your own orders');
    }
    return found;
  }

  // CREATE ORDER — all roles can create
  @Mutation(() => OrderType)
  @Roles(Role.ADMIN, Role.MANAGER, Role.MEMBER)
  async createOrder(
    @Args('restaurantId') restaurantId: string,
    @Args('items', { type: () => [OrderItemInput] }) items: OrderItemInput[],
    @Args('notes', { nullable: true }) notes: string,
    @CurrentUser() user: any,
  ) {
    return this.ordersService.createOrder(user.sub, restaurantId, items, notes);
  }

  // PLACE ORDER (checkout + pay) — ADMIN and MANAGER only
  @Mutation(() => OrderType)
  @Roles(Role.ADMIN, Role.MANAGER)
  async placeOrder(
    @Args('orderId') orderId: string,
    @Args('paymentMethodId') paymentMethodId: string,
    @CurrentUser() user: any,
  ) {
    const order = await this.ordersService.findOne(orderId);
    if (!order) throw new ForbiddenException('Order not found');
    CountryGuard.assertCountryAccess(user, order.country);

    const placed = await this.ordersService.placeOrder(orderId, paymentMethodId);

    // 🔔 Publish real-time event — scoped by country
    pubSub.publish(ORDER_PLACED_EVENT, {
      orderPlaced: {
        ...placed,
        createdAt: placed.createdAt?.toString(),
      },
      country: placed.country, // Used in subscription filter
    });

    return placed;
  }

  // CANCEL ORDER — ADMIN and MANAGER only
  @Mutation(() => OrderType)
  @Roles(Role.ADMIN, Role.MANAGER)
  async cancelOrder(@Args('orderId') orderId: string, @CurrentUser() user: any) {
    const order = await this.ordersService.findOne(orderId);
    if (!order) throw new ForbiddenException('Order not found');
    CountryGuard.assertCountryAccess(user, order.country);
    return this.ordersService.cancelOrder(orderId);
  }

  // 🔔 REAL-TIME SUBSCRIPTION — country-scoped
  // Managers/Admins subscribe and only receive events for their country
  @Subscription(() => OrderType, {
    filter(payload, _variables, context) {
      const user = context?.req?.user ?? context?.connectionParams?.user;
      if (!user) return false;
      if (user.role === 'ADMIN') return true; // Admin sees all
      return payload.country === user.country;
    },
  })
  @Roles(Role.ADMIN, Role.MANAGER)
  orderPlaced() {
    return pubSub.asyncIterator(ORDER_PLACED_EVENT);
  }
}
