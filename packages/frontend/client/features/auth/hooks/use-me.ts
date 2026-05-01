import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import { authClient } from "@/lib/auth-client";
import { fetchMe, patchMe, type UpdateMePayload, type UserMe } from "@/features/auth/api/me";

export const meKey = ["me"] as const;

export function useMe() {
  const { data: session } = authClient.useSession();
  return useQuery({
    queryKey: meKey,
    queryFn: fetchMe,
    enabled: !!session,
  });
}

export function useUpdateMe() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (body: UpdateMePayload) => patchMe(body),
    onSuccess: (data: UserMe) => qc.setQueryData(meKey, data),
  });
}
