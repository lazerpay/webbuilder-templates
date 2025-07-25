const fs = require("fs");
const path = require("path");

const USERNAME = "lazerpay";
const REPO = "webbuilder-templates";
const BRANCH = "main";

const TEMPLATES_DIR = path.join(__dirname, "templates");
const INDEX_JSON_PATH = path.join(__dirname, "index.json");

if (!fs.existsSync(TEMPLATES_DIR)) {
	console.error("❌ 'templates' directory not found.");
	process.exit(1);
}

// Load or initialize index.json
let indexJson = [];
if (fs.existsSync(INDEX_JSON_PATH)) {
	try {
		const parsed = JSON.parse(fs.readFileSync(INDEX_JSON_PATH, "utf-8"));
		indexJson = Array.isArray(parsed) ? parsed : [];
	} catch (err) {
		console.error("❌ Failed to parse existing index.json:", err);
		process.exit(1);
	}
}

const templateFolders = fs
	.readdirSync(TEMPLATES_DIR)
	.filter((file) =>
		fs.statSync(path.join(TEMPLATES_DIR, file)).isDirectory()
	);

templateFolders.forEach((folderName) => {
	const templatePath = path.join(TEMPLATES_DIR, folderName);
	const htmlPath = path.join(templatePath, "index.html");
	const cssPath = path.join(templatePath, "styles.css");
	const thumbnailPath = path.join(templatePath, "thumbnail.png");

	if (!fs.existsSync(htmlPath)) {
		console.log(`⏩ Skipping ${folderName}: index.html not found`);
		return;
	}

	// === Step 1: Rewrite URLs in HTML ===
	const BASE_URL = `https://raw.githubusercontent.com/${USERNAME}/${REPO}/${BRANCH}/templates/${folderName}/`;

	let html = fs.readFileSync(htmlPath, "utf-8");

	// Replace image references
	html = html.replace(
		/src=["']images\/([^"']+)["']/g,
		`src="${BASE_URL}images/$1"`
	);

	html = html.replace(
		/url\(['"]?images\/([^"')]+)['"]?\)/g,
		`url('${BASE_URL}images/$1')`
	);

	// Replace styles.css reference
	html = html.replace(
		/href=["']styles\.css["']/g,
		`href="${BASE_URL}styles.css"`
	);

	// Overwrite updated HTML
	fs.writeFileSync(htmlPath, html);
	console.log(`✅ Updated HTML in ${folderName}/index.html`);

	// === Step 2: Add to index.json ===
	const id = folderName.toLowerCase();
	if (indexJson.find((entry) => entry.id === id)) {
		console.log(`🔁 Skipping ${folderName}: already exists in index.json`);
		return;
	}

	const htmlUrl = `${BASE_URL}index.html`;
	const cssUrl = `${BASE_URL}styles.css`;
	const thumbnailUrl = fs.existsSync(thumbnailPath)
		? `${BASE_URL}thumbnail.png`
		: "";

	indexJson.push({
		id,
		name: folderName,
		description: "A simple HTML template.",
		htmlUrl,
		cssUrl,
		thumbnailUrl,
	});

	console.log(`➕ Added ${folderName} to index.json`);
});

// === Step 3: Write index.json ===
fs.writeFileSync(INDEX_JSON_PATH, JSON.stringify(indexJson, null, 2));
console.log("✅ index.json updated successfully.");
