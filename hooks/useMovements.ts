import { useInfiniteQuery } from '@tanstack/react-query';
import { getMovements } from '@/services/api';

export function useMovements() {
  const query = useInfiniteQuery({
    queryKey: ['movements'],
    queryFn: async ({ pageParam }: { pageParam: number }) => 
      getMovements(pageParam, 10),
    getNextPageParam: (lastPage, pages) => 
      lastPage.length > 0 ? pages.length : undefined,
    initialPageParam: 0,
  });

  return query;
}