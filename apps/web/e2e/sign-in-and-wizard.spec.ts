import { expect, test, type Page } from "@playwright/test";

const email = process.env.DEV_USER_EMAIL ?? "";
const password = process.env.DEV_USER_PASSWORD ?? "";

test.skip(!email || !password, "DEV_USER_EMAIL / DEV_USER_PASSWORD not set in .env");

async function signIn(page: Page) {
  await page.goto("/new");
  await expect(page).toHaveURL(/\/login/);
  await page.getByLabel("Work email").fill(email);
  await page.getByRole("button", { name: "Continue" }).click();
  // Keycloak's hosted page (Runway theme): the email arrives pre-filled via login_hint.
  await expect(page.locator("#username")).toHaveValue(email);
  await page.locator("#password").fill(password);
  await page.locator("#kc-login").click();
  await expect(page).toHaveURL(/\/new$/);
}

test("anonymous visitors are sent to sign-in; social options are coming soon", async ({ page }) => {
  await page.goto("/deployments");
  await expect(page).toHaveURL(/\/login/);
  for (const name of ["GitHub", "Google", "Single sign-on (SAML / OIDC)"]) {
    await expect(page.getByRole("button", { name: `${name}, coming soon` })).toBeDisabled();
  }
  await page.getByRole("button", { name: "Continue" }).click();
  await expect(page.getByTestId("login-error")).toHaveText("Enter a valid work email.");
});

test("dev user signs in, completes the wizard, and signs out", async ({ page }) => {
  await signIn(page);
  await page.evaluate(() => localStorage.clear());
  await page.reload();

  const spec = page.getByTestId("spec");
  const next = page.getByRole("button", { name: "Continue" });

  // 0 Cloud: validation message, MVP gating, then local.
  await next.click();
  await expect(page.getByTestId("step-error")).toHaveText("Choose a cloud to continue.");
  await expect(page.getByRole("button", { name: /Azure/ })).toBeDisabled();
  await page.getByRole("button", { name: /Local Kubernetes/ }).click();
  await expect(spec).toContainText("provider: local");
  await next.click();

  // 1 Access
  await expect(page.getByRole("heading", { name: "Connect Local Kubernetes" })).toBeVisible();
  await next.click();
  await expect(page.getByTestId("step-error")).toHaveText(
    "Fill in the missing field before continuing.",
  );
  await page.getByLabel("Kubeconfig context").fill("kind-runway");
  await next.click();

  // 2 Repository
  await page.getByLabel("Repository", { exact: true }).fill("acme/payments-api");
  await expect(spec).toContainText("repo: acme/payments-api");
  await expect(spec).toContainText("project: payments-api");
  await next.click();

  // 3 Target
  await page.getByRole("button", { name: /Containerised web service/ }).click();
  await expect(spec).toContainText("type: container  # Kubernetes Deployment");
  await next.click();

  // 4 Build → 5 Infrastructure → 6 Pipeline (defaults are valid)
  await page.getByLabel("Port your app listens on").fill("8080");
  await expect(spec).toContainText("port: 8080");
  await next.click();
  await expect(page.getByRole("heading", { name: "Infrastructure" })).toBeVisible();
  await next.click();
  await expect(page.getByRole("heading", { name: "Pipeline" })).toBeVisible();
  await next.click();

  // 7 Review
  await expect(page.getByRole("heading", { name: "Review the plan" })).toBeVisible();
  await expect(page.getByText("$0")).toBeVisible();
  const deploy = page.getByRole("button", { name: "Deploy to staging" });
  await deploy.click();
  await expect(page.getByTestId("step-error")).toHaveText("Confirm you have reviewed the plan.");
  await page.getByRole("switch", { name: /I've reviewed this plan/ }).click();
  await deploy.click();
  await expect(page.getByRole("status")).toContainText("Your deploy spec is complete.");

  // Answers survive a reload (non-secret draft in localStorage until Phase 2).
  await page.reload();
  await expect(page.getByTestId("spec")).toContainText("repo: acme/payments-api");

  // Sign out ends the Keycloak session too: the next sign-in asks for the password again.
  await page.getByRole("button", { name: /Account menu/ }).click();
  await page.getByRole("menuitem", { name: "Sign out" }).click();
  await expect(page).toHaveURL(/\/login/);
  await page.getByLabel("Work email").fill(email);
  await page.getByRole("button", { name: "Continue" }).click();
  await expect(page.locator("#password")).toBeVisible();
});
