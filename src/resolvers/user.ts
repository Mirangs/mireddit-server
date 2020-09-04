import { MyContext } from "./../types.d";
import {
  Resolver,
  Mutation,
  Arg,
  InputType,
  Field,
  Ctx,
  Query,
  ObjectType,
} from "type-graphql";
import { User } from "../entities/User";
import argon2 from "argon2";

@InputType()
class UserNamePasswordInput {
  @Field()
  username: string;
  @Field()
  password: string;
}

@ObjectType()
class FieldError {
  @Field()
  field: string;
  @Field()
  message: string;
}

@ObjectType()
class UserResponse {
  @Field(() => [FieldError], { nullable: true })
  errors?: FieldError[];
  @Field(() => User, { nullable: true })
  user?: User;
}

@Resolver()
export class UserResolver {
  @Query(() => [User])
  users(@Ctx() { em }: MyContext) {
    return em.find(User, {});
  }

  @Mutation(() => UserResponse, { nullable: true })
  async login(
    @Arg("options") options: UserNamePasswordInput,
    @Ctx() { em }: MyContext
  ): Promise<UserResponse> {
    const { username, password } = options;
    const userFound = await em.findOne(User, { username });
    if (!userFound) {
      return {
        errors: [
          {
            field: "username",
            message: `User with username ${username} doesn't exist`,
          },
        ],
      };
    }

    const isPasswordMatch = await argon2.verify(userFound.password, password);
    if (!isPasswordMatch) {
      return {
        errors: [
          {
            field: "password",
            message: `Password is incorrect`,
          },
        ],
      };
    }

    return {
      user: userFound,
    };
  }

  @Mutation(() => UserResponse, { nullable: true })
  async register(
    @Arg("options") options: UserNamePasswordInput,
    @Ctx() { em }: MyContext
  ): Promise<UserResponse> {
    const { username, password } = options;
    if (username.length < 2) {
      return {
        errors: [
          {
            field: "username",
            message: "length must be greater than 2",
          },
        ],
      };
    }

    if (password.length < 3) {
      return {
        errors: [
          {
            field: "password",
            message: "length must be greater than 3",
          },
        ],
      };
    }

    const isUserExists = await em.findOneOrFail(User, { username });
    if (isUserExists) {
      return {
        errors: [
          {
            field: "username",
            message: `User with username ${username} already exists`,
          },
        ],
      };
    }

    const hashedPassword = await argon2.hash(password);
    const user = em.create(User, { username, password: hashedPassword });
    await em.persistAndFlush(user);

    return {
      user,
    };
  }
}
