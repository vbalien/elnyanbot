import { Container } from "inversify";
import "reflect-metadata";
import App from "./App";
import { bindings } from "./inversify.config";
import "./middleware";

(async () => {
  const container = new Container();
  await container.loadAsync(bindings);
  const app = new App(process.env.BOT_TOKEN, container);
  const bot = app.build();

  bot.launch();
})();
