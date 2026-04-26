import { useAuth } from "@clerk/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import { fetchMe, patchMe, type UpdateMePayload, type UserMe } from "@/features/auth/api/me";

export const meKey = ["me"] as const;

export function useMe() {
  const { isSignedIn } = useAuth();
  return useQuery({
    queryKey: meKey,
    queryFn: fetchMe,
    enabled: !!isSignedIn,
  });
}

export function useUpdateMe() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (body: UpdateMePayload) => patchMe(body),
    onSuccess: (data: UserMe) => qc.setQueryData(meKey, data),
  });
}
