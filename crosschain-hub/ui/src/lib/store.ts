'use client';

import { create } from 'zustand';

interface WalletState {
  address: string | null;
  connected: boolean;
  chain: string | null;
  balance: string;
  connectWallet: (address: string) => void;
  disconnectWallet: () => void;
  setChain: (chain: string) => void;
  setBalance: (balance: string) => void;
}

export const useStore = create<WalletState>((set) => ({
  address: null,
  connected: false,
  chain: null,
  balance: '0',
  connectWallet: (address) => set({ address, connected: true }),
  disconnectWallet: () => set({ address: null, connected: false, chain: null }),
  setChain: (chain) => set({ chain }),
  setBalance: (balance) => set({ balance }),
}));
