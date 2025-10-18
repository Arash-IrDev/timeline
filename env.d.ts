/// <reference types="vite/client" />

declare global {
  interface Window {
    __markwhen_initial_state?: any;
    __timeline_updateData?: (options: { rawText: string }) => void;
    __timeline_vm_mounted?: boolean;
    __timeline_bundle_loaded?: boolean;
  }
}
