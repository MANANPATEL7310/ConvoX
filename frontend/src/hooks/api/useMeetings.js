import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  getScheduledMeetings,
  createScheduledMeeting,
  updateScheduledMeeting,
  deleteScheduledMeeting,
  getMeetingHistory,
  deleteMeetingHistory,
  sendMeetingInvites,
  generateSFUToken
} from '../../api/meetings';

export const meetingKeys = {
  schedule: ['scheduledMeetings'],
  history: ['meetingHistory'],
};

export function useScheduledMeetingsQuery() {
  return useQuery({
    queryKey: meetingKeys.schedule,
    queryFn: getScheduledMeetings,
  });
}

export function useCreateScheduledMeetingMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: createScheduledMeeting,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: meetingKeys.schedule });
    },
  });
}

export function useUpdateScheduledMeetingMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, payload }) => updateScheduledMeeting(id, payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: meetingKeys.schedule });
    },
  });
}

export function useDeleteScheduledMeetingMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, reason }) => deleteScheduledMeeting(id, reason),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: meetingKeys.schedule });
    },
  });
}

export function useMeetingHistoryQuery() {
  return useQuery({
    queryKey: meetingKeys.history,
    queryFn: getMeetingHistory,
  });
}

export function useDeleteMeetingHistoryMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id }) => deleteMeetingHistory(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: meetingKeys.history });
    },
  });
}

export function useSendMeetingInvitesMutation() {
  return useMutation({
    mutationFn: sendMeetingInvites,
  });
}

export function useGenerateSFUTokenMutation() {
  return useMutation({
    mutationFn: generateSFUToken,
  });
}
