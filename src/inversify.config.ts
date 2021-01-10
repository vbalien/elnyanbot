import { AsyncContainerModule } from "inversify";
import { Connection, createConnection } from "typeorm";
import { TYPE } from "./constants";
import { Memo } from "./entity";

export const bindings = new AsyncContainerModule(async (bind) => {
  const conn = await createConnection({
    type: "mongodb",
    host: process.env.MONGO_HOST || "localhost",
    database: "elnyan",
    entities: [Memo],
    synchronize: true,
    logging: false,
  });
  bind<Connection>(TYPE.MongoDBClient)
    .toDynamicValue(() => {
      return conn;
    })
    .inSingletonScope();
});
