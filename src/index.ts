import { instrument } from "@fiberplane/hono-otel";
import { Hono } from "hono";
import { Webhooks } from "@octokit/webhooks";
import { createAppAuth } from "@octokit/auth-app";
import { Octokit } from "@octokit/core";

type Bindings = {
	DATABASE_URL: string;
	KV: KVNamespace;
	GITHUB_APP_ID: string;
  GITHUB_APP_PRIVATE_KEY_BASE64: string;
};

type WebhookPayload = {
	repository: {
		archive_url: string;
		default_branch: string;
	};
};

const app = new Hono<{ Bindings: Bindings }>();
// const webhooks = new Webhooks({ secret: "" });

app.get("/", (c) => {
	return c.text("Honc! 🪿");
});

app.get("/auth-callback", async (c) => {
  const code = c.req.query('code');
  const setupAction = c.req.query('setup_action');
  const installationId = c.req.query('installation_id');
  console.log("params", { code, setupAction, installationId });
  await c.env.KV.put("github-tokens", JSON.stringify({ code, setupAction, installationId }));
	return c.text("OK");
});

app.get("/login-tokens", async (c) => {
  const params = c.req.param();
  console.log("params", params);
  const result = await c.env.KV.get("github-tokens");
  return c.json(result ? JSON.parse(result) : {});
});

app.post("/start-a-retro", async (c) => {
	// 1. Receive an event from GitHub
	// 2. Parse the details about the event here
	// 3. Find the GitHub repo URL to file issues
	// 4. Find all TODO/FIXME comments
	// 5. For each TODO/FIXME comment, create a new issue in the GitHub repo
	// .repository.archive_url

	const payload = await c.req.json<WebhookPayload>();

	if (!payload.repository) {
		console.warn("No repository found in payload", payload);
		return c.text("OK");
	}

  const auth = createAppAuth({
    appId: c.env.GITHUB_APP_ID,
    // Decode the base64 private key
    privateKey: atob(c.env.GITHUB_APP_PRIVATE_KEY_BASE64),
    installationId: "57215991" // await c.env.KV.get("installation_id"),
  });

  const installationAuthentication = await auth({ type: "installation" });
  const octokit = new Octokit({
    auth: installationAuthentication.token,
  });

  try {
    const response = await octokit.request('GET {url}', {
      url: payload.repository.archive_url
        .replace("{archive_format}", "zipball")
        .replace("{/ref}", `/${payload.repository.default_branch}`)
    });

    const archiveBuffer = response.data;
    console.log(`Downloaded archive size: ${archiveBuffer.length} bytes`);

    return c.text("OK");
  } catch (error) {
    console.error("Error downloading archive:", error);
    return c.text("OK");
  }


	// // Replace template variables in archive_url
	// const archiveUrl = payload.repository.archive_url
	// 	.replace("{archive_format}", "zipball")
	// 	.replace("{/ref}", `/${payload.repository.default_branch}`);

	// console.log("Downloading repository from:", archiveUrl);

	// try {
	// 	const response = await fetch(archiveUrl);
	// 	if (!response.ok) {
	// 		throw new Error(`Failed to download archive: ${response.statusText}`);
	// 	}

	// 	const archiveBuffer = await response.arrayBuffer();
	// 	console.log(`Downloaded archive size: ${archiveBuffer.byteLength} bytes`);

	// 	// return c.json({
	// 	//   message: "Archive downloaded successfully",
	// 	//   size: archiveBuffer.byteLength
	// 	// });
	// 	return c.text("OK");
	// } catch (error) {
	// 	console.error("Error downloading archive:", error);
	// 	// return c.json({ error: "Failed to download repository archive" }, 500);
	// 	return c.text("OK");
	// }
});

export default instrument(app);
