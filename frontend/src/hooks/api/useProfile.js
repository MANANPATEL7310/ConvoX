import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { 
  getProfile, 
  updateProfile, 
  updatePassword, 
  getNotifications, 
  markNotificationsRead 
} from '../../api/profile';

// Keys for caching
export const profileKeys = {
  all: ['profile'],
  notifications: ['notifications'],
};

export function useProfileQuery() {
  return useQuery({
    queryKey: profileKeys.all,
    queryFn: getProfile,
  });
}

export function useUpdateProfileMutation() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: updateProfile,
    onSuccess: () => {
      // Invalidate the cache to trigger a background refetch across all mounted components
      queryClient.invalidateQueries({ queryKey: profileKeys.all });
    },
  });
}

export function useUpdatePasswordMutation() {
  return useMutation({
    mutationFn: updatePassword,
  });
}

export function useNotificationsQuery() {
  return useQuery({
    queryKey: profileKeys.notifications,
    queryFn: getNotifications,
    refetchInterval: 30000, // Automagically refetches every 30 seconds
  });
}

export function useMarkNotificationsReadMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: markNotificationsRead,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: profileKeys.notifications });
    },
  });
}
