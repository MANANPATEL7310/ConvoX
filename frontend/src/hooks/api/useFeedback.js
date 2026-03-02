import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { submitFeedback, getPublicFeedback } from '../../api/feedback';

export const feedbackKeys = {
  public: ['publicFeedback'],
};

export function usePublicFeedbackQuery() {
  return useQuery({
    queryKey: feedbackKeys.public,
    queryFn: getPublicFeedback,
  });
}

export function useSubmitFeedbackMutation() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: submitFeedback,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: feedbackKeys.public });
    },
  });
}
