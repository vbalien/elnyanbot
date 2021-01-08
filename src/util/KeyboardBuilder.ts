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
        callback_data: col[1],
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
