import axios from "axios";
import { DateTime, Interval } from "luxon";

const api = axios.create({
  baseURL: "https://www.anissia.net/anitime/",
  timeout: 1000
});

export enum Weekday {
  SUN = 0,
  MON,
  TUE,
  WED,
  THU,
  FRI,
  SAT,
  ETC,
  NEW
}

interface AnimeEntityRaw {
  i: number;
  s: string;
  t: string;
  g: string;
  l: string;
  a: boolean;
  sd: string;
  ed: string;
}

export class AnimeEntity {
  private raw: AnimeEntityRaw;

  constructor(raw: AnimeEntityRaw) {
    this.raw = raw;
  }

  get id() {
    return this.raw.i;
  }

  get subtitle() {
    return this.raw.s;
  }

  get time() {
    return DateTime.fromFormat(this.raw.t, "HHmm");
  }

  get genre() {
    return this.raw.g;
  }

  get link() {
    return this.raw.l;
  }

  get isAlive() {
    return this.raw.a;
  }

  get startDate() {
    return DateTime.fromFormat(this.raw.sd + this.raw.t, "yyyyMMddHHmm");
  }

  get endDate() {
    return DateTime.fromFormat(this.raw.ed + this.raw.t, "yyyyMMddHHmm");
  }

  get interval() {
    return Interval.fromDateTimes(this.startDate, this.endDate);
  }
}

export default {
  async list(week: Weekday): Promise<AnimeEntity[]> {
    try {
      const raws: AnimeEntityRaw[] = (
        await api.get("/list", { params: { w: week } })
      ).data;
      return raws.map(raw => new AnimeEntity(raw));
    } catch {
      return [];
    }
  }
};
