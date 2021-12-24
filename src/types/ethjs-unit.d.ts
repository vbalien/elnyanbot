declare module "ethjs-unit" {
  type BN = import("bn.js");
  function fromWei(src: BN | number | string, unit: string): string;
}
