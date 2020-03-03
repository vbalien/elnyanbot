import Telegraf, { ContextMessageUpdate } from "telegraf";

interface Command {
  text: string;
  command: string;
  bot: string;
  args: string;
  splitArgs: string[];
}

interface State {
  command: Command;
}

export interface ContextMessageUpdateWithState extends ContextMessageUpdate {
  state?: State;
}

const regex = /^\/([^@\s]+)@?(?:(\S+)|)\s?([\s\S]+)?$/i;

export default () =>
  Telegraf.mount<ContextMessageUpdateWithState, ContextMessageUpdateWithState>(
    ["message", "callback_query"],
    (ctx, next) => {
      let text: string | null;
      if (ctx.message && ctx.message.text) {
        text = ctx.message.text;
      } else if (ctx.callbackQuery && ctx.callbackQuery.data) {
        text = ctx.callbackQuery.data;
      } else {
        text = null;
      }

      if (text !== null) {
        const parts = regex.exec(text.trim());
        if (!parts) return next();
        const command = {
          text,
          command: parts[1],
          bot: parts[2],
          args: parts[3],
          get splitArgs() {
            return !parts[3]
              ? []
              : parts[3].split(/\s+/).filter(arg => arg.length);
          }
        };
        ctx.state.command = command;
      }
      return next();
    }
  );
