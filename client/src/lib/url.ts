export function getQueryParam(name: string): string {
  const sp = new URLSearchParams(window.location.search);
  return sp.get(name) ?? "";
}

export function setQueryParamReplace(name: string, value: string) {
  const url = new URL(window.location.href);
  if (value) url.searchParams.set(name, value);
  else url.searchParams.delete(name);
  window.history.replaceState({}, "", url);
}