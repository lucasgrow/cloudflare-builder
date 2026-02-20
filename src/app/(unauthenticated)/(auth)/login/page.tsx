"use client";

import { useState } from "react";
import { Button, Card, CardBody, Divider, Input } from "@heroui/react";
import { signIn } from "next-auth/react";
import { Icon } from "@iconify/react";
import Link from "next/link";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);

  async function handleMagicLink(e: React.FormEvent) {
    e.preventDefault();
    if (!email) return;
    setLoading(true);
    await signIn("resend", { email, callbackUrl: "/dashboard" });
    setSent(true);
    setLoading(false);
  }

  return (
    <div className="appear-ready animate-appear flex flex-col items-center gap-8">
      {/* Wordmark */}
      <Link href="/" className="text-xl font-bold transition-opacity hover:opacity-70">
        Builder
      </Link>

      <Card className="w-full max-w-sm shadow-apple-xl border border-divider">
        <CardBody className="gap-5 p-6">
          <div className="text-center">
            <h1 className="text-xl font-bold">Welcome back</h1>
            <p className="mt-1 text-small text-default-500">
              Sign in to your account
            </p>
          </div>

          <Button
            variant="bordered"
            className="w-full"
            size="lg"
            startContent={<Icon icon="flat-color-icons:google" width={20} />}
            onPress={() => signIn("google", { callbackUrl: "/dashboard" })}
          >
            Continue with Google
          </Button>

          <div className="flex items-center gap-3">
            <Divider className="flex-1" />
            <span className="text-tiny text-default-400">or</span>
            <Divider className="flex-1" />
          </div>

          {sent ? (
            <div className="flex flex-col items-center gap-2 py-2">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-success-100">
                <Icon icon="solar:check-circle-linear" width={22} className="text-success" />
              </div>
              <p className="text-center text-small text-success">
                Check your email for a sign-in link.
              </p>
            </div>
          ) : (
            <form onSubmit={handleMagicLink} className="flex flex-col gap-3">
              <Input
                type="email"
                label="Email"
                placeholder="you@example.com"
                value={email}
                onValueChange={setEmail}
                isRequired
              />
              <Button type="submit" color="primary" size="lg" isLoading={loading} className="w-full">
                Send magic link
              </Button>
            </form>
          )}
        </CardBody>
      </Card>

      <p className="text-tiny text-default-400">
        No account yet? Just sign in — we&apos;ll create one.
      </p>
    </div>
  );
}
