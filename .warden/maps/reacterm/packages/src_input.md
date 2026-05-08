# Package: src/input


## `src/input/keyboard.ts`

- `<module>` (module) — `src/input/keyboard.ts:<module>`
- `SeqEntry` (class) — `keyboard.SeqEntry`
- `makeKey` (function) — `keyboard.makeKey`
- `parseCSI` (function) — `keyboard.parseCSI`
- `parseKeys` (function) — `keyboard.parseKeys`
- `parseSS3` (function) — `keyboard.parseSS3`

## `src/input/manager.ts`

- `<module>` (module) — `src/input/manager.ts:<module>`
- `InputManager` (class) — `manager.InputManager`
- `PrioritizedKeyHandler` (class) — `manager.PrioritizedKeyHandler`
- `constructor` (method) — `manager.InputManager.constructor`
- `emitKey` (method) — `manager.InputManager.emitKey`
- `emitMouse` (method) — `manager.InputManager.emitMouse`
- `emitPaste` (method) — `manager.InputManager.emitPaste`
- `extractMouse` (method) — `manager.InputManager.extractMouse`
- `handleData` (method) — `manager.InputManager.handleData`
- `isAttached` (method) — `manager.InputManager.isAttached`
- `onKey` (method) — `manager.InputManager.onKey`
- `onKeyPrioritized` (method) — `manager.InputManager.onKeyPrioritized`
- `onMouse` (method) — `manager.InputManager.onMouse`
- `onPaste` (method) — `manager.InputManager.onPaste`
- `processInput` (method) — `manager.InputManager.processInput`
- `start` (method) — `manager.InputManager.start`
- `stop` (method) — `manager.InputManager.stop`

## `src/input/mouse.ts`

- `<module>` (module) — `src/input/mouse.ts:<module>`
- `decodeButton` (function) — `mouse.decodeButton`
- `isIncompleteMouseSequence` (function) — `mouse.isIncompleteMouseSequence`
- `looksLikeMalformedSgrMouse` (function) — `mouse.looksLikeMalformedSgrMouse`
- `parseMouseEvent` (function) — `mouse.parseMouseEvent`
- `parseSGR` (function) — `mouse.parseSGR`
- `parseX11` (function) — `mouse.parseX11`

## `src/input/priorities.ts`

- `<module>` (module) — `src/input/priorities.ts:<module>`
- `INPUT_PRIORITY` (constant) — `priorities.INPUT_PRIORITY`

## `src/input/types.ts`

- `<module>` (module) — `src/input/types.ts:<module>`
- `KeyEvent` (class) — `types.KeyEvent`
- `MouseEvent` (class) — `types.MouseEvent`
- `PasteEvent` (class) — `types.PasteEvent`
