import axios from "axios";

const api = axios.create({
  baseURL: "https://vbalien.github.io/ssu-today-meals/data",
  timeout: 1000,
});

interface Place {
  id: number;
  name: string;
}

export const places: Place[] = [
  {
    id: 1,
    name: "학생식당",
  },
  {
    id: 2,
    name: "숭실도담",
  },
  {
    id: 7,
    name: "FACULTY LOUNGE",
  },
  {
    id: 4,
    name: "스넥코너",
  },
  {
    id: 5,
    name: "푸드코트",
  },
  {
    id: 6,
    name: "더 키친",
  },
];

interface MenuRaw {
  kind: string;
  price?: number;
  image?: string;
  foods: string;
}

class Menu {
  private raw: MenuRaw;

  constructor(raw: MenuRaw) {
    this.raw = raw;
  }

  get kind() {
    return this.raw.kind;
  }

  get image() {
    return this.raw.image;
  }

  get foods() {
    return this.raw.foods
      .replace(/<br>|<\/div>/gi, "\n")
      .replace(/&nbsp;/gi, " ")
      .replace(/<.*?>/gis, "")
      .replace(/\n+/gi, "\n");
  }

  get price() {
    return (
      this.raw.price.toString().replace(/\B(?=(\d{3})+(?!\d))/, ",") + "원"
    );
  }
}

export default {
  getMenu: async (place: Place): Promise<Menu[]> => {
    try {
      const res = await api.get(`/${place.id}.json`);
      const menu: Menu[] = res.data.menus.map((m: MenuRaw) => new Menu(m));
      return menu;
    } catch (e) {
      return [];
    }
  },
};
