import { web3Enable, web3Accounts, web3FromAddress, isWeb3Injected } from '@polkadot/extension-dapp';
import { ApiPromise, WsProvider } from '@polkadot/api';
import { u8aToHex } from '@polkadot/util';

let api: ApiPromise | null = null;

const getWsUrl = () => {
  const url = import.meta.env.VITE_POLKADOT_WS as string | undefined;
  return url && url.trim() !== '' ? url : 'wss://rpc.polkadot.io';
};

export async function initPolkadot() {
  if (!api) {
    const provider = new WsProvider(getWsUrl());
    api = await ApiPromise.create({ provider });
  }
  return api;
}

export async function connectWallet() {
  const apps = await web3Enable('BIMA DApp');
  if (!apps || apps.length === 0) {
    throw new Error('Polkadot.js extension not found or access denied.');
  }
  const accounts = await web3Accounts();
  return accounts; // [{ address, meta }, ...]
}

// Backward-compatible numeric balance (may lose precision for very large values)
export async function getBalance(address: string) {
  const api = await initPolkadot();
  const res = await api.query.system.account(address);
  const data: any = res as any;
  // Convert via toString to avoid Codec typing issues across API versions
  const freeStr = data?.data?.free?.toString?.() ?? '0';
  const planck = BigInt(freeStr);
  // Return as number of DOT (10^10 planck per DOT) – may lose precision, keep for compatibility
  return Number(planck) / 10 ** 10;
}

// Safer formatted balance using BigInt (no precision loss in display)
export async function getBalanceFormatted(address: string, decimals = 10): Promise<string> {
  const api = await initPolkadot();
  const res = await api.query.system.account(address);
  const data: any = res as any;
  const freeStr = data?.data?.free?.toString?.() ?? '0';
  const planck = BigInt(freeStr);
  const base = 10n ** BigInt(decimals);
  const whole = planck / base;
  const frac = planck % base;
  const fracStr = frac.toString().padStart(decimals, '0').replace(/0+$/, '');
  return fracStr.length > 0 ? `${whole.toString()}.${fracStr}` : whole.toString();
}

export function isExtensionAvailable(): boolean {
  return !!isWeb3Injected;
}

export async function signPayload(address: string, payload: Uint8Array) {
  const injector = await web3FromAddress(address);
  const signer = injector?.signer;
  if (!signer?.signRaw) throw new Error('signRaw not available');
  const { signature } = await signer.signRaw({ address, data: u8aToHex(payload), type: 'bytes' });
  return signature;
}
