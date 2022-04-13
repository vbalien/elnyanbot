import { TonPoolProvider } from "../pool-provider";
import axios from "axios";
import { fromNano } from "ton";

export default {
  name: "Ton Whales",
  async balance(walletAddress: string): Promise<number> {
    const res = await axios.get(
      `https://server1.whalestonpool.com/wallet/${walletAddress}`
    );
    const balance: number = res.data.balance;
    return Number.parseFloat(fromNano(balance));
  },

  dailyProfitPerGH(): null {
    return null;
  },

  stat(walletAddress: string) {
    return `https://tonwhales.com/mining/stats/${walletAddress}`
  },
} as TonPoolProvider;
