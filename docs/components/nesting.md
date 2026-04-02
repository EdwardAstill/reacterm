# Container Nesting Guide

Reference for which components can be nested inside others.

## Container Nesting Guide

Not sure if you can put one component inside another? This matrix covers the common cases:

| Inner / Outer | Box | ScrollView | Modal | Tabs | Accordion |
|---|---|---|---|---|---|
| Box | yes | yes (sticky) | yes | yes | yes |
| Text | yes | yes | yes | yes | yes |
| TextInput | yes | yes | yes | yes | yes |
| ScrollView | yes | yes (nested) | yes | yes | yes |
| Modal | yes | yes | yes | yes (nested) | yes |
| Tabs | yes | yes | yes | caution | yes |
| Select | yes | yes | yes | yes | yes |
| Accordion | yes | yes | yes | yes | caution |

**Notes:**

- **ScrollView inside ScrollView:** The outer ScrollView captures scroll events by default. Click or focus the inner ScrollView to route scroll input there instead. Hit-testing determines which ScrollView receives mouse wheel events.
- **Modal inside Modal:** Focus is trapped in the innermost visible modal. Closing the inner modal restores focus to the outer modal automatically.
- **Tabs inside Tabs:** This works, but the Tab key only affects the focused Tabs instance. If both are on screen, make sure focus is routed correctly (e.g. via `isFocused` props) so users can reach both.
- **Accordion inside Accordion:** Works, but deeply nested accordions can be hard to navigate. Consider flattening the hierarchy or using a Tree component instead.

---
[Back to Components](README.md)
