export const TYPE = {
  BotInstance: Symbol.for("BotInstance"),
  MongoDBClient: Symbol.for("MongoDBClient"),
  Middleware: Symbol.for("Middleware"),
};

export const METADATA_KEY = {
  middleware: "elnyanbot:middleware",
  middlewareHears: "elnyanbot:middleware-hears",
  middlewareAction: "elnyanbot:middleware-action",
  middlewareCommand: "elnyanbot:middleware-command",
};
