import { Resolver, Query, Args, ObjectType, Field, Float, Int } from '@nestjs/graphql';
import { UseGuards } from '@nestjs/common';
import { RestaurantsService } from './restaurants.service';
import { RolesGuard } from '../common/roles.guard';
import { CountryGuard } from '../common/country.guard';
import { Roles, Role, Country } from '../common/roles.decorator';
import { CurrentUser } from '../common/current-user.decorator';

@ObjectType()
export class MenuItemType {
  @Field() id: string;
  @Field() name: string;
  @Field() description: string;
  @Field(() => Float) price: number;
  @Field() category: string;
  @Field(() => Boolean) isAvailable: boolean;
  @Field(() => String, { nullable: true }) imageUrl?: string | null;
  @Field() restaurantId: string;
}

@ObjectType()
export class RestaurantType {
  @Field() id: string;
  @Field() name: string;
  @Field() description: string;
  @Field() cuisine: string;
  @Field() country: string;
  @Field(() => Float) rating: number;
  @Field() address: string;
  @Field(() => String, { nullable: true }) imageUrl?: string | null;
  @Field(() => Boolean) isActive: boolean;
  @Field(() => [MenuItemType]) menuItems: MenuItemType[];
}

@Resolver()
@UseGuards(RolesGuard)
export class RestaurantsResolver {
  constructor(private restaurantsService: RestaurantsService) {}

  // All roles can view restaurants — but country-scoped for MANAGER/MEMBER
  @Query(() => [RestaurantType])
  @Roles(Role.ADMIN, Role.MANAGER, Role.MEMBER)
  async restaurants(@CurrentUser() user: any): Promise<RestaurantType[]> {
    // Admin sees all; others see only their country
    const country = user.role === Role.ADMIN ? undefined : user.country as Country;
    return this.restaurantsService.findAll(country);
  }

  @Query(() => RestaurantType, { nullable: true })
  @Roles(Role.ADMIN, Role.MANAGER, Role.MEMBER)
  async restaurant(
    @Args('id') id: string,
    @CurrentUser() user: any,
  ): Promise<RestaurantType | null> {
    const restaurant = await this.restaurantsService.findOne(id);
    if (!restaurant) return null;
    // ReBAC check — non-admins cannot view another country's restaurant
    CountryGuard.assertCountryAccess(user, restaurant.country);
    return restaurant;
  }
}
