import { Module } from '@nestjs/common';
import { RestaurantsResolver } from './restaurants.resolver';
import { RestaurantsService } from './restaurants.service';

@Module({
  providers: [RestaurantsResolver, RestaurantsService],
})
export class RestaurantsModule {}
