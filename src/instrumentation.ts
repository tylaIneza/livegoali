export async function register() {
  // Only run in Node.js runtime (not edge), and only in production or explicitly in dev
  if (process.env.NEXT_RUNTIME === "nodejs") {
    const { startMatchAutoStatus } = await import("@/lib/matchAutoStatus");
    startMatchAutoStatus();
  }
}
