import { chromium } from "@playwright/test";
import { mkdir, writeFile } from "node:fs/promises";

const base = process.env.TEST_BASE_URL || "http://127.0.0.1:3001";
const outDir = "output/playwright/uiux-audit";
await mkdir(outDir, { recursive: true });

const chromePath =
  process.env.PLAYWRIGHT_CHROME_EXECUTABLE ||
  (process.platform === "win32"
    ? "C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe"
    : "/opt/google/chrome/chrome");

const browser = await chromium.launch({
  executablePath: chromePath,
  headless: true,
});

const routesToTest = [
  "/",
  "/platform",
  "/how-it-works",
  "/about",
  "/resources",
  "/contact",
  "/laptop-desktop-rental",
  "/it-device-procurement",
  "/device-as-a-service",
  "/resources/how-to-procure-laptops-for-a-growing-company",
  "/resources/what-is-device-as-a-service",
  "/resources/how-to-calculate-tco-for-business-laptops",
  "/confirmation"
];

const viewports = [
  { name: "mobile-390", width: 390, height: 844 },
  { name: "tablet-768", width: 768, height: 1024 },
  { name: "desktop-1440", width: 1440, height: 900 }
];

const themes = ["light", "dark"];

const auditResults = {
  timestamp: new Date().toISOString(),
  base,
  totalRoutes: routesToTest.length,
  summary: {
    passed: 0,
    warnings: 0,
    failures: 0,
  },
  overflows: [],
  hierarchyIssues: [],
  formIssues: [],
  buttonAnomalies: [],
  contrastFlags: [],
  consoleErrors: [],
  routeDetails: {}
};

try {
  for (const theme of themes) {
    for (const vp of viewports) {
      const context = await browser.newContext({
        viewport: { width: vp.width, height: vp.height },
        colorScheme: theme,
      });

      await context.addInitScript((th) => {
        try {
          sessionStorage.setItem("triyantra-intro-v1.2", "seen");
          localStorage.setItem("triyantra-theme", th);
          document.documentElement.setAttribute("data-theme", th);
        } catch {}
      }, theme);

      const page = await context.newPage();

      page.on("pageerror", (e) => {
        auditResults.consoleErrors.push({
          theme,
          viewport: vp.name,
          error: e.message
        });
      });

      page.on("console", (m) => {
        if (m.type() === "error") {
          auditResults.consoleErrors.push({
            theme,
            viewport: vp.name,
            error: m.text()
          });
        }
      });

      for (const route of routesToTest) {
        const fullUrl = `${base}${route}`;
        const key = `${route}__${vp.name}__${theme}`;
        
        await page.goto(fullUrl, { waitUntil: "load" });
        // Ensure theme is applied to DOM element
        await page.evaluate((th) => {
          document.documentElement.setAttribute("data-theme", th);
        }, theme);

        await page.waitForTimeout(600);

        const pageEvaluation = await page.evaluate(() => {
          const docEl = document.documentElement;
          const body = document.body;
          const scrollW = Math.max(docEl.scrollWidth, body.scrollWidth);
          const clientW = window.innerWidth;
          const hasOverflow = scrollW > clientW + 1;

          // Find offending elements if overflow
          const overflowingElements = [];
          if (hasOverflow) {
            const allElements = document.querySelectorAll("*");
            for (const el of allElements) {
              const r = el.getBoundingClientRect();
              if (r.right > clientW + 1.5) {
                overflowingElements.push({
                  tag: el.tagName,
                  className: typeof el.className === "string" ? el.className.slice(0, 80) : "",
                  id: el.id || "",
                  right: Math.round(r.right),
                  width: Math.round(r.width),
                  overflowDelta: Math.round(r.right - clientW)
                });
              }
            }
          }

          // Heading Hierarchy
          const headings = [...document.querySelectorAll("h1, h2, h3, h4")].map(h => {
            const cs = getComputedStyle(h);
            const r = h.getBoundingClientRect();
            return {
              tag: h.tagName,
              text: (h.textContent || "").trim().slice(0, 50),
              fontSize: parseFloat(cs.fontSize),
              fontWeight: cs.fontWeight,
              lineHeight: parseFloat(cs.lineHeight) || cs.lineHeight,
              width: Math.round(r.width),
              height: Math.round(r.height),
            };
          });

          const h1Count = headings.filter(h => h.tag === "H1").length;

          // Buttons
          const buttons = [...document.querySelectorAll("button, a.button, a.btn, .nav-quote, .cta-button")].map(b => {
            const cs = getComputedStyle(b);
            const r = b.getBoundingClientRect();
            return {
              text: (b.textContent || "").trim().slice(0, 30),
              tag: b.tagName,
              w: Math.round(r.width),
              h: Math.round(r.height),
              radius: cs.borderRadius,
              bg: cs.backgroundColor,
              color: cs.color,
              border: cs.border,
            };
          });

          // Form Controls
          const forms = [...document.querySelectorAll("form")].map(f => {
            const inputs = [...f.querySelectorAll("input, select, textarea")].map(inp => {
              const cs = getComputedStyle(inp);
              const r = inp.getBoundingClientRect();
              const label = f.querySelector(`label[for="${inp.id}"]`) || inp.closest("label");
              return {
                id: inp.id,
                name: inp.getAttribute("name"),
                type: inp.getAttribute("type") || inp.tagName.toLowerCase(),
                w: Math.round(r.width),
                h: Math.round(r.height),
                hasLabel: !!label,
                labelText: label ? (label.textContent || "").trim().slice(0, 30) : null,
                fontSize: cs.fontSize,
                border: cs.border,
                bg: cs.backgroundColor,
              };
            });
            return {
              id: f.id || f.className,
              inputCount: inputs.length,
              inputs,
            };
          });

          // Cards & Spacing
          const cards = [...document.querySelectorAll(".card, article, .solution-card, .service-card, .metric-card, .portal-window, .pricing-card, .contact-card")].slice(0, 10).map(c => {
            const cs = getComputedStyle(c);
            const r = c.getBoundingClientRect();
            return {
              cls: c.className.slice(0, 50),
              padding: cs.padding,
              margin: cs.margin,
              radius: cs.borderRadius,
              border: cs.border,
              w: Math.round(r.width),
              h: Math.round(r.height),
            };
          });

          return {
            scrollW,
            clientW,
            hasOverflow,
            overflowingElements: overflowingElements.slice(0, 5),
            h1Count,
            headings: headings.slice(0, 10),
            buttons: buttons.slice(0, 10),
            forms,
            cards,
          };
        });

        auditResults.routeDetails[key] = pageEvaluation;

        // Take top-of-page screenshot for audit evidence
        const cleanRoute = route === "/" ? "home" : route.replace(/[^a-z0-9]+/gi, "-").replace(/^-|-$/g, "");
        const ssName = `${cleanRoute}__${vp.name}__${theme}.png`;
        await page.screenshot({ path: `${outDir}/${ssName}`, fullPage: false });

        if (pageEvaluation.hasOverflow) {
          auditResults.summary.failures++;
          auditResults.overflows.push({
            route,
            viewport: vp.name,
            theme,
            scrollW: pageEvaluation.scrollW,
            clientW: pageEvaluation.clientW,
            delta: pageEvaluation.scrollW - pageEvaluation.clientW,
            elements: pageEvaluation.overflowingElements
          });
        } else {
          auditResults.summary.passed++;
        }

        if (pageEvaluation.h1Count !== 1) {
          auditResults.hierarchyIssues.push({
            route,
            viewport: vp.name,
            theme,
            h1Count: pageEvaluation.h1Count,
            message: pageEvaluation.h1Count === 0 ? "Missing H1 tag" : "Multiple H1 tags"
          });
        }

        // Form checks
        for (const f of pageEvaluation.forms) {
          for (const inp of f.inputs) {
            if (!inp.hasLabel && inp.type !== "hidden") {
              auditResults.formIssues.push({
                route,
                viewport: vp.name,
                inputId: inp.id || inp.name,
                type: inp.type,
                issue: "Missing associated label"
              });
            }
          }
        }
      }

      await context.close();
      console.log(`[AUDIT] Done viewport: ${vp.name}, theme: ${theme}`);
    }
  }

  // Save audit report
  const reportPath = `${outDir}/uiux-audit-data.json`;
  await writeFile(reportPath, JSON.stringify(auditResults, null, 2));
  console.log(`\n========================================`);
  console.log(`[AUDIT COMPLETE] Results saved to ${reportPath}`);
  console.log(`Total checks: ${auditResults.summary.passed + auditResults.summary.failures}`);
  console.log(`Passed: ${auditResults.summary.passed}`);
  console.log(`Overflow Failures: ${auditResults.overflows.length}`);
  console.log(`Hierarchy Issues: ${auditResults.hierarchyIssues.length}`);
  console.log(`Form Issues: ${auditResults.formIssues.length}`);
  console.log(`Console Errors: ${auditResults.consoleErrors.length}`);
  console.log(`========================================\n`);

  if (auditResults.overflows.length > 0) {
    console.log("OVERFLOWS FOUND:", JSON.stringify(auditResults.overflows, null, 2));
  }
  if (auditResults.hierarchyIssues.length > 0) {
    console.log("HIERARCHY ISSUES:", JSON.stringify(auditResults.hierarchyIssues, null, 2));
  }
  if (auditResults.formIssues.length > 0) {
    console.log("FORM ISSUES:", JSON.stringify(auditResults.formIssues, null, 2));
  }

} finally {
  await browser.close();
}
