# Reacterm Neovim File Handoff Design

## Context

The playground already has two pieces that make a Neovim integration useful:

- `playground/public/index.html` renders a browser page with a code editor, xterm terminal, Run/Stop controls, examples, and a WebSocket connection.
- `playground/server.mjs` serves the page and runs submitted TSX code through the existing playground execution path.

The missing workflow is opening the file the user is already editing in Neovim inside that playground page. Today the page only loads built-in examples or ad hoc textarea content. The feature should let a user run one Neovim command and land in the browser with the current file loaded and ready to run.

## Goals

- Add a first-party Neovim plugin, tentatively `reacterm.nvim`, for opening the current Neovim buffer in the Reacterm playground page.
- Keep the MVP as a file handoff, not live buffer sync.
- Add a secure file API to the playground server so the page can read and save a single file under an allowed project root.
- Preserve the existing example-run workflow and current playground UI.
- Make the integration work without requiring a long-running editor-side daemon.
- Keep the interface testable with ordinary Node and Lua/unit tests.

## Non-goals

- No browser-hosted Neovim in v1.
- No live per-keystroke sync between Neovim and the browser in v1.
- No LSP, diagnostics, completion, formatting, or Treesitter integration.
- No multi-file workspace explorer.
- No remote/shared sessions.
- No arbitrary filesystem access from the browser page.
- No production authentication system. This is a localhost developer tool; use a short-lived local token for accidental-access protection.

## Recommended Skills

- `warden:brainstorming` for spec refinement.
- `warden:writing-plans` for turning this spec into implementation tasks.
- `warden:typescript` for playground server/page changes and tests.
- `warden:tui` for Reacterm/playground behavior that touches terminal UI expectations.
- `warden:security-review` for path allowlist and local token handling.
- `warden:verification-before-completion` for final acceptance checks.

## Approach Decision

### Option A - File handoff MVP (chosen)

Neovim opens a URL containing the current absolute file path plus a short-lived token. The playground page reads the file via the server, displays it in the existing editor, can save changes back to disk, and can run the loaded file through the existing Run button.

Pros:

- Smallest useful integration.
- No editor-side socket server.
- Easy to test with HTTP requests.
- Uses the existing playground page instead of creating a second UI.

Cons:

- Browser and Neovim can diverge if both edit at once.
- Save conflict detection must be explicit.
- It is not a live mirror of the Neovim buffer.

### Option B - Live buffer sync

The Neovim plugin streams buffer changes to the page over WebSocket, and the page mirrors edits live.

Pros:

- More impressive editing loop.
- Browser state stays close to Neovim state.

Cons:

- Requires a Neovim-side transport.
- Harder conflict semantics.
- More input latency and race-condition risk.

### Option C - Neovim in the page

The page hosts a real Neovim process through a PTY/xterm view.

Pros:

- Highest fidelity to Neovim.
- Opens a path toward a full browser IDE-like surface.

Cons:

- Much larger scope.
- Requires PTY handling and process lifecycle hardening.
- Duplicates the terminal panel's concerns.

Decision: implement Option A first.

## User Workflow

1. User starts the playground:

   ```bash
   npm run playground
   ```

2. User opens a source file in Neovim.

3. User runs:

   ```vim
   :ReactermOpen
   ```

4. The plugin opens a browser URL similar to:

   ```text
   http://127.0.0.1:3777/?file=%2Fhome%2Fuser%2Fproject%2Fexamples%2Fdashboard.tsx&token=<token>
   ```

5. The page loads the file into the existing editor, updates the filename label, and marks the editor as clean.

6. User edits in the browser if desired.

7. `Ctrl+S` or Save writes back to disk through the server.

8. Run executes the current editor contents through the existing playground run path.

## Architecture

### Module layout

```text
integrations/reacterm.nvim/
  plugin/reacterm.lua
  lua/reacterm/init.lua
  README.md

playground/server.mjs
playground/public/index.html

src/__tests__/playground-file-api.test.ts
tests/nvim/reacterm-url.test.lua
```

The exact Lua test path can change if the repo already has a Lua test convention by implementation time. If there is no Lua test runner in the repo, the first implementation can use a small `nvim --headless` smoke script.

### Playground server

Add a file API to `playground/server.mjs`:

```text
GET  /api/file?path=<absolute-path>&token=<token>
PUT  /api/file
```

`GET /api/file` returns:

```json
{
  "path": "/absolute/path/to/file.tsx",
  "name": "file.tsx",
  "mtimeMs": 1770000000000,
  "content": "..."
}
```

`PUT /api/file` accepts:

```json
{
  "path": "/absolute/path/to/file.tsx",
  "token": "<token>",
  "baseMtimeMs": 1770000000000,
  "content": "..."
}
```

Save response:

```json
{
  "ok": true,
  "mtimeMs": 1770000000123
}
```

Conflict response:

```json
{
  "ok": false,
  "error": "conflict",
  "message": "File changed on disk since it was loaded."
}
```

### Security model

The server must enforce all file access rules:

- Resolve requested paths with `realpath`.
- Only allow files under `PROJECT_ROOT` by default.
- Optionally allow a `REACTERM_PLAYGROUND_ROOT` environment variable to narrow or override the allowed root.
- Reject directories.
- Reject missing files on read with 404.
- Reject files larger than a conservative limit, such as 1 MiB for the MVP.
- Reject path traversal even if URL encoding is used.
- Require a local token for read and write when a `file` query parameter is used.

Token source:

- Playground server generates a token at startup unless `REACTERM_PLAYGROUND_TOKEN` is set.
- Server prints the token or full base URL to stdout.
- The Neovim plugin can be configured with the token:

  ```lua
  require("reacterm").setup({
    host = "127.0.0.1",
    port = 3777,
    token = "..."
  })
  ```

For the first implementation, automatic token discovery is not required.

### Browser page changes

Extend `playground/public/index.html`:

- Parse `file` and `token` from `location.search`.
- If present, call `GET /api/file`.
- Load the returned content into the existing textarea.
- Set `editor-filename` to the real file basename or project-relative path.
- Track `loadedPath`, `loadedMtimeMs`, and `dirty`.
- Add a Save button near Run/Stop or in the editor panel header.
- Bind `Ctrl+S` / `Cmd+S` to save when a file is loaded.
- Show save state in the UI:
  - clean
  - unsaved
  - saving
  - saved
  - conflict
  - error
- Keep built-in examples working when no `file` query parameter exists.

### Neovim plugin

The plugin should be plain Lua and work with common Neovim plugin managers.

Public API:

```lua
require("reacterm").setup({
  host = "127.0.0.1",
  port = 3777,
  token = nil,
  open = nil, -- optional custom opener function(url)
})
```

Commands:

```vim
:ReactermOpen
:ReactermOpen {path}
```

Behavior:

- If no path is provided, use the current buffer path.
- If the current buffer has no file path, show an error.
- If the buffer is modified, prompt the user to write before opening.
- Build a URL with encoded absolute path and token if configured.
- Open with `vim.ui.open(url)` when available.
- Fall back to platform commands:
  - macOS: `open`
  - Linux: `xdg-open`
  - Windows: `cmd /c start`
- Surface a clear error if no opener is available.

## Error Handling

Server:

- `400` for malformed path or JSON.
- `401` for missing or invalid token.
- `403` for path outside allowed root.
- `404` for missing file.
- `409` for save conflict.
- `413` for file too large.
- `500` only for unexpected filesystem errors.

Browser:

- Loading error leaves the existing editor untouched and shows an error status.
- Save conflict does not overwrite disk. It shows a conflict status and keeps the browser content dirty.
- Run still uses the editor content, whether saved or unsaved.

Neovim:

- Missing file path: notify error.
- Modified buffer: prompt to save first.
- Missing token when server requires it: the browser load will show an auth error; plugin should still open the URL.
- Opener failure: notify error with the URL so the user can open manually.

## Testing Plan

### Server tests

Use Node/Vitest or a small Node test harness against `playground/server.mjs`.

Coverage:

- Reads an allowed file with valid token.
- Saves an allowed file with matching `baseMtimeMs`.
- Rejects outside-root path.
- Rejects encoded traversal.
- Rejects invalid token.
- Returns 409 on save conflict.
- Keeps existing WebSocket run behavior intact.

### Browser tests

Use the existing page with lightweight DOM tests if practical, or Playwright if already available by implementation time.

Coverage:

- File query parameter loads content into editor.
- Editing marks dirty.
- Save writes and clears dirty.
- Conflict shows conflict state.
- Built-in examples still load when no file query parameter is present.

### Neovim plugin tests

Use headless Neovim if available.

Coverage:

- URL construction encodes absolute paths.
- `:ReactermOpen` uses current buffer path.
- Empty buffer path reports an error.
- Custom `open` callback receives expected URL.

## Rollout

1. Ship server file API behind token and root allowlist.
2. Add page file-load/save UI.
3. Add `integrations/reacterm.nvim` with command and setup.
4. Document manual setup in plugin README and the main playground docs.
5. Defer live sync until this path is useful and stable.

## Acceptance Criteria

- [ ] `npm test -- src/__tests__/playground-file-api.test.ts` -> exit 0, including read, save, conflict, invalid token, and outside-root cases.
- [ ] `npm run build` -> exit 0.
- [ ] `node playground/server.mjs` with `REACTERM_PLAYGROUND_TOKEN=test-token` serves `GET /api/file?path=<repo-file>&token=test-token` with HTTP 200 and JSON containing `content`.
- [ ] `node playground/server.mjs` with `REACTERM_PLAYGROUND_TOKEN=test-token` rejects `GET /api/file?path=/etc/passwd&token=test-token` with HTTP 403.
- [ ] Browser URL `http://127.0.0.1:3777/?file=<encoded repo file>&token=test-token` loads the file into the existing editor and updates `#editor-filename`.
- [ ] Pressing `Ctrl+S` in the browser after editing a loaded file sends `PUT /api/file` and clears the dirty state on HTTP 200.
- [ ] `nvim --headless -u NONE -c 'set rtp+=integrations/reacterm.nvim' -c 'lua require("reacterm").setup({ token = "test-token", open = function(url) _G.url = url end })' -c 'edit examples/reacterm-demo.tsx' -c 'ReactermOpen' -c 'lua assert(_G.url:match("file=") and _G.url:match("token=test%-token"))' -c 'qa'` -> exit 0.
- [ ] File `integrations/reacterm.nvim/README.md` documents setup, `:ReactermOpen`, token configuration, and the MVP limitation that browser edits are file-save based rather than live Neovim buffer sync.

## Known Limitations

Empty at spec-write time.

Per-entry format:

- **<acceptance item or scope>** - one-line root cause.
  - Tried: <approach A> -> failed because <reason>
  - Tried: <approach B> -> failed because <reason>
  - Decision: ship without / defer / blocked-on-<thing>. Revisit when <condition>.

## Post-Implementation Review

Empty at spec-write time.

### Acceptance results

Re-state every acceptance item with verification evidence. Mark each: pass / known-limit / fail.

### Scope drift

List every change made beyond the spec. For each, decide: justify or revert.

### Refactor proposals

Things noticed during implementation that could improve the code, but were not executed.
