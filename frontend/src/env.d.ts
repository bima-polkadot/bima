/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_POLKADOT_WS?: string;
  readonly VITE_ESCROW_ADDRESS?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
