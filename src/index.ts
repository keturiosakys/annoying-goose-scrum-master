import { instrument } from "@fiberplane/hono-otel";
import { Hono } from "hono";
import { Webhooks } from "@octokit/webhooks";

type Bindings = {
	DATABASE_URL: string;
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
	return c.text("OK");
});

app.post("/start-a-retro", async (c) => {
	// 1. Receive an event from GitHub
	// 2. Parse the details about the event here
	// 3. Find the GitHub repo URL to file issues
	// 4. Find all TODO/FIXME comments
	// 5. For each TODO/FIXME comment, create a new issue in the GitHub repo
	// .repository.archive_url

	const payload = await c.req.json<WebhookPayload>();

	// Replace template variables in archive_url
	const archiveUrl = payload.repository.archive_url
		.replace("{archive_format}", "zipball")
		.replace("{/ref}", `/${payload.repository.default_branch}`);

	console.log("Downloading repository from:", archiveUrl);

	try {
		const response = await fetch(archiveUrl);
		if (!response.ok) {
			throw new Error(`Failed to download archive: ${response.statusText}`);
		}

		const archiveBuffer = await response.arrayBuffer();
		console.log(`Downloaded archive size: ${archiveBuffer.byteLength} bytes`);

		// return c.json({
		//   message: "Archive downloaded successfully",
		//   size: archiveBuffer.byteLength
		// });
		return c.text("OK");
	} catch (error) {
		console.error("Error downloading archive:", error);
		// return c.json({ error: "Failed to download repository archive" }, 500);
		return c.text("OK");
	}
});

export default instrument(app);
