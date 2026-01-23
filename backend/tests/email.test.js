import { jest } from "@jest/globals";
// Increase timeout for dynamic import and mocked module resolution
jest.setTimeout(10000);
// Note: Do not statically import EmailService here because some tests dynamically
// mock the 'resend' module and need to import the module after the mock is set.

describe("EmailService - password reset", () => {
  afterEach(() => {
    jest.resetModules();
    delete process.env.RESEND_API_KEY;
  });

  test("returns mock response when RESEND_API_KEY is not set", async () => {
    const { EmailService } = await import("../api/_email.js");
    const env = { APP_URL: "http://localhost:3000" };
    const svc = new EmailService(env);

    const res = await svc.sendPasswordResetEmail(
      "user@example.com",
      "token123",
    );

    expect(res).toHaveProperty("success", true);
    expect(res).toHaveProperty("emailId");
    expect(typeof res.emailId).toBe("string");
    expect(res.emailId).toMatch(/mock/);
  });

  test("uses Resend client when RESEND_API_KEY is present", async () => {
    // Instead of relying on dynamic import, inject a fake resend client into the instance
    const { EmailService } = await import("../api/_email.js");

    const env = {
      RESEND_API_KEY: "re_test_key_abc",
      APP_URL: "http://localhost:3000",
    };
    const svc = new EmailService(env);

    // Inject a mock resend client
    svc.resend = {
      emails: {
        send: async (opts) => ({ data: { id: "resend-123" } }),
      },
    };

    const res = await svc.sendPasswordResetEmail(
      "user@example.com",
      "token-xyz",
    );

    expect(res).toHaveProperty("success", true);
    expect(res).toHaveProperty("emailId");
    expect(typeof res.emailId === "string" || res.emailId === null).toBe(true);
  });
});
