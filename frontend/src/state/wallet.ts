import { create } from 'zustand';

interface WalletState {
  address: string | null;
  dotBalance: string | null;
  setAddress: (addr: string | null) => void;
  setDotBalance: (bal: string | null) => void;
}

export const useWalletStore = create<WalletState>((set) => ({
  address: null,
  dotBalance: null,
  setAddress: (address) => set({ address }),
  setDotBalance: (dotBalance) => set({ dotBalance }),
}));
