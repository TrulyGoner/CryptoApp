/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_CRYPTOCOMPARE_API_KEY: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
