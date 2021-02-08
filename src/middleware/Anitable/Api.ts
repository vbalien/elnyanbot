import axios from "axios";
import { DateTime, Interval } from "luxon";

const api = axios.create({
  baseURL: "https://anissia.net/api/anime/schedule/",
  timeout: 1000,
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
  NEW,
}

interface AnimeEntityRaw {
  animeNo: number;
  subject: string;
  time: string;
  genres: string;
  website: string;
  status: string;
  startDate: string;
  endDate: string;
}

export class AnimeEntity {
  private raw: AnimeEntityRaw;

  constructor(raw: AnimeEntityRaw) {
    this.raw = raw;
  }

  get id() {
    return this.raw.animeNo;
  }

  get subject() {
    return this.raw.subject;
  }

  get time() {
    return DateTime.fromFormat(this.raw.time, "HH:mm");
  }

  get genre() {
    return this.raw.genres;
  }

  get link() {
    return this.raw.website;
  }

  get isAlive() {
    return this.raw.status === "ON";
  }

  get startDate() {
    return DateTime.fromFormat(
      this.raw.startDate + " " + this.raw.time,
      "yyyy-MM-dd HH:mm"
    );
  }

  get endDate() {
    return DateTime.fromFormat(
      this.raw.endDate + " " + this.raw.time,
      "yyyy-MM-dd HH:mm"
    );
  }

  get interval() {
    return Interval.fromDateTimes(this.startDate, this.endDate);
  }
}

export default {
  async list(week: Weekday): Promise<AnimeEntity[]> {
    try {
      const raws: AnimeEntityRaw[] = (await api.get(`/${week}`)).data;
      return raws.map((raw) => new AnimeEntity(raw));
    } catch {
      return [];
    }
  },
};
