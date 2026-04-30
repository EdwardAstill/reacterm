# Reacterm Neovim File Handoff Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use subagent-driven-development to implement this plan task-by-task when tasks are independent. For same-session manual execution, follow this plan directly. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build the Option A MVP where `:ReactermOpen` opens the current Neovim file in the playground page, the page loads/saves that file through a guarded local API, and Run keeps using the current editor contents.

**Machine plan:** `docs/plans/2026-04-29-reacterm-nvim-file-handoff-plan.yaml`

**Architecture:** Add a small file API module and wire it into `playground/server.mjs` before static routing. Extend the existing browser playground editor with file-load/save state. Add a plain Lua Neovim plugin that builds and opens the file URL without a daemon.

**Tech Stack:** Node HTTP server, `ws`, browser DOM + xterm page, Vitest, Neovim Lua.

**Recommended Skills:** `warden:test-driven-development`, `warden:typescript`, `warden:tui`, `warden:documentation`, `warden:security-review`, `warden:verification-before-completion`

**Recommended MCPs:** none

---

## File Structure

- Create `playground/file-api.mjs` for token validation, root/path checks, read/save API responses, and conflict checks.
- Modify `playground/server.mjs` to export a testable server factory, install the file API routes, preserve the WebSocket run path, and keep CLI startup behavior.
- Modify `playground/public/index.html` to load a file from URL params, show loaded-file/dirty/save status, and save with `Ctrl+S`.
- Create `integrations/reacterm.nvim/lua/reacterm/init.lua` for plugin configuration, URL construction, and opening.
- Create `integrations/reacterm.nvim/plugin/reacterm.lua` for command registration.
- Create `integrations/reacterm.nvim/README.md` for setup and MVP limitations.
- Create `src/__tests__/playground-file-api.test.ts` for server/API behavior.
- Optionally create `tests/nvim/reacterm-url.test.lua` if the implementer prefers a Lua file over inline headless Neovim checks.

---

### Task 1: File API Contract and Guarded Filesystem Helpers

**Files:**
- Create: `playground/file-api.mjs`
- Create: `src/__tests__/playground-file-api.test.ts`

**Invoke skill:** `@warden:test-driven-development` before starting this task.
**Invoke skill:** `@warden:typescript` for the Vitest test file.

- [ ] **Step 1: Write failing tests for allowed read, allowed save, conflict, invalid token, and outside-root rejection**

Create `src/__tests__/playground-file-api.test.ts` with tests shaped like:

```ts
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join, resolve } from "node:path";
import { createServer } from "node:http";
import { createFileApi, handleFileApiRequest } from "../../playground/file-api.mjs";

function listen(api: ReturnType<typeof createFileApi>) {
  const server = createServer((req, res) => {
    if (!handleFileApiRequest(req, res, api)) {
      res.writeHead(404).end("not found");
    }
  });
  return new Promise<{ baseUrl: string; close: () => Promise<void> }>((resolveListen) => {
    server.listen(0, "127.0.0.1", () => {
      const address = server.address();
      if (!address || typeof address === "string") throw new Error("bad address");
      resolveListen({
        baseUrl: `http://127.0.0.1:${address.port}`,
        close: () => new Promise((resolveClose) => server.close(() => resolveClose())),
      });
    });
  });
}
```

Cover these assertions:

- `GET /api/file?path=<inside>&token=test-token` returns 200 JSON with `content`.
- `PUT /api/file` writes content and returns fresh `mtimeMs`.
- `PUT /api/file` with stale `baseMtimeMs` returns 409 and does not overwrite.
- Missing/incorrect token returns 401.
- A real path outside the allowed root returns 403.
- Encoded traversal that resolves outside the root returns 403.

- [ ] **Step 2: Run tests to verify they fail**

Run: `npm test -- src/__tests__/playground-file-api.test.ts`

Expected: FAIL because `playground/file-api.mjs` does not exist or exports are missing.

- [ ] **Step 3: Implement `playground/file-api.mjs`**

Implement these exports:

```js
export const DEFAULT_MAX_FILE_BYTES = 1024 * 1024;

export function createFileApi(options) {
  return {
    allowedRoot: realpathSync(options.allowedRoot),
    token: options.token,
    maxFileBytes: options.maxFileBytes ?? DEFAULT_MAX_FILE_BYTES,
  };
}

export function handleFileApiRequest(req, res, api) {
  const url = new URL(req.url ?? "/", "http://127.0.0.1");
  if (url.pathname !== "/api/file") return false;
  if (req.method === "GET") { /* validate token, read file, JSON */ return true; }
  if (req.method === "PUT") { /* parse JSON, validate token, conflict check, write */ return true; }
  res.writeHead(405, { "content-type": "application/json" }).end(JSON.stringify({ ok: false, error: "method_not_allowed" }));
  return true;
}
```

Required helper behavior:

- Use `realpathSync` for the root and existing file paths.
- For writes to existing files, realpath the target before writing.
- Reject non-existing write targets in the MVP unless the spec is revised.
- Check `realTarget === allowedRoot || realTarget.startsWith(allowedRoot + path.sep)`.
- Use `statSync` to reject directories and files larger than `maxFileBytes`.
- Compare `baseMtimeMs` against current `stat.mtimeMs`; return 409 if changed.
- Return JSON for every API response.

- [ ] **Step 4: Run tests to verify they pass**

Run: `npm test -- src/__tests__/playground-file-api.test.ts`

Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add playground/file-api.mjs src/__tests__/playground-file-api.test.ts
git commit -m "feat(playground): add guarded file api"
```

---

### Task 2: Wire File API Into Playground Server

**Files:**
- Modify: `playground/server.mjs`
- Modify: `src/__tests__/playground-file-api.test.ts`

**Invoke skill:** `@warden:test-driven-development` before starting this task.
**Invoke skill:** `@warden:typescript` for tests and Node interop.

- [ ] **Step 1: Add failing server-factory coverage**

Extend `src/__tests__/playground-file-api.test.ts` to import a server factory from `playground/server.mjs`:

```ts
import { createPlaygroundServer } from "../../playground/server.mjs";
```

Add a test that starts the server on port `0` with `{ token: "test-token", root: tmpRoot }`, fetches `/api/file`, and verifies 200. Add a second smoke test that fetches `/index.html` or `/` and verifies the static page still contains `Storm Playground`.

- [ ] **Step 2: Run tests to verify they fail**

Run: `npm test -- src/__tests__/playground-file-api.test.ts`

Expected: FAIL because `createPlaygroundServer` is not exported and/or importing `server.mjs` starts the server as a side effect.

- [ ] **Step 3: Refactor `playground/server.mjs` into a testable factory**

Keep existing behavior but wrap it:

```js
import { randomBytes } from "node:crypto";
import { pathToFileURL } from "node:url";
import { createFileApi, handleFileApiRequest } from "./file-api.mjs";

export function createPlaygroundServer(options = {}) {
  const root = options.root ?? process.env.REACTERM_PLAYGROUND_ROOT ?? PROJECT_ROOT;
  const token = options.token ?? process.env.REACTERM_PLAYGROUND_TOKEN ?? randomBytes(16).toString("hex");
  const fileApi = createFileApi({ allowedRoot: root, token });

  const server = createServer((req, res) => {
    if (handleFileApiRequest(req, res, fileApi)) return;
    // existing static handler
  });

  const wss = new WebSocketServer({ server });
  // existing websocket run/input/stop wiring

  return { server, token, root };
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  const app = createPlaygroundServer();
  tryListen(app.server, Number(PORT), app);
}
```

Update `tryListen` so it accepts `server` rather than closing over a module-level server. Print:

```text
Storm Playground
http://localhost:<port>
token: <token>
```

- [ ] **Step 4: Run tests to verify they pass**

Run: `npm test -- src/__tests__/playground-file-api.test.ts`

Expected: PASS.

- [ ] **Step 5: Smoke the CLI server manually**

Run: `REACTERM_PLAYGROUND_TOKEN=test-token PORT=3777 node playground/server.mjs`

Expected: stdout includes `Storm Playground`, `http://localhost:3777`, and `token: test-token`. Stop it with `Ctrl+C`.

- [ ] **Step 6: Commit**

```bash
git add playground/server.mjs src/__tests__/playground-file-api.test.ts
git commit -m "feat(playground): wire file api into server"
```

---

### Task 3: Browser File Load, Dirty State, and Save UI

**Files:**
- Modify: `playground/public/index.html`

**Invoke skill:** `@warden:typescript` for browser JavaScript structure.
**Invoke skill:** `@warden:tui` for preserving playground UX and terminal workflow.

- [ ] **Step 1: Add UI affordances before wiring behavior**

Modify the top bar or editor header to include:

```html
<button class="btn btn-save" id="btn-save" disabled>Save</button>
<div class="topbar-status" id="file-status">
  <span id="file-status-text">No file</span>
</div>
```

Add CSS for `.btn-save`, dirty/error status colors, and make sure the top bar still fits at narrow widths.

- [ ] **Step 2: Add file-session state variables in the existing script**

Add near current DOM refs:

```js
const btnSave = document.getElementById("btn-save");
const fileStatusText = document.getElementById("file-status-text");
let loadedPath = null;
let loadedToken = null;
let loadedMtimeMs = null;
let dirty = false;
let loadingFile = false;
```

- [ ] **Step 3: Implement load helpers**

Add helpers:

```js
function fileBaseName(path) {
  return String(path || "").split(/[\\/]/).pop() || "file";
}

function setFileStatus(text, cls) {
  fileStatusText.textContent = text;
  fileStatusText.dataset.state = cls || "";
}

function setDirty(next) {
  dirty = next;
  btnSave.disabled = !loadedPath || loadingFile || !dirty;
  if (loadedPath) setFileStatus(dirty ? "Unsaved" : "Saved", dirty ? "dirty" : "clean");
}

async function loadFileFromQuery() {
  const params = new URLSearchParams(location.search);
  const file = params.get("file");
  const token = params.get("token");
  if (!file) return false;
  loadedToken = token || "";
  loadingFile = true;
  const res = await fetch(`/api/file?path=${encodeURIComponent(file)}&token=${encodeURIComponent(loadedToken)}`);
  const body = await res.json();
  if (!res.ok) throw new Error(body.message || body.error || "Failed to load file");
  loadedPath = body.path;
  loadedMtimeMs = body.mtimeMs;
  editor.value = body.content;
  editorFname.textContent = "\u00a0-- " + fileBaseName(body.path);
  updateLineNumbers();
  loadingFile = false;
  setDirty(false);
  return true;
}
```

- [ ] **Step 4: Implement save**

```js
async function saveLoadedFile() {
  if (!loadedPath || !dirty) return;
  btnSave.disabled = true;
  setFileStatus("Saving...", "saving");
  const res = await fetch("/api/file", {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      path: loadedPath,
      token: loadedToken,
      baseMtimeMs: loadedMtimeMs,
      content: editor.value,
    }),
  });
  const body = await res.json();
  if (!res.ok || body.ok === false) {
    setFileStatus(body.error === "conflict" ? "Conflict" : "Save failed", "error");
    btnSave.disabled = false;
    return;
  }
  loadedMtimeMs = body.mtimeMs;
  setDirty(false);
}
```

- [ ] **Step 5: Hook into existing editor/example behavior**

- On editor input, call `setDirty(true)` only when `loadedPath` is set.
- On example selection, clear `loadedPath`, `loadedToken`, `loadedMtimeMs`, and dirty state.
- On initial load, call `loadFileFromQuery()`; if it returns false, keep `loadExample("dashboard")`.
- Bind Save button click.
- Extend existing keydown handler so `Ctrl+S` / `Cmd+S` prevents default and calls `saveLoadedFile()` when a file is loaded.
- Leave Run behavior unchanged; it still sends `editor.value`.

- [ ] **Step 6: Manual browser check**

Run server:

```bash
REACTERM_PLAYGROUND_TOKEN=test-token PORT=3777 node playground/server.mjs
```

Open:

```text
http://127.0.0.1:3777/?file=<encoded absolute path to examples/reacterm-demo.tsx>&token=test-token
```

Expected: textarea loads the file, filename changes, Save is disabled until edit, edit marks Unsaved, `Ctrl+S` saves and returns to Saved.

- [ ] **Step 7: Commit**

```bash
git add playground/public/index.html
git commit -m "feat(playground): load and save files from url"
```

---

### Task 4: Neovim Plugin Command and URL Construction

**Files:**
- Create: `integrations/reacterm.nvim/lua/reacterm/init.lua`
- Create: `integrations/reacterm.nvim/plugin/reacterm.lua`

**Invoke skill:** `@warden:test-driven-development` before starting this task.

- [ ] **Step 1: Write the failing headless Neovim check**

Run this before plugin files exist:

```bash
nvim --headless -u NONE \
  -c 'set rtp+=integrations/reacterm.nvim' \
  -c 'lua require("reacterm").setup({ token = "test-token", open = function(url) _G.url = url end })' \
  -c 'edit examples/reacterm-demo.tsx' \
  -c 'ReactermOpen' \
  -c 'lua assert(_G.url:match("file=") and _G.url:match("token=test%-token"))' \
  -c 'qa'
```

Expected: FAIL because module/command does not exist.

- [ ] **Step 2: Implement `lua/reacterm/init.lua`**

Implement:

```lua
local M = {}

local config = {
  host = "127.0.0.1",
  port = 3777,
  token = nil,
  open = nil,
}

local function urlencode(str)
  return tostring(str):gsub("\n", "\r\n"):gsub("([^%w%-%_%.%~])", function(c)
    return string.format("%%%02X", string.byte(c))
  end)
end

function M.setup(opts)
  config = vim.tbl_extend("force", config, opts or {})
end

function M.build_url(path)
  local absolute = vim.fn.fnamemodify(path, ":p")
  local url = string.format("http://%s:%s/?file=%s", config.host, tostring(config.port), urlencode(absolute))
  if config.token and config.token ~= "" then
    url = url .. "&token=" .. urlencode(config.token)
  end
  return url
end

local function open_url(url)
  if config.open then return config.open(url) end
  if vim.ui and vim.ui.open then return vim.ui.open(url) end
  local opener = vim.fn.has("mac") == 1 and "open"
    or vim.fn.has("win32") == 1 and "cmd"
    or "xdg-open"
  if opener == "cmd" then
    vim.fn.jobstart({ "cmd", "/c", "start", "", url }, { detach = true })
  else
    vim.fn.jobstart({ opener, url }, { detach = true })
  end
end

function M.open(path)
  local target = path
  if not target or target == "" then
    target = vim.api.nvim_buf_get_name(0)
  end
  if not target or target == "" then
    vim.notify("ReactermOpen needs a file-backed buffer or path", vim.log.levels.ERROR)
    return
  end
  if vim.bo.modified then
    local choice = vim.fn.confirm("Buffer has unsaved changes. Write before opening?", "&Write\n&Open anyway\n&Cancel", 1)
    if choice == 1 then vim.cmd.write()
    elseif choice ~= 2 then return end
  end
  open_url(M.build_url(target))
end

return M
```

- [ ] **Step 3: Implement command registration**

Create `integrations/reacterm.nvim/plugin/reacterm.lua`:

```lua
if vim.g.loaded_reacterm_nvim == 1 then
  return
end
vim.g.loaded_reacterm_nvim = 1

vim.api.nvim_create_user_command("ReactermOpen", function(opts)
  require("reacterm").open(opts.args)
end, {
  nargs = "?",
  complete = "file",
})
```

- [ ] **Step 4: Run headless Neovim check**

Run the command from Step 1.

Expected: exit 0.

- [ ] **Step 5: Add an empty-buffer failure smoke check**

Run:

```bash
nvim --headless -u NONE \
  -c 'set rtp+=integrations/reacterm.nvim' \
  -c 'lua require("reacterm").setup({ open = function(url) _G.url = url end })' \
  -c 'enew' \
  -c 'ReactermOpen' \
  -c 'lua assert(_G.url == nil)' \
  -c 'qa'
```

Expected: exit 0, with a Neovim notification/error but no URL.

- [ ] **Step 6: Commit**

```bash
git add integrations/reacterm.nvim/lua/reacterm/init.lua integrations/reacterm.nvim/plugin/reacterm.lua
git commit -m "feat(nvim): open playground for current file"
```

---

### Task 5: Plugin Documentation

**Files:**
- Create: `integrations/reacterm.nvim/README.md`

**Invoke skill:** `@warden:documentation` before starting this task.

- [ ] **Step 1: Write README**

Include:

```md
# reacterm.nvim

Open the current Neovim file in the Reacterm playground browser page.

## Setup

```lua
require("reacterm").setup({
  host = "127.0.0.1",
  port = 3777,
  token = "paste token from playground startup",
})
```

## Usage

```vim
:ReactermOpen
:ReactermOpen path/to/file.tsx
```

Start the playground first:

```bash
REACTERM_PLAYGROUND_TOKEN=test-token npm run playground
```

## MVP limitation

This is a file handoff. Browser edits save back to disk with `Ctrl+S`; it is not live Neovim buffer sync.
```
```

- [ ] **Step 2: Check docs render as plain markdown**

Run: `sed -n '1,220p' integrations/reacterm.nvim/README.md`

Expected: content includes setup, command usage, token configuration, and MVP limitation.

- [ ] **Step 3: Commit**

```bash
git add integrations/reacterm.nvim/README.md
git commit -m "docs(nvim): document reacterm file handoff"
```

---

### Task 6 (final): Spec Acceptance + Post-Implementation Review

**Files:**
- Modify: `docs/specs/2026-04-29-reacterm-nvim-file-handoff-design.md` (fill `Known Limitations` and `Post-Implementation Review` blocks)

**Invoke skill:** `@warden:verification-before-completion` before starting this task.
**Invoke skill:** `@warden:security-review` if any path/token behavior changed from the spec.

- [ ] **Step 1: Re-read the spec's Acceptance Criteria block**

Open `docs/specs/2026-04-29-reacterm-nvim-file-handoff-design.md`. Hold the criteria in context.

- [ ] **Step 2: Run every acceptance item, fresh, in one batch**

Run:

```bash
npm test -- src/__tests__/playground-file-api.test.ts
npm run build
```

Then start the server for HTTP/browser/manual checks:

```bash
REACTERM_PLAYGROUND_TOKEN=test-token PORT=3777 node playground/server.mjs
```

In another shell, run:

```bash
curl -i "http://127.0.0.1:3777/api/file?path=$(node -e 'console.log(encodeURIComponent(process.cwd()+"/examples/reacterm-demo.tsx"))')&token=test-token"
curl -i "http://127.0.0.1:3777/api/file?path=$(node -e 'console.log(encodeURIComponent("/etc/passwd"))')&token=test-token"
```

Run the Neovim acceptance:

```bash
nvim --headless -u NONE -c 'set rtp+=integrations/reacterm.nvim' -c 'lua require("reacterm").setup({ token = "test-token", open = function(url) _G.url = url end })' -c 'edit examples/reacterm-demo.tsx' -c 'ReactermOpen' -c 'lua assert(_G.url:match("file=") and _G.url:match("token=test%-token"))' -c 'qa'
```

Manually open:

```text
http://127.0.0.1:3777/?file=<encoded absolute repo file>&token=test-token
```

For each spec acceptance item: capture output, mark pass / known-limit / fail.

- [ ] **Step 3: Resolve every fail**

For each failing item, choose one path:

1. Fix it, re-run, mark pass.
2. After 2-3 different approaches, log it under `Known Limitations` with root cause, tried approaches, and decision. Then mark known-limit.

Never leave fail items.

- [ ] **Step 4: Fill the Post-Implementation Review block in the spec**

Three subsections:

- Acceptance results - paste verification output for each item.
- Scope drift - list every change beyond spec. For each: justify or revert.
- Refactor proposals - list noticed-but-not-executed improvements with trigger conditions.

- [ ] **Step 5: Surface limitations to user**

If `Known Limitations` is non-empty, summarise to the user: which acceptance items did not pass, what blocks them, suggested next step. The user decides whether the work ships as-is or needs another pass.

- [ ] **Step 6: Commit**

```bash
git add docs/specs/2026-04-29-reacterm-nvim-file-handoff-design.md
git commit -m "docs(spec): review reacterm nvim file handoff"
```

Only after this task's six steps complete may the executing agent claim the plan is done.
