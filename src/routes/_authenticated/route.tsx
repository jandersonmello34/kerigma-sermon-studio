import { Layout } from "@/components/Layout";
import { supabase } from "@/integrations/supabase/client";
import { createFileRoute, Outlet, redirect } from "@tanstack/react-router";

export const Route = createFileRoute("/_authenticated")({
  ssr: false,
  beforeLoad: async ({ location }) => {
    const { data } = await supabase.auth.getUser();
    if (!data.user) {
      throw redirect({ to: "/auth", search: { redirect: location.href } });
    }
  },
  component: () => (
    <Layout>
      <Outlet />
    </Layout>
  ),
});
