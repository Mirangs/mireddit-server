import "reflect-metadata";
import express from "express";
import { ApolloServer } from "apollo-server-express";
import { MikroORM } from "@mikro-orm/core";
import { buildSchema } from "type-graphql";

import { UserResolver } from "./resolvers/user";
import { PostResolver } from "./resolvers/post";
import { HelloResolver } from "./resolvers/hello";
import { __prod__ } from "./contants";
import mikroConfig from "./mikro-orm.config";

const main = async () => {
  const orm = await MikroORM.init(mikroConfig);
  await orm.getMigrator().up();

  const app = express();
  app.get("/", (_, res) => {
    res.json({ message: "Hello world" });
  });

  const apolloServer = new ApolloServer({
    schema: await buildSchema({
      resolvers: [HelloResolver, PostResolver, UserResolver],
      validate: false,
    }),
    context: () => ({ em: orm.em }),
  });

  apolloServer.applyMiddleware({ app });

  app.listen(4000, () => {
    console.log("Server started on localhost:4000");
  });
};

main().catch((err) => {
  console.error(err);
});
