import {
  InlineKeyboardMarkup,
  InlineKeyboardButton,
} from "telegraf/typings/telegram-types";

export default class KeyboardBuilder {
  private raw: InlineKeyboardButton[][];

  constructor() {
    this.raw = [];
  }

  addRow(colList: [string, string][]) {
    this.raw.push(
      colList.map((col) => ({
        text: col[0],
        url: /^https?:\/\//.test(col[1]) ? col[1] : undefined,
        callback_data: !/^https?:\/\//.test(col[1]) ? col[1] : undefined,
      }))
    );
    return this;
  }

  build(): InlineKeyboardMarkup {
    return {
      inline_keyboard: this.raw,
    };
  }
}
