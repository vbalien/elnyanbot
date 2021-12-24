declare module "tonweb" {
  type BN = import("bn.js");
  interface Utils {
    toNano(amount: number | BN | string): BN;
    fromNano(amount: number | BN | string): string;
  }

  export default class {
    getBalance(address: string): Promise<string>;

    utils: Utils;
  }
}
