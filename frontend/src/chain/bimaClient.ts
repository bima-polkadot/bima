import { initPolkadot } from '@/wallet/polkadotConnector';
import { web3FromAddress } from '@polkadot/extension-dapp';
import type { CreateLandParams, Address, LandId } from './types';

function toBytes(s: string): Uint8Array {
  return new TextEncoder().encode(s);
}

function toGeoHash32(v?: string | Uint8Array): Uint8Array {
  if (!v) return new Uint8Array(32);
  if (v instanceof Uint8Array) {
    if (v.length === 32) return v;
    const out = new Uint8Array(32);
    out.set(v.slice(0, 32));
    return out;
  }
  const hex = v.startsWith('0x') ? v.slice(2) : v;
  const bytes = new Uint8Array(hex.length / 2);
  for (let i = 0; i < bytes.length; i++) bytes[i] = parseInt(hex.substr(i * 2, 2), 16);
  if (bytes.length === 32) return bytes;
  const out = new Uint8Array(32);
  out.set(bytes.slice(0, 32));
  return out;
}

export const BIMA_CHAIN = {
  async createLandRecord(sender: Address, params: CreateLandParams) {
    const api = await initPolkadot();
    const injector = await web3FromAddress(sender);
    const ipfsBytes = toBytes(params.ipfsCid);
    const geo = toGeoHash32(params.geoHash as any);
    const tx = (api as any).tx.bimaRegistry.createLandRecord(params.landId as LandId, ipfsBytes, geo);
    return new Promise<string>((resolve, reject) => {
      tx.signAndSend(sender, { signer: injector.signer }, ({ status, dispatchError, txHash }: any) => {
        if (dispatchError) reject(dispatchError.toString());
        if (status?.isInBlock || status?.isFinalized) resolve(txHash?.toString?.() ?? '');
      }).catch(reject);
    });
  },

  async verifyLandRecord(sender: Address, landId: LandId) {
    const api = await initPolkadot();
    const injector = await web3FromAddress(sender);
    const tx = (api as any).tx.bimaRegistry.verifyLandRecord(landId);
    return new Promise<string>((resolve, reject) => {
      tx.signAndSend(sender, { signer: injector.signer }, ({ status, dispatchError, txHash }: any) => {
        if (dispatchError) reject(dispatchError.toString());
        if (status?.isInBlock || status?.isFinalized) resolve(txHash?.toString?.() ?? '');
      }).catch(reject);
    });
  },

  async verifyWithRole(sender: Address, landId: LandId, role: 'Chief' | 'Surveyor') {
    const api = await initPolkadot();
    const injector = await web3FromAddress(sender);
    const tx = (api as any).tx.bimaRegistry.verifyWithRole(landId, role);
    return new Promise<string>((resolve, reject) => {
      tx.signAndSend(sender, { signer: injector.signer }, ({ status, dispatchError, txHash }: any) => {
        if (dispatchError) reject(dispatchError.toString());
        if (status?.isInBlock || status?.isFinalized) resolve(txHash?.toString?.() ?? '');
      }).catch(reject);
    });
  },

  async transferOwnership(sender: Address, landId: LandId, newOwner: Address) {
    const api = await initPolkadot();
    const injector = await web3FromAddress(sender);
    const tx = (api as any).tx.bimaRegistry.transferOwnership(landId, newOwner);
    return new Promise<string>((resolve, reject) => {
      tx.signAndSend(sender, { signer: injector.signer }, ({ status, dispatchError, txHash }: any) => {
        if (dispatchError) reject(dispatchError.toString());
        if (status?.isInBlock || status?.isFinalized) resolve(txHash?.toString?.() ?? '');
      }).catch(reject);
    });
  },
};
