import { useQuery } from "@tanstack/react-query";

export type CocktailLite = { id: string | number; name: string };

/**
 * Loads a lightweight index of cocktails so the chat can:
 * - allow links only for cocktails that exist in our DB
 * - auto-correct links when the model uses the right name but wrong id
 */
export function useCocktailIndex() {
  return useQuery<CocktailLite[]>({
    queryKey: ["cocktail-index"],
    queryFn: async () => {
      // Prefer a slim payload if supported, otherwise fall back to full list.
      const r = await fetch("/api/cocktails?fields=id,name");
      if (!r.ok) {
        const r2 = await fetch("/api/cocktails");
        if (!r2.ok) throw new Error("Failed to load cocktails index");
        return (await r2.json()) as CocktailLite[];
      }
      return (await r.json()) as CocktailLite[];
    },
    staleTime: 5 * 60 * 1000, // cache for a few minutes
  });
}
