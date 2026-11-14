// Budget de qualité Lighthouse (npm run lighthouse) : échoue si une page passe sous les seuils.
// Lance le serveur du site, audite les pages clés sur mobile (simulation 4G) et sur ordinateur.
import { spawn } from "node:child_process";
import { mkdirSync, writeFileSync } from "node:fs";
import lighthouse from "lighthouse";
import * as chromeLauncher from "chrome-launcher";
import { chromium } from "@playwright/test";

const PORT = Number(process.env.LH_PORT || 4180);
const BASE = `http://localhost:${PORT}`;
const PAGES = ["/", "/catalogue?lang=fr", "/domaines", "/communaute", "/contribuer", "/docs?doc=README.md", "/mentions-legales"];

// Seuils (0 à 1) et limites de stabilité. Les scores actuels sont à 0,91–1 : on garde une marge pour le bruit de mesure.
const BUDGET = { performance: 0.8, accessibility: 0.98, "best-practices": 0.95, seo: 0.95 };
const MAX_CLS = 0.1;

const server = spawn(process.execPath, ["scripts/serve.mjs"], { env: { ...process.env, PORT: String(PORT) }, stdio: "ignore" });
const stopServer = () => server.kill();
process.on("exit", stopServer);

async function waitForServer() {
  for (let i = 0; i < 50; i += 1) {
    try {
      if ((await fetch(BASE)).ok) return;
    } catch {
      /* pas encore prêt */
    }
    await new Promise((resolve) => setTimeout(resolve, 200));
  }
  throw new Error("Le serveur du site ne démarre pas.");
}

await waitForServer();
const chrome = await chromeLauncher.launch({
  chromePath: process.env.CHROMIUM_PATH || chromium.executablePath(),
  chromeFlags: ["--headless=new", "--no-sandbox"]
});
const failures = [];
const rows = [];

try {
  for (const form of ["mobile", "desktop"]) {
    for (const path of PAGES) {
      const { lhr } = await lighthouse(BASE + path, {
        port: chrome.port,
        output: "json",
        logLevel: "error",
        formFactor: form,
        onlyCategories: Object.keys(BUDGET),
        screenEmulation:
          form === "mobile"
            ? { mobile: true, width: 390, height: 844, deviceScaleFactor: 2, disabled: false }
            : { mobile: false, width: 1350, height: 940, deviceScaleFactor: 1, disabled: false }
      });
      const scores = Object.fromEntries(Object.keys(BUDGET).map((key) => [key, lhr.categories[key].score]));
      const cls = lhr.audits["cumulative-layout-shift"].numericValue;
      rows.push({ form, path, scores, cls });
      for (const [key, min] of Object.entries(BUDGET))
        if (scores[key] < min) failures.push(`${form} ${path} : ${key} ${Math.round(scores[key] * 100)} < ${Math.round(min * 100)}`);
      if (cls > MAX_CLS) failures.push(`${form} ${path} : CLS ${cls.toFixed(3)} > ${MAX_CLS}`);
      console.log(
        `${form.padEnd(7)} ${path.padEnd(24)} perf ${Math.round(scores.performance * 100)} a11y ${Math.round(scores.accessibility * 100)} bp ${Math.round(scores["best-practices"] * 100)} seo ${Math.round(scores.seo * 100)} CLS ${cls.toFixed(3)}`
      );
    }
  }
} finally {
  await chrome.kill();
  stopServer();
}

mkdirSync("lighthouse-report", { recursive: true });
writeFileSync("lighthouse-report/summary.json", JSON.stringify({ budget: BUDGET, maxCls: MAX_CLS, rows }, null, 2));
if (failures.length) {
  console.error(`\nBudget dépassé (${failures.length}) :\n- ${failures.join("\n- ")}`);
  process.exit(1);
}
console.log("\nBudget Lighthouse respecté.");
