# reacterm.nvim

Open the current Neovim file in the Reacterm playground browser page.

## Setup

Add this directory to your Neovim runtime path through your plugin manager, then configure the playground endpoint:

```lua
require("reacterm").setup({
  host = "127.0.0.1",
  port = 3777,
  token = "paste token from playground startup",
})
```

Start the playground first:

```bash
REACTERM_PLAYGROUND_TOKEN=test-token npm run playground
```

The playground prints the local URL and token at startup.

## Usage

```vim
:ReactermOpen
:ReactermOpen path/to/file.tsx
```

`:ReactermOpen` opens the current file-backed buffer. If the buffer has unsaved changes, the command asks whether to write before opening.

## MVP Limitation

This is a file handoff. Browser edits save back to disk with `Ctrl+S`; it is not live Neovim buffer sync.
