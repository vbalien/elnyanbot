type BN = import("bn.js");

declare module "ethjs-unit" {
  function fromWei(src: BN | number | string, unit: string): string;
}
