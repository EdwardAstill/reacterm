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

function M.build_url(path)
  local absolute = vim.fn.fnamemodify(path, ":p")
  local url = string.format(
    "http://%s:%s/?file=%s",
    config.host,
    tostring(config.port),
    urlencode(absolute)
  )

  if config.token and config.token ~= "" then
    url = url .. "&token=" .. urlencode(config.token)
  end

  return url
end

local function open_url(url)
  if config.open then
    return config.open(url)
  end

  if vim.ui and vim.ui.open then
    return vim.ui.open(url)
  end

  local opener = "xdg-open"
  if vim.fn.has("mac") == 1 then
    opener = "open"
  elseif vim.fn.has("win32") == 1 then
    opener = "cmd"
  end

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
    local choice = vim.fn.confirm(
      "Buffer has unsaved changes. Write before opening?",
      "&Write\n&Open anyway\n&Cancel",
      1
    )
    if choice == 1 then
      vim.cmd.write()
    elseif choice ~= 2 then
      return
    end
  end

  open_url(M.build_url(target))
end

function M.register_command()
  if vim.fn.exists(":ReactermOpen") == 2 then
    return
  end

  vim.api.nvim_create_user_command("ReactermOpen", function(opts)
    require("reacterm").open(opts.args)
  end, {
    nargs = "?",
    complete = "file",
  })
end

function M.setup(opts)
  config = vim.tbl_extend("force", config, opts or {})
  M.register_command()
end

return M
