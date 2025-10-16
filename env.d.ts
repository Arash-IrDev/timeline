/// <reference types="vite/client" />

declare global {
  interface Window {
    __markwhen_initial_state: {
      initialized: boolean;
      data: any;
    };
  }
}
