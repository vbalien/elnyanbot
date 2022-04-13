
export interface TonPoolProvider {
  name: string;
  balance(walletAddress: string): Promise<number>;
  dailyProfitPerGH(): Promise<number> | null;
  stat(walletAddress: string): string;
}
