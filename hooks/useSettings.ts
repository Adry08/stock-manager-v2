import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Settings } from '@/types';
import { getSettings, updateSettings } from '@/services/api';

export function useSettings() {
  const queryClient = useQueryClient();

  const { data: settings, isLoading } = useQuery({
    queryKey: ['settings'],
    queryFn: getSettings
  });

  const update = useMutation({
    mutationFn: (newSettings: Partial<Settings>) => updateSettings(newSettings),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['settings'] }),
  });

  return { settings, isLoading, update };
}