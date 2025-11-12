export type LandId = number;
export type Address = string;

export type HexString = `0x${string}`;

export type CreateLandParams = {
  landId: LandId;
  ipfsCid: string; // stored as bytes on-chain; we send as UTF-8 bytes
  geoHash?: HexString | Uint8Array; // 32 bytes; optional helper to fill with zeros if not provided
};
