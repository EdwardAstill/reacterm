# Storm TUI — Showpiece v3 Demo (Dark Mode)
# Record: vhs docs/showpiece-dark.tape
# Output: docs/showpiece-dark.gif

Output docs/showpiece-dark.gif

Set Shell "bash"
Set FontSize 15
Set Width 1400
Set Height 800
Set Theme "TokyoNight"
Set Padding 30
Set Margin 20
Set MarginFill "#0A0A0F"
Set BorderRadius 12
Set WindowBar Colorful
Set Framerate 30
Set CursorBlink false
Set TypingSpeed 0

Require node
Require npx

# Navigate to project
Hide
Type "cd storm-tui"
Enter
Sleep 1s
Type "clear"
Enter
Sleep 500ms
Show

# Launch showpiece v3 (dark mode by default)
Type "npx tsx examples/showpiece-v3.tsx"
Enter
Sleep 1s

# Cell matrix splash + STORM reveal (0-4s)
Sleep 4s

# Main screen — header, user message, reasoning (4-9s)
Sleep 5s

# Streaming response + operations appear (9-13s)
Sleep 4s

# Diff panel slides in (13-17s)
Sleep 4s

# Metrics panel slides in, peak density (17-23s)
Sleep 6s

# Resolution — everything goes green + ripple (23-24.5s)
Sleep 1500ms

# Green wave sweep (24.5-26s)
Sleep 1500ms

# End card builds piece by piece (26-30s)
Sleep 4s

# Auto-exits
Sleep 1s
