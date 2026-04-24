# Optimized Prompts for Next.js + Vercel Deployment Projects

> Copy-paste these prompts for faster, cleaner results next time.
> Replace items in `[brackets]` with your own values.

---

## PROMPT 1 — Project Kickoff (Full Build)

```
Build and deploy a [description] website with the following spec:

TECH STACK:
- Next.js 14 (Pages Router), React 18
- [API name] REST API for data
- Chart.js v4 + react-chartjs-2 for charts (register ALL required controllers)
- Light theme, clean UI
- Deploy to Vercel via REST API

FEATURES:
- [Feature 1]
- [Feature 2]
- [Feature 3]

API CREDENTIALS:
- API Key: [your key]
- Base URL: [base URL]
- Endpoints needed: [list endpoints]

DEPLOYMENT:
- Vercel Token: [vcp_xxx]
- Project ID: [prj_xxx] (create new if none)
- Environment variable name: [ENV_VAR_NAME]

IMPORTANT RULES (follow strictly):
1. All hardcoded UI strings must be ASCII-only English — NO emoji, NO Unicode arrows (▲▼), NO Chinese characters in source code. API response data (names, labels from JSON) is fine.
2. When using Chart.js generic <Chart> component, register LineController AND BarController explicitly.
3. API proxy routes go in pages/api/ — never call external APIs from the frontend directly.
4. The sandbox cannot reach api.vercel.com — use browser javascript_tool via Chrome MCP from a vercel.com tab for all Vercel API calls.
5. Use fire-and-forget pattern for large fetch payloads: assign result to window._result, return 'fired', then poll window._result.
6. Vercel file download API returns {"data":"<base64>"} envelope — always use atob(json.data) to decode content.
7. After setting env vars, always redeploy so the new deployment picks them up.

Build all files locally first, then deploy in one shot.
```

---

## PROMPT 2 — Vercel Deploy Only (files already built)

```
Deploy the Next.js project to Vercel using these credentials:

- Vercel Token: [vcp_xxx]
- Project ID: [prj_xxx]
- Project name: [project-name]
- Environment variable: [ENV_VAR_NAME] = [value]

Files to deploy are in [local path].

DEPLOYMENT RULES:
1. Use browser javascript_tool from a vercel.com tab — sandbox cannot reach api.vercel.com directly.
2. POST to https://api.vercel.com/v13/deployments with target: "production".
3. Include projectSettings: { framework: "nextjs" } in the payload.
4. Use fire-and-forget: assign result to window._result, poll until READY.
5. Set env var via POST /v10/projects/{id}/env before deploying if not already set.
6. After deploy, verify the live URL by searching a test symbol and checking for errors in console.
```

---

## PROMPT 3 — Fix Garbled Text / Encoding Issue

```
The deployed site has garbled text (mojibake). Fix it by:

1. Replace ALL hardcoded UI strings in source code with plain ASCII English.
   - Remove ALL emoji (📈 🔍 ⚠️ etc.) from JSX/JS strings
   - Replace Unicode arrows ▲▼ with (+) and (-)
   - Replace Chinese labels with English equivalents
   - API response data (stock names etc.) is fine — leave as-is
   
2. The fix only applies to strings embedded in .js source files.
   Text that comes from API JSON responses will render fine regardless.

3. After editing, redeploy using the Vercel REST API from a vercel.com browser tab.
   Fetch unchanged files from the last good deployment using their UIDs,
   swap in the fixed files, and POST a new deployment.
```

---

## PROMPT 4 — Fix Chart.js "not a registered controller" Error

```
Fix the Chart.js error: "[type] is not a registered controller".

Root cause: When using the generic <Chart type="line"> or <Chart type="bar"> 
component from react-chartjs-2, Chart.js requires explicit controller registration.

Fix in components/StockChart.js (or wherever ChartJS.register is called):

import {
  Chart as ChartJS,
  CategoryScale, LinearScale,
  PointElement, LineElement, BarElement,
  LineController,   // <-- ADD THIS
  BarController,    // <-- ADD THIS
  Title, Tooltip, Legend, Filler,
} from 'chart.js';

ChartJS.register(
  CategoryScale, LinearScale,
  PointElement, LineElement, BarElement,
  LineController,   // <-- ADD THIS
  BarController,    // <-- ADD THIS
  Title, Tooltip, Legend, Filler
);

Then redeploy.
```

---

## PROMPT 5 — Redeploy with Minimal Changes (patch existing deployment)

```
Redeploy to Vercel with only [N] files changed. 
Use the existing deployment [dpl_xxx] as the base to avoid re-uploading everything.

Steps:
1. Get file tree: GET /v6/deployments/[dpl_xxx]/files
   Note: files appear under src/ prefix in tree, but deploy payload uses plain paths.
2. For each unchanged file, fetch content: GET /v7/deployments/[dpl_xxx]/files/{uid}
   Decode with atob(json.data) — the API wraps content in {"data":"<base64>"}.
3. Replace only the changed file(s) with new content.
4. POST new deployment to /v13/deployments with all files + target: "production".
5. Poll until READY, then test the live URL.

Do all fetch calls via javascript_tool from a vercel.com tab (not from sandbox).
Store result in window._result using fire-and-forget pattern.
```

---

## PROMPT 6 — Debug Unauthorized 401 from API

```
The app is returning 401 Unauthorized from [API name]. Debug and fix:

1. Check if env var is set on Vercel project:
   GET https://api.vercel.com/v9/projects/[PROJECT_ID]/env
   If envs array is empty or missing [ENV_VAR_NAME], the var is not set.

2. Add the env var:
   POST https://api.vercel.com/v10/projects/[PROJECT_ID]/env
   Body: { key: "[ENV_VAR_NAME]", value: "[api_key]", type: "encrypted", target: ["production","preview","development"] }

3. Redeploy — env vars only take effect on new deployments, not existing ones.

4. Verify by calling /api/[endpoint]?symbol=TEST directly from the browser
   and checking the response status and body.

Do all Vercel API calls via javascript_tool from vercel.com tab.
```

---

## PROMPT 7 — Post-Deployment Verification Checklist

```
Verify the deployed site at [URL] works correctly:

1. Navigate to the URL and confirm page title shows clean text (no garbled chars).
2. Enter stock code [e.g. 2330] and submit the search form.
3. Confirm:
   - Price card shows numeric values (no "--" for all fields)
   - Chart renders with visible MA5, MA20, MA60 lines
   - Volume bar chart appears below price chart
   - No console errors (check with read_console_messages)
   - No "is not a registered controller" errors
4. Check browser console for any JS errors.
5. If 401 Unauthorized, see Prompt 6.
6. If garbled text, see Prompt 3.
7. Report pass/fail for each item above.
```

---

## Quick Reference: Common Vercel API Calls

```javascript
const TOK = 'vcp_xxx'; // your token
const PROJECT = 'prj_xxx'; // your project ID

// List recent deployments
fetch('https://api.vercel.com/v6/deployments?projectId='+PROJECT+'&limit=5', {headers:{Authorization:'Bearer '+TOK}}).then(r=>r.json()).then(d=>console.log(d.deployments?.map(x=>({id:x.uid,url:x.url,state:x.readyState}))));

// Check deployment status
fetch('https://api.vercel.com/v13/deployments/dpl_xxx', {headers:{Authorization:'Bearer '+TOK}}).then(r=>r.json()).then(d=>console.log(d.readyState, d.url));

// Get file tree of a deployment
fetch('https://api.vercel.com/v6/deployments/dpl_xxx/files', {headers:{Authorization:'Bearer '+TOK}}).then(r=>r.json()).then(d=>console.log(JSON.stringify(d)));

// Download a file by UID (decode with atob!)
fetch('https://api.vercel.com/v7/deployments/dpl_xxx/files/UID', {headers:{Authorization:'Bearer '+TOK}}).then(r=>r.json()).then(j=>console.log(atob(j.data)));

// Add env var
fetch('https://api.vercel.com/v10/projects/'+PROJECT+'/env', {method:'POST',headers:{Authorization:'Bearer '+TOK,'Content-Type':'application/json'},body:JSON.stringify({key:'MY_KEY',value:'my_value',type:'encrypted',target:['production','preview','development']})}).then(r=>r.json()).then(console.log);
```

---

## Lessons Learned

| Problem | Prevention |
|---|---|
| Sandbox can't reach api.vercel.com | Always use browser javascript_tool from vercel.com tab for Vercel API calls |
| Tab crash loses window variables | Split large payloads; fetch 1-2 files at a time |
| Chinese/emoji chars corrupted | Use ASCII-only strings in all source files |
| Chart.js controller error | Always register LineController + BarController when using generic `<Chart>` |
| Vercel file API base64 envelope | Always `atob(json.data)`, never use raw response as file content |
| Env var not picked up | Env vars only apply to NEW deployments — always redeploy after adding vars |
| File tree uses `src/` prefix | Tree paths have `src/` prefix; deploy payload paths do NOT |
