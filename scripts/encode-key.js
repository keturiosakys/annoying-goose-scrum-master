import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

// Create __dirname shim for ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const key = fs.readFileSync(
	path.resolve(__dirname, "private-key-pkcs8.key"),
	"utf8",
);

const base64 = Buffer.from(key).toString("base64");
console.log(base64);