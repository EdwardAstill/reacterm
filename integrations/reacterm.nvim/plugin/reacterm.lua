if vim.g.loaded_reacterm_nvim == 1 then
  return
end
vim.g.loaded_reacterm_nvim = 1

require("reacterm").register_command()
