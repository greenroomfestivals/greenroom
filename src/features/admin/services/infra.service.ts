import "server-only";

export type InfraMetrics = {
  totalCost: string;
  platforms: {
    name: string;
    role: string;
    cost: string;
    plan: string;
    description: string;
  }[];
};

export async function getInfraMetrics(): Promise<InfraMetrics> {
  const platforms = [
    {
      name: "Next.js 15 (App Router)",
      role: "Full-Stack Framework",
      cost: "Free",
      plan: "Open Source",
      description: "The core React framework powering both the frontend UI and the backend API routes."
    },
    {
      name: "Vercel",
      role: "Compute & Edge Hosting",
      cost: "$0.00",
      plan: "Hobby",
      description: "Global edge network hosting the Next.js application, serverless functions, and static assets."
    },
    {
      name: "Neon",
      role: "Serverless Postgres",
      cost: "$0.00",
      plan: "Free",
      description: "Primary relational database storing all festival data, users, and schedules. Connects via WebSockets on Edge."
    },
    {
      name: "Upstash Redis",
      role: "Cache & Pub/Sub",
      cost: "Pay-as-you-go",
      plan: "Pay-as-you-go",
      description: "Serverless Redis used for high-speed caching and real-time Pub/Sub events across Edge functions."
    },
    {
      name: "Inngest",
      role: "Background Jobs",
      cost: "$0.00",
      plan: "Free",
      description: "Durable execution engine handling background tasks, webhooks, and delayed scheduling without queues."
    },
    {
      name: "Resend",
      role: "Transactional Email",
      cost: "$0.00",
      plan: "Free",
      description: "Email API used for sending magic links, invitations, and automated notifications to participants."
    },
    {
      name: "Better Auth",
      role: "Authentication",
      cost: "Free",
      plan: "Self-Hosted",
      description: "Comprehensive authentication system managing sessions, OAuth, and roles directly in our Neon database."
    },
    {
      name: "Razorpay",
      role: "Payment Gateway",
      cost: "2% per tx",
      plan: "Standard",
      description: "Processes entry fees and tickets. Fees are strictly per-transaction with no monthly fixed costs."
    },
    {
      name: "Drizzle ORM",
      role: "Database ORM",
      cost: "Free",
      plan: "Open Source",
      description: "Type-safe TypeScript ORM used to interact with Neon Postgres and run schema migrations."
    },
    {
      name: "Tailwind CSS & Shadcn/UI",
      role: "Styling & Components",
      cost: "Free",
      plan: "Open Source",
      description: "Utility-first CSS framework combined with accessible, customizable React components."
    }
  ];

  return {
    totalCost: "Pay-as-you-go / Free Tiers",
    platforms
  };
}
