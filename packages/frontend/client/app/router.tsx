import { Navigate, Route, Routes } from "react-router-dom";

import { AppLayout } from "@/shared/components/app-layout";
import { RequireAuth } from "@/features/auth/components/require-auth";
import { SignInPage } from "@/features/auth/pages/sign-in";
import { SignUpPage } from "@/features/auth/pages/sign-up";
import { BrowsePage } from "@/features/properties/pages/browse";
import { PropertyDetailPage } from "@/features/properties/pages/detail";
import { MyBookingsPage } from "@/features/bookings/pages/my-bookings";
import { ProfilePage } from "@/features/profile/pages/profile";
import { NotFoundPage } from "@/shared/components/not-found";

export function AppRoutes() {
  return (
    <Routes>
      <Route element={<AppLayout />}>
        <Route index element={<BrowsePage />} />
        <Route path="properties/:id" element={<PropertyDetailPage />} />

        <Route
          path="bookings"
          element={
            <RequireAuth>
              <MyBookingsPage />
            </RequireAuth>
          }
        />
        <Route
          path="profile"
          element={
            <RequireAuth>
              <ProfilePage />
            </RequireAuth>
          }
        />

        <Route path="*" element={<NotFoundPage />} />
      </Route>

      <Route path="sign-in/*" element={<SignInPage />} />
      <Route path="sign-up/*" element={<SignUpPage />} />
      <Route path="404" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
