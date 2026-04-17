import { Resolver, Query, Mutation, Args, ObjectType, Field } from '@nestjs/graphql';
import { UseGuards } from '@nestjs/common';
import { PaymentsService } from './payments.service';
import { RolesGuard } from '../common/roles.guard';
import { Roles, Role } from '../common/roles.decorator';
import { CurrentUser } from '../common/current-user.decorator';

@ObjectType()
class PaymentMethodOut {
  @Field() id: string;
  @Field() type: string;
  @Field() last4: string;
  @Field() provider: string;
  @Field(() => Boolean) isDefault: boolean;
  @Field() userId: string;
}

@Resolver()
@UseGuards(RolesGuard)
export class PaymentsResolver {
  constructor(private paymentsService: PaymentsService) {}

  // All authenticated users can view their own payment methods
  @Query(() => [PaymentMethodOut])
  @Roles(Role.ADMIN, Role.MANAGER, Role.MEMBER)
  myPaymentMethods(@CurrentUser() user: any) {
    return this.paymentsService.getMyPaymentMethods(user.sub);
  }

  // ADMIN ONLY — add, remove, set default payment methods
  @Mutation(() => PaymentMethodOut)
  @Roles(Role.ADMIN)
  addPaymentMethod(
    @Args('type') type: string,
    @Args('last4') last4: string,
    @Args('provider') provider: string,
    @Args('isDefault', { defaultValue: false }) isDefault: boolean,
    @CurrentUser() user: any,
  ) {
    return this.paymentsService.addPaymentMethod(user.sub, type, last4, provider, isDefault);
  }

  @Mutation(() => PaymentMethodOut)
  @Roles(Role.ADMIN)
  removePaymentMethod(@Args('id') id: string, @CurrentUser() user: any) {
    return this.paymentsService.removePaymentMethod(id, user.sub);
  }

  @Mutation(() => PaymentMethodOut)
  @Roles(Role.ADMIN)
  setDefaultPaymentMethod(@Args('id') id: string, @CurrentUser() user: any) {
    return this.paymentsService.setDefaultPaymentMethod(id, user.sub);
  }
}
