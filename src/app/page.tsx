import { Button, Chip } from "@heroui/react";
import Link from "next/link";
import { Icon } from "@iconify/react";

const features = [
  {
    icon: "solar:shield-check-linear",
    title: "Authentication",
    desc: "Google OAuth + magic link via Resend. Session management included.",
  },
  {
    icon: "solar:server-square-linear",
    title: "Edge Database",
    desc: "Cloudflare D1 with Drizzle ORM. Migrations, typed queries, zero config.",
  },
  {
    icon: "solar:cloud-upload-linear",
    title: "File Storage",
    desc: "R2 presigned uploads with aws4fetch. Direct browser-to-bucket.",
  },
  {
    icon: "solar:rocket-2-linear",
    title: "Edge Deploy",
    desc: "One command to ship on Cloudflare Workers. Global, fast, cheap.",
  },
  {
    icon: "solar:palette-round-linear",
    title: "Design System",
    desc: "HeroUI + Tailwind. Dark mode, color palettes, responsive out of the box.",
  },
  {
    icon: "solar:command-linear",
    title: "One-command Setup",
    desc: "Interactive setup script creates D1, R2, env vars, and applies migrations.",
  },
  {
    icon: "solar:code-square-linear",
    title: "API Patterns",
    desc: "Auth-gated routes, typed responses, edge-compatible patterns baked in.",
  },
  {
    icon: "solar:moon-linear",
    title: "Dark Mode",
    desc: "System-aware theme switching with smooth transitions. No flash.",
  },
];

const techStack = [
  "Next.js 14",
  "Cloudflare Workers",
  "D1",
  "R2",
  "NextAuth v5",
  "HeroUI",
  "Drizzle ORM",
  "TypeScript",
];

const steps = [
  {
    number: "1",
    icon: "solar:copy-linear",
    title: "Clone the template",
    code: "gh repo create my-app --template",
    desc: "Use this repo as a template and clone it locally.",
  },
  {
    number: "2",
    icon: "solar:command-linear",
    title: "Run setup",
    code: "bun run setup",
    desc: "Creates D1, R2, env vars, and applies migrations interactively.",
  },
  {
    number: "3",
    icon: "solar:play-linear",
    title: "Start building",
    code: "bun dev",
    desc: "Auth, database, and storage — ready to go at localhost:3000.",
  },
];

export default function LandingPage() {
  return (
    <div className="flex min-h-dvh flex-col">
      {/* Navbar */}
      <nav className="sticky top-0 z-50 flex h-16 items-center justify-between border-b border-divider bg-background/80 backdrop-blur-md px-6">
        <span className="text-lg font-bold">Builder</span>
        <div className="flex items-center gap-2">
          <Button
            as="a"
            href="https://github.com"
            target="_blank"
            rel="noopener noreferrer"
            isIconOnly
            variant="light"
            size="sm"
            aria-label="GitHub"
          >
            <Icon icon="mdi:github" width={20} />
          </Button>
          <Button as={Link} href="/login" variant="flat" size="sm">
            Sign in
          </Button>
        </div>
      </nav>

      {/* Hero */}
      <section className="flex flex-col items-center gap-6 px-6 py-24 text-center sm:py-32">
        <Chip
          variant="flat"
          startContent={<Icon icon="solar:rocket-2-linear" width={16} />}
          className="appear-ready animate-appear"
        >
          Next.js 14 · Cloudflare Workers
        </Chip>
        <h1
          className="appear-ready animate-appear text-4xl font-bold tracking-tight sm:text-6xl text-balance max-w-3xl"
          style={{ animationDelay: "0.1s" }}
        >
          Ship your SaaS,{" "}
          <span className="text-default-400">not your boilerplate.</span>
        </h1>
        <p
          className="appear-ready animate-appear max-w-lg text-lg text-default-500"
          style={{ animationDelay: "0.2s" }}
        >
          Auth, database, storage, and edge deploy — fully wired up.
        </p>
        <div
          className="appear-ready animate-appear flex flex-wrap justify-center gap-3"
          style={{ animationDelay: "0.3s" }}
        >
          <Button as={Link} href="/login" color="primary" size="lg">
            Get started free
          </Button>
          <Button
            as="a"
            href="https://github.com"
            target="_blank"
            rel="noopener noreferrer"
            variant="bordered"
            size="lg"
            startContent={<Icon icon="mdi:github" width={20} />}
          >
            View on GitHub
          </Button>
        </div>
        <p
          className="appear-ready animate-appear text-small text-default-400"
          style={{ animationDelay: "0.4s" }}
        >
          Zero config. One setup command. Production-ready on day one.
        </p>
      </section>

      {/* Features */}
      <section className="mx-auto w-full max-w-6xl px-6 py-20">
        <h2 className="mb-12 text-center text-3xl font-bold tracking-tight">
          Everything included
        </h2>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {features.map((f) => (
            <div
              key={f.title}
              className="rounded-2xl border border-divider bg-content1 p-6 shadow-apple-md transition-shadow hover:shadow-apple-xl"
            >
              <div className="mb-4 flex h-10 w-10 items-center justify-center rounded-xl bg-default-100">
                <Icon icon={f.icon} width={22} className="text-foreground" />
              </div>
              <h3 className="text-medium font-semibold">{f.title}</h3>
              <p className="mt-1 text-small text-default-500">{f.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Tech stack */}
      <section className="border-y border-divider bg-content1 px-6 py-12">
        <div className="mx-auto flex max-w-4xl flex-col items-center gap-4 sm:flex-row sm:flex-wrap sm:justify-center">
          <span className="text-small font-medium text-default-500">
            Built on
          </span>
          <div className="flex flex-wrap justify-center gap-2">
            {techStack.map((tech) => (
              <Chip key={tech} variant="bordered" size="sm">
                {tech}
              </Chip>
            ))}
          </div>
        </div>
      </section>

      {/* Quick start */}
      <section className="mx-auto w-full max-w-4xl px-6 py-20">
        <h2 className="mb-12 text-center text-3xl font-bold tracking-tight">
          Up in minutes
        </h2>
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-3">
          {steps.map((step, i) => (
            <div key={step.number} className="relative flex flex-col items-center text-center">
              {/* Connector arrow (desktop only, not on last) */}
              {i < steps.length - 1 && (
                <div className="absolute -right-3 top-8 hidden text-default-300 sm:block">
                  <Icon icon="solar:arrow-right-linear" width={20} />
                </div>
              )}
              <div className="mb-1 text-tiny font-bold text-default-400">
                STEP {step.number}
              </div>
              <div className="mb-3 flex h-12 w-12 items-center justify-center rounded-xl bg-default-100">
                <Icon icon={step.icon} width={24} className="text-foreground" />
              </div>
              <h3 className="text-medium font-semibold">{step.title}</h3>
              <code className="mt-2 inline-block rounded-lg bg-default-100 px-3 py-1 text-small font-mono">
                {step.code}
              </code>
              <p className="mt-2 text-small text-default-500">{step.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Bottom CTA */}
      <section className="border-t border-divider bg-content1 px-6 py-20">
        <div className="mx-auto flex max-w-2xl flex-col items-center gap-6 text-center">
          <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-default-100">
            <Icon icon="solar:rocket-2-linear" width={28} className="text-foreground" />
          </div>
          <h2 className="text-3xl font-bold tracking-tight">
            Ready to ship?
          </h2>
          <p className="text-default-500">
            Stop wiring boilerplate. Start building your product.
          </p>
          <div className="flex flex-wrap justify-center gap-3">
            <Button as={Link} href="/login" color="primary" size="lg">
              Get started free
            </Button>
            <Button
              as="a"
              href="https://github.com"
              target="_blank"
              rel="noopener noreferrer"
              variant="bordered"
              size="lg"
              startContent={<Icon icon="mdi:github" width={20} />}
            >
              View on GitHub
            </Button>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="flex items-center justify-between border-t border-divider px-6 py-6">
        <span className="text-small font-semibold">Builder</span>
        <span className="text-small text-default-400">MIT License</span>
        <Button
          as="a"
          href="https://github.com"
          target="_blank"
          rel="noopener noreferrer"
          isIconOnly
          variant="light"
          size="sm"
          aria-label="GitHub"
        >
          <Icon icon="mdi:github" width={18} />
        </Button>
      </footer>
    </div>
  );
}
