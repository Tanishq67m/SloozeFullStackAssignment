import { Resolver, Mutation, Args, ObjectType, Field } from '@nestjs/graphql';
import { AuthService } from './auth.service';

@ObjectType()
class UserPayload {
  @Field() id: string;
  @Field() email: string;
  @Field() name: string;
  @Field() role: string;
  @Field(() => String, { nullable: true }) country?: string | null;
}

@ObjectType()
class AuthResponse {
  @Field() accessToken: string;
  @Field(() => UserPayload) user: UserPayload;
}

@Resolver()
export class AuthResolver {
  constructor(private authService: AuthService) {}

  @Mutation(() => AuthResponse)
  async login(
    @Args('email') email: string,
    @Args('password') password: string,
  ): Promise<AuthResponse> {
    return this.authService.login(email, password);
  }
}
