import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiRequest } from '@/lib/queryClient';

export function useFavoriteIds() {
  return useQuery({
    queryKey: ['/api/user/favorites'],
    queryFn: async () => {
      try {
        const res = await apiRequest('/api/user/favorites', { method: 'GET' });
        return { ids: (res?.ids ?? []) as string[], isAuthed: true };
      } catch (err: any) {
        // Check if error message contains 401 or unauthorized
        if (err.message?.includes('401') || err.message?.toLowerCase().includes('unauthorized')) {
          return { ids: [] as string[], isAuthed: false };
        }
        // Re-throw other errors
        throw err;
      }
    },
    staleTime: 60_000,
  });
}

export function useToggleFavorite() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (cocktailId: string) => {
      const res = await apiRequest(`/api/user/favorites/${cocktailId}`, { method: 'POST' });
      return res as { favorited: boolean };
    },
    onMutate: async (cocktailId) => {
      await qc.cancelQueries({ queryKey: ['/api/user/favorites'] });
      const prev = qc.getQueryData(['/api/user/favorites']) as { ids: string[], isAuthed: boolean } | undefined;
      if (prev?.isAuthed) {
        const next = prev.ids.includes(cocktailId)
          ? prev.ids.filter(id => id !== cocktailId)
          : [...prev.ids, cocktailId];
        qc.setQueryData(['/api/user/favorites'], { ids: next, isAuthed: true });
      }
      return { prev };
    },
    onError: (_e, _id, ctx) => {
      // Roll back optimistic update on error
      if (ctx?.prev) {
        qc.setQueryData(['/api/user/favorites'], ctx.prev);
      }
    },
    onSettled: () => {
      qc.invalidateQueries({ queryKey: ['/api/user/favorites'] });
      // Also invalidate cocktails queries to update My Favs filter
      qc.invalidateQueries({ queryKey: ['/api/cocktails'] });
    }
  });
}

export function isFavorited(ids: string[], cocktailId: string) {
  return ids.includes(cocktailId);
}