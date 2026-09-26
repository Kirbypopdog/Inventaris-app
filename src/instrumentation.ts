/** Runs once when the server starts. */
export async function register() {
  if (
    process.env.NEXT_RUNTIME !== "nodejs" ||
    process.env.NEXT_PHASE === "phase-production-build"
  ) {
    return;
  }
  const { runBootstrapAdmin } = await import("@/lib/auth/bootstrap-supabase");
  try {
    await runBootstrapAdmin();
  } catch (error) {
    // The app must still start; the admin can be created by fixing the settings and restarting.
    console.error("Creating the first admin failed", error);
  }
}
