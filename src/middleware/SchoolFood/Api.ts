import axios from "axios";
import { DateTime } from "luxon";

export interface Menu {
  name: string;
  foods: string[];
}

export enum MenuKind {
  STUDENT = 1,
  DODAM,
  SNACK,
  FOOD_COURT,
  KITCHEN
}
export const MenuString = [
  "",
  "학생식당",
  "도담식당",
  "스낵코너",
  "푸드코트",
  "더 키친"
];

const api = axios.create({
  baseURL: "http://m.soongguri.com/m_req/",
  timeout: 1000
});

export default {
  getMenu: async (kind: MenuKind): Promise<Menu[]> => {
    const date = DateTime.local().setZone("Asia/Seoul");
    const res = await api.get(
      `/m_menu.php?rcd=${kind}&sdt=${date.toFormat("yyyyMMdd")}`
    );
    const results = [
      ...res.data.matchAll(
        /<tr>[^<]*<td class="menu_nm">(?<name>[^]*?)<\/td>[^<]*<td class="menu_list">(?<menu>[^]*?)\s*<\/td>/gi
      )
    ];
    const menu: Menu[] = results.map(result => ({
      name: result.groups.name.trim(),
      foods: result.groups.menu
        .split(/<[^>]*>/gi)
        .map((el: string) => el.trim())
        .filter((el: string) => el !== "" && el.search(/[a-zA-Z]/gi) === -1)
    }));
    return menu;
  }
};
