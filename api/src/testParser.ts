import fs from "node:fs";
import path from "node:path";
import { parseNeisHtml } from "./neisParser";

const html = fs.readFileSync(path.join(__dirname, "..", "..", "Example.html"), "utf-8");
const result = parseNeisHtml(html);
console.log(JSON.stringify(result, null, 2));
