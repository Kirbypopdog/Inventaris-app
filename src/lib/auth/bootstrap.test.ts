import { beforeEach, describe, expect, it, vi } from "vitest";
import { bootstrapAdmin, type BootstrapDeps } from "./bootstrap";

function fakeDeps(members: number, makeFirstAdminResult = true) {
  return {
    countMembers: vi.fn<BootstrapDeps["countMembers"]>().mockResolvedValue(members),
    createAccount: vi.fn<BootstrapDeps["createAccount"]>().mockResolvedValue("created"),
    makeFirstAdmin: vi
      .fn<BootstrapDeps["makeFirstAdmin"]>()
      .mockResolvedValue(makeFirstAdminResult),
  };
}

const config = { email: " Victor@Voorbeeld.be ", password: "een-lang-wachtwoord" };

describe("bootstrapAdmin", () => {
  beforeEach(() => {
    vi.spyOn(console, "warn").mockImplementation(() => {});
    vi.spyOn(console, "error").mockImplementation(() => {});
  });

  it("does nothing when not configured", async () => {
    const deps = fakeDeps(0);
    expect(await bootstrapAdmin({}, deps)).toBe("not-configured");
    expect(deps.countMembers).not.toHaveBeenCalled();
  });

  it("refuses a too short password", async () => {
    const deps = fakeDeps(0);
    expect(await bootstrapAdmin({ email: "v@voorbeeld.be", password: "kort" }, deps)).toBe(
      "invalid-config",
    );
    expect(deps.createAccount).not.toHaveBeenCalled();
  });

  it("does nothing once there are members", async () => {
    const deps = fakeDeps(2);
    expect(await bootstrapAdmin(config, deps)).toBe("already-has-members");
    expect(deps.createAccount).not.toHaveBeenCalled();
  });

  it("creates the first admin with a normalised e-mail address", async () => {
    const deps = fakeDeps(0);
    expect(await bootstrapAdmin(config, deps)).toBe("admin-created");
    expect(deps.createAccount).toHaveBeenCalledWith("victor@voorbeeld.be", "een-lang-wachtwoord");
    expect(deps.makeFirstAdmin).toHaveBeenCalledWith("victor@voorbeeld.be");
  });

  it("reports when another start created the admin first", async () => {
    const deps = fakeDeps(0, false);
    expect(await bootstrapAdmin(config, deps)).toBe("already-has-members");
  });
});
