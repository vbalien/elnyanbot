import { mongoose } from "@typegoose/typegoose";
import { Container } from "inversify";
import "reflect-metadata";
import App from "./App";
import { bindings } from "./inversify.config";
import "./middleware";

(async () => {
  const container = new Container();
  await container.loadAsync(bindings);
  const app = new App(process.env.BOT_TOKEN, process.env.BOT_NAME, container);
  const bot = app.build();

  await mongoose.connect(
    `mongodb://${process.env.MONGO_HOST || "localhost"}:27017/`,
    {
      dbName: "elnyan",
    }
  );

  bot.launch();
})();
