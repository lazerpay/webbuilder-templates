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

let indexJson = [];
if (fs.existsSync(INDEX_JSON_PATH)) {
	try {
		indexJson = JSON.parse(fs.readFileSync(INDEX_JSON_PATH, "utf-8"));
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
	const imagesPath = path.join(templatePath, "images");
	const cssPath = path.join(templatePath, "css");
	const thumbnailPath = path.join(templatePath, "thumbnail", "thumbnail.png");

	if (!fs.existsSync(htmlPath)) {
		console.log(`⏩ Skipping ${folderName}: no index.html`);
		return;
	}

	if (!fs.existsSync(imagesPath) || !fs.readdirSync(imagesPath).length) {
		console.log(
			`⏩ Skipping ${folderName}: images folder missing or empty`
		);
		return;
	}

	// ---- STEP 1: Update HTML references
	const BASE_IMAGE_URL = `https://raw.githubusercontent.com/${USERNAME}/${REPO}/${BRANCH}/templates/${folderName}/images/`;
	const BASE_CSS_URL = `https://raw.githubusercontent.com/${USERNAME}/${REPO}/${BRANCH}/templates/${folderName}/css/`;

	let html = fs.readFileSync(htmlPath, "utf-8");

	// Replace image src
	html = html.replace(
		new RegExp(`src=["']images/([^"']+)["']`, "g"),
		`src="${BASE_IMAGE_URL}$1"`
	);

	// Replace background image urls
	html = html.replace(
		new RegExp(`url\\(['"]?images/([^"')]+)["']?\\)`, "g"),
		`url('${BASE_IMAGE_URL}$1')`
	);

	// Replace <link rel="stylesheet" href="css/..."
	html = html.replace(
		new RegExp(`href=["']css/([^"']+)["']`, "g"),
		`href="${BASE_CSS_URL}$1"`
	);

	fs.writeFileSync(htmlPath, html);
	console.log(`✅ Updated HTML for ${folderName}`);

	// ---- STEP 2: Collect CSS URLs
	let cssUrls = [];
	if (fs.existsSync(cssPath)) {
		const cssFiles = fs
			.readdirSync(cssPath)
			.filter((file) => file.endsWith(".css"));
		cssUrls = cssFiles.map(
			(file) =>
				`https://raw.githubusercontent.com/${USERNAME}/${REPO}/${BRANCH}/templates/${folderName}/css/${file}`
		);
	}

	// ---- STEP 3: Append to index.json if not already there
	const id = folderName.toLowerCase();
	const alreadyExists = indexJson.find((entry) => entry.id === id);
	if (alreadyExists) {
		console.log(
			`🔁 Skipping index.json entry for ${folderName} (already exists)`
		);
		return;
	}

	const htmlUrl = `https://raw.githubusercontent.com/${USERNAME}/${REPO}/${BRANCH}/templates/${folderName}/index.html`;
	const thumbnailUrl = fs.existsSync(thumbnailPath)
		? `https://raw.githubusercontent.com/${USERNAME}/${REPO}/${BRANCH}/templates/${folderName}/thumbnail/thumbnail.png`
		: "";

	indexJson.push({
		id,
		name: folderName,
		description: "A simple HTML template.",
		htmlUrl,
		cssUrls,
		thumbnailUrl,
	});

	console.log(`➕ Added ${folderName} to index.json`);
});

// ---- STEP 4: Write updated index.json
fs.writeFileSync(INDEX_JSON_PATH, JSON.stringify(indexJson, null, 2));
console.log("✅ index.json updated successfully.");
