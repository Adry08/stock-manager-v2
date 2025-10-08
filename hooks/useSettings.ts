// hooks/useSettings.ts
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { getSettings, updateSettings, createSettings } from '@/services/api';
import { Settings } from '@/types';

export function useSettings(userId?: string) {
  const queryClient = useQueryClient();

  // Chargement des settings
  const { data: settings, isLoading } = useQuery<Settings>({
    queryKey: ['settings', userId],
    queryFn: async () => {
      if (!userId) throw new Error('userId manquant');
      return await getSettings(userId);
    },
    enabled: !!userId, // éviter de lancer si userId n’est pas dispo
  });

  // Mutation pour mise à jour
  const update = useMutation({
    mutationFn: async (newSettings: Partial<Settings>) => {
      if (!userId) throw new Error('userId manquant');
      return await updateSettings(userId, newSettings);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['settings', userId] });
    },
  });

  // Mutation pour création
  const create = useMutation({
    mutationFn: async () => {
      if (!userId) throw new Error('userId manquant');
      return await createSettings(userId);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['settings', userId] });
    },
  });

  return {
    settings,
    isLoading,
    update,
    create,
  };
}
