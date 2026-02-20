import { auth } from "@/server/auth";
import { redirect } from "next/navigation";

export const dynamic = "force-dynamic";

export default async function AuthLayout({ children }: { children: React.ReactNode }) {
  const session = await auth();

  if (session?.user) {
    redirect("/dashboard");
  }

  return (
    <div className="flex min-h-dvh flex-col items-center justify-center bg-[radial-gradient(ellipse_at_top,var(--heroui-content2)_0%,transparent_60%)] px-4 py-8">
      {children}
    </div>
  );
}
