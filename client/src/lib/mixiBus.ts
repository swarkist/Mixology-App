// Global event bus for Mixi chat communication
export type MixiOpenDetail = { 
  seed?: string; 
  context?: any;
  initialUserMessage?: string;
};

export function openMixi(detail?: MixiOpenDetail) {
  window.dispatchEvent(new CustomEvent<MixiOpenDetail>("mixi:open", { detail }));
}

export function onMixiOpen(cb: (detail: MixiOpenDetail) => void) {
  const handler = (e: Event) => cb((e as CustomEvent<MixiOpenDetail>).detail || {});
  window.addEventListener("mixi:open", handler);
  return () => window.removeEventListener("mixi:open", handler);
}