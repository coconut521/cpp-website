/* One-off build helper: add v2 assets to the copied pages in v2/.
   The original site outside v2/ is never touched. */
import fs from "node:fs";
import path from "node:path";

const root = path.resolve("v2");
const pages = [
  "errors.html",
  "cheatsheets.html",
  "exam-pitfalls.html",
  "sorting.html",
  "templates/chapter-template.html",
  ...fs.readdirSync(path.join(root, "chapters"))
    .filter((f) => f.endsWith(".html"))
    .map((f) => "chapters/" + f)
];

for (const rel of pages) {
  const file = path.join(root, rel);
  let html = fs.readFileSync(file, "utf8");
  const prefix = rel.includes("/") ? "../" : "";

  if (!html.includes("assets/css/v2.css")) {
    html = html.replace(
      `<link rel="stylesheet" href="${prefix}assets/css/style.css">`,
      `<link rel="stylesheet" href="${prefix}assets/css/style.css">\n<link rel="stylesheet" href="${prefix}assets/css/v2.css">`
    );
  }

  const scripts = [
    "v2-config.js",
    "v2-core.js",
    "v2-lab.js"
  ];
  let add = "";
  for (const s of scripts) {
    if (!html.includes(`assets/js/${s}`)) {
      add += `<script src="${prefix}assets/js/${s}"></script>\n`;
    }
  }
  if (add) {
    html = html.replace("</body>", add + "</body>");
  }

  fs.writeFileSync(file, html, "utf8");
  console.log("updated", rel);
}
