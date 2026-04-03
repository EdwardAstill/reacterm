//! Storm TUI WASM Hot Path
//!
//! Replaces the 4 hottest TypeScript functions with native Rust compiled to WASM.
//! Eliminates GC pauses in the render path. ~50KB binary.
//!
//! Functions:
//!   - ScreenBuffer: cell storage using flat Vec<u8>/Vec<i32> (no GC objects)
//!   - char_width: BMP lookup table (O(1) per character)
//!   - row_equals: fast row comparison for dirty diff
//!   - render_line: ANSI string building for changed rows

use wasm_bindgen::prelude::*;

// ── charWidth lookup table ──────────────────────────────────────────

static mut BMP_WIDTH: [u8; 65536] = [0u8; 65536];
static mut BMP_INITIALIZED: bool = false;

fn init_bmp_table() {
    unsafe {
        if BMP_INITIALIZED { return; }

        // Default: width 1 for all printable
        for i in 32..65536usize {
            BMP_WIDTH[i] = 1;
        }

        // Control characters: width 0
        for i in 0..32usize { BMP_WIDTH[i] = 0; }
        BMP_WIDTH[127] = 0;

        // Combining marks: width 0
        for i in 0x0300..=0x036F { BMP_WIDTH[i] = 0; }
        for i in 0x0483..=0x0489 { BMP_WIDTH[i] = 0; }
        for i in 0x0591..=0x05BD { BMP_WIDTH[i] = 0; }
        for i in 0x0610..=0x061A { BMP_WIDTH[i] = 0; }
        for i in 0x064B..=0x065F { BMP_WIDTH[i] = 0; }
        for i in 0x0670..=0x0670 { BMP_WIDTH[i] = 0; }
        for i in 0x06D6..=0x06DC { BMP_WIDTH[i] = 0; }
        for i in 0x06DF..=0x06E4 { BMP_WIDTH[i] = 0; }
        for i in 0x0730..=0x074A { BMP_WIDTH[i] = 0; }
        for i in 0x07A6..=0x07B0 { BMP_WIDTH[i] = 0; }
        for i in 0x0900..=0x0903 { BMP_WIDTH[i] = 0; }
        for i in 0x093A..=0x094F { BMP_WIDTH[i] = 0; }
        for i in 0x0951..=0x0957 { BMP_WIDTH[i] = 0; }
        for i in 0x0962..=0x0963 { BMP_WIDTH[i] = 0; }
        for i in 0x0981..=0x0983 { BMP_WIDTH[i] = 0; }
        for i in 0x0BC0..=0x0BC2 { BMP_WIDTH[i] = 0; }
        for i in 0x0BCD..=0x0BCD { BMP_WIDTH[i] = 0; }
        for i in 0x1AB0..=0x1AFF { BMP_WIDTH[i] = 0; }
        for i in 0x1DC0..=0x1DFF { BMP_WIDTH[i] = 0; }
        for i in 0x20D0..=0x20FF { BMP_WIDTH[i] = 0; }
        for i in 0xFE00..=0xFE0F { BMP_WIDTH[i] = 0; }
        for i in 0xFE20..=0xFE2F { BMP_WIDTH[i] = 0; }
        // Zero-width characters
        BMP_WIDTH[0x200B] = 0; // ZWSP
        BMP_WIDTH[0x200C] = 0; // ZWNJ
        BMP_WIDTH[0x200D] = 0; // ZWJ
        BMP_WIDTH[0xFEFF] = 0; // BOM

        // CJK / fullwidth: width 2
        for i in 0x1100..=0x115F { BMP_WIDTH[i] = 2; }
        for i in 0x2E80..=0x303E { BMP_WIDTH[i] = 2; }
        for i in 0x3041..=0x33BF { BMP_WIDTH[i] = 2; }
        for i in 0x3400..=0x4DBF { BMP_WIDTH[i] = 2; }
        for i in 0x4E00..=0x9FFF { BMP_WIDTH[i] = 2; }
        for i in 0xA000..=0xA4CF { BMP_WIDTH[i] = 2; }
        for i in 0xAC00..=0xD7AF { BMP_WIDTH[i] = 2; }
        for i in 0xF900..=0xFAFF { BMP_WIDTH[i] = 2; }
        for i in 0xFE30..=0xFE6F { BMP_WIDTH[i] = 2; }
        for i in 0xFF01..=0xFF60 { BMP_WIDTH[i] = 2; }
        for i in 0xFFE0..=0xFFE6 { BMP_WIDTH[i] = 2; }

        BMP_INITIALIZED = true;
    }
}

#[wasm_bindgen]
pub fn char_width(code: u32) -> u32 {
    unsafe {
        if !BMP_INITIALIZED { init_bmp_table(); }
        if code < 0x10000 {
            return BMP_WIDTH[code as usize] as u32;
        }
    }
    // Supplementary planes
    if code >= 0x1F300 && code <= 0x1F9FF { return 2; } // Emoji
    if code >= 0x20000 && code <= 0x2FA1F { return 2; } // CJK extensions
    if code >= 0x1F3FB && code <= 0x1F3FF { return 0; } // Skin tone modifiers
    1
}

#[wasm_bindgen]
pub fn string_width(s: &str) -> u32 {
    let mut w: u32 = 0;
    for c in s.chars() {
        w += char_width(c as u32);
    }
    w
}

// ── ScreenBuffer ────────────────────────────────────────────────────

#[wasm_bindgen]
pub struct WasmBuffer {
    width: usize,
    height: usize,
    chars: Vec<u32>,      // Unicode code points (not char objects)
    fgs: Vec<i32>,        // Foreground colors (-1 = default)
    bgs: Vec<i32>,        // Background colors (-1 = default)
    attrs: Vec<u8>,       // Attribute bitmask
}

#[wasm_bindgen]
impl WasmBuffer {
    #[wasm_bindgen(constructor)]
    pub fn new(width: usize, height: usize) -> WasmBuffer {
        let size = width * height;
        WasmBuffer {
            width,
            height,
            chars: vec![32u32; size],  // space
            fgs: vec![-1i32; size],    // default
            bgs: vec![-1i32; size],    // default
            attrs: vec![0u8; size],    // none
        }
    }

    #[wasm_bindgen]
    pub fn get_width(&self) -> usize { self.width }

    #[wasm_bindgen]
    pub fn get_height(&self) -> usize { self.height }

    #[wasm_bindgen]
    pub fn set_cell(&mut self, x: usize, y: usize, ch: u32, fg: i32, bg: i32, attr: u8) {
        if x >= self.width || y >= self.height { return; }
        let i = y * self.width + x;
        self.chars[i] = ch;
        self.fgs[i] = fg;
        self.bgs[i] = bg;
        self.attrs[i] = attr;
    }

    #[wasm_bindgen]
    pub fn get_char(&self, x: usize, y: usize) -> u32 {
        if x >= self.width || y >= self.height { return 32; }
        self.chars[y * self.width + x]
    }

    #[wasm_bindgen]
    pub fn get_fg(&self, x: usize, y: usize) -> i32 {
        if x >= self.width || y >= self.height { return -1; }
        self.fgs[y * self.width + x]
    }

    #[wasm_bindgen]
    pub fn get_bg(&self, x: usize, y: usize) -> i32 {
        if x >= self.width || y >= self.height { return -1; }
        self.bgs[y * self.width + x]
    }

    #[wasm_bindgen]
    pub fn get_attrs(&self, x: usize, y: usize) -> u8 {
        if x >= self.width || y >= self.height { return 0; }
        self.attrs[y * self.width + x]
    }

    #[wasm_bindgen]
    pub fn clear(&mut self) {
        self.chars.fill(32);
        self.fgs.fill(-1);
        self.bgs.fill(-1);
        self.attrs.fill(0);
    }

    /// Fast row equality check — returns true if row y is identical in both buffers.
    /// This is the key to cell-level dirty diff: skip unchanged rows entirely.
    #[wasm_bindgen]
    pub fn row_equals(&self, other: &WasmBuffer, y: usize) -> bool {
        if y >= self.height || y >= other.height { return false; }
        if self.width != other.width { return false; }

        let start = y * self.width;
        let end = start + self.width;

        // Compare all 4 arrays for this row
        self.chars[start..end] == other.chars[start..end]
            && self.fgs[start..end] == other.fgs[start..end]
            && self.bgs[start..end] == other.bgs[start..end]
            && self.attrs[start..end] == other.attrs[start..end]
    }

    /// Write a string starting at (x, y) with given colors/attrs.
    /// Handles wide characters (CJK) by setting next cell to 0 (null placeholder).
    #[wasm_bindgen]
    pub fn write_string(&mut self, x: usize, y: usize, s: &str, fg: i32, bg: i32, attr: u8) {
        if y >= self.height { return; }
        let mut col = x;
        for c in s.chars() {
            if col >= self.width { break; }
            let code = c as u32;
            let w = char_width(code) as usize;
            if w == 0 { continue; } // skip zero-width

            let i = y * self.width + col;
            self.chars[i] = code;
            self.fgs[i] = fg;
            self.bgs[i] = bg;
            self.attrs[i] = attr;

            // Wide character: fill next cell with null placeholder
            if w == 2 && col + 1 < self.width {
                let j = i + 1;
                self.chars[j] = 0; // null = wide char continuation
                self.fgs[j] = fg;
                self.bgs[j] = bg;
                self.attrs[j] = attr;
            }

            col += w;
        }
    }

    /// Clone the buffer
    #[wasm_bindgen]
    pub fn clone_buffer(&self) -> WasmBuffer {
        WasmBuffer {
            width: self.width,
            height: self.height,
            chars: self.chars.clone(),
            fgs: self.fgs.clone(),
            bgs: self.bgs.clone(),
            attrs: self.attrs.clone(),
        }
    }
}

// ── ANSI rendering ──────────────────────────────────────────────────

const ATTR_BOLD: u8 = 1;
const ATTR_DIM: u8 = 2;
const ATTR_ITALIC: u8 = 4;
const ATTR_UNDERLINE: u8 = 8;
const ATTR_INVERSE: u8 = 16;
const ATTR_STRIKETHROUGH: u8 = 32;

fn push_sgr(out: &mut String, fg: i32, bg: i32, attrs: u8) {
    out.push_str("\x1b[0");

    if attrs & ATTR_BOLD != 0 { out.push_str(";1"); }
    if attrs & ATTR_DIM != 0 { out.push_str(";2"); }
    if attrs & ATTR_ITALIC != 0 { out.push_str(";3"); }
    if attrs & ATTR_UNDERLINE != 0 { out.push_str(";4"); }
    if attrs & ATTR_INVERSE != 0 { out.push_str(";7"); }
    if attrs & ATTR_STRIKETHROUGH != 0 { out.push_str(";9"); }

    // Foreground: true color (0x1RRGGBB format from Storm)
    if fg >= 0x1000000 {
        let r = (fg >> 16) & 0xFF;
        let g = (fg >> 8) & 0xFF;
        let b = fg & 0xFF;
        out.push_str(&format!(";38;2;{};{};{}", r, g, b));
    } else if fg >= 0 && fg <= 255 {
        out.push_str(&format!(";38;5;{}", fg));
    }

    // Background
    if bg >= 0x1000000 {
        let r = (bg >> 16) & 0xFF;
        let g = (bg >> 8) & 0xFF;
        let b = bg & 0xFF;
        out.push_str(&format!(";48;2;{};{};{}", r, g, b));
    } else if bg >= 0 && bg <= 255 {
        out.push_str(&format!(";48;5;{}", bg));
    }

    out.push('m');
}

/// Render a single row to an ANSI string.
/// Only called for rows that differ from the previous frame (dirty check passed).
#[wasm_bindgen]
pub fn render_line(buf: &WasmBuffer, y: usize) -> String {
    if y >= buf.height { return String::new(); }

    let mut out = String::with_capacity(buf.width * 4);
    let mut cur_fg: i32 = -2; // impossible value to force first SGR
    let mut cur_bg: i32 = -2;
    let mut cur_attrs: u8 = 255;

    // Find last non-space column to avoid trailing spaces
    let mut last = buf.width;
    while last > 0 {
        let i = y * buf.width + (last - 1);
        if buf.chars[i] != 32 || buf.fgs[i] != -1 || buf.bgs[i] != -1 || buf.attrs[i] != 0 {
            break;
        }
        last -= 1;
    }

    for x in 0..last {
        let i = y * buf.width + x;
        let ch = buf.chars[i];
        let fg = buf.fgs[i];
        let bg = buf.bgs[i];
        let attrs = buf.attrs[i];

        // Skip wide char continuation cells
        if ch == 0 { continue; }

        // Only emit SGR if style changed
        if fg != cur_fg || bg != cur_bg || attrs != cur_attrs {
            push_sgr(&mut out, fg, bg, attrs);
            cur_fg = fg;
            cur_bg = bg;
            cur_attrs = attrs;
        }

        // Write character
        if let Some(c) = char::from_u32(ch) {
            out.push(c);
        } else {
            out.push(' ');
        }
    }

    // Reset at end of line
    if cur_fg != -1 || cur_bg != -1 || cur_attrs != 0 {
        out.push_str("\x1b[0m");
    }

    // Clear to end of line
    out.push_str("\x1b[K");

    out
}

// ── Syntax tokenizer ───────────────────────────────────────────────
//
// DFA/state-machine tokenizer called from JS as an optional accelerator.
// Returns flat (start, end, kind) triples — zero-copy, no token text allocated.
// Supports: TypeScript/JavaScript, Rust, Python, Go, Java, C/C++.

/// Token kinds — must match JS `TokenKind` string mapping.
/// JS side maps: Plain=0, Keyword=1, Type=2, String=3, Comment=4,
///               Number=5, Operator=6, Preprocessor=7, Tag=8.
#[repr(u8)]
#[derive(Clone, Copy, PartialEq, Eq)]
enum TokenKind {
    Plain = 0,
    Keyword = 1,
    Type = 2,
    String = 3,
    Comment = 4,
    Number = 5,
    Operator = 6,
    Preprocessor = 7,
    Tag = 8,
}

#[wasm_bindgen]
pub struct TokenizerResult {
    /// Flat array: [start, end, kind, start, end, kind, ...]
    tokens: Vec<u32>,
}

#[wasm_bindgen]
impl TokenizerResult {
    pub fn tokens_ptr(&self) -> *const u32 {
        self.tokens.as_ptr()
    }

    pub fn tokens_len(&self) -> usize {
        self.tokens.len()
    }

    /// Return the flat token array as a JS Uint32Array (copies data to JS heap).
    /// Layout: [start, end, kind, start, end, kind, ...]
    pub fn to_array(&self) -> Vec<u32> {
        self.tokens.clone()
    }
}

/// Language identifier — parsed once from the JS string.
#[derive(Clone, Copy, PartialEq, Eq)]
enum Lang {
    TypeScript,
    Rust,
    Python,
    Go,
    Java,
    C,
    Cpp,
    Unknown,
}

fn parse_lang(s: &str) -> Lang {
    match s {
        "typescript" | "ts" | "tsx" | "javascript" | "js" | "jsx" => Lang::TypeScript,
        "rust" | "rs" => Lang::Rust,
        "python" | "py" => Lang::Python,
        "go" | "golang" => Lang::Go,
        "java" => Lang::Java,
        "c" => Lang::C,
        "cpp" | "c++" | "cxx" | "cc" | "h" | "hpp" => Lang::Cpp,
        _ => Lang::Unknown,
    }
}

// ── Keyword tables ─────────────────────────────────────────────────
// Simple linear scan over sorted slices. For typical keyword counts
// (30-50 entries) this is faster than a HashMap due to cache locality.

static TS_KEYWORDS: &[&str] = &[
    "as", "async", "await", "break", "case", "catch", "class", "const",
    "continue", "debugger", "default", "delete", "do", "else", "enum",
    "export", "extends", "false", "finally", "for", "from", "function",
    "if", "implements", "import", "in", "instanceof", "interface", "let",
    "new", "null", "of", "package", "private", "protected", "public",
    "return", "static", "super", "switch", "this", "throw", "true", "try",
    "type", "typeof", "undefined", "var", "void", "while", "with", "yield",
];

static TS_TYPES: &[&str] = &[
    "Array", "Boolean", "Date", "Error", "Function", "Map", "Number",
    "Object", "Promise", "ReadonlyArray", "Record", "RegExp", "Set",
    "String", "Symbol", "WeakMap", "WeakSet", "any", "bigint", "boolean",
    "never", "number", "object", "string", "symbol", "unknown", "void",
];

static RUST_KEYWORDS: &[&str] = &[
    "Self", "as", "async", "await", "break", "const", "continue", "crate",
    "dyn", "else", "enum", "extern", "false", "fn", "for", "if", "impl",
    "in", "let", "loop", "match", "mod", "move", "mut", "pub", "ref",
    "return", "self", "static", "struct", "super", "trait", "true", "type",
    "union", "unsafe", "use", "where", "while", "yield",
];

static RUST_TYPES: &[&str] = &[
    "Arc", "Box", "Cell", "HashMap", "HashSet", "Mutex", "Option",
    "Rc", "RefCell", "Result", "RwLock", "String", "Vec",
    "bool", "char", "f32", "f64", "i128", "i16", "i32", "i64", "i8",
    "isize", "str", "u128", "u16", "u32", "u64", "u8", "usize",
];

static PYTHON_KEYWORDS: &[&str] = &[
    "False", "None", "True", "and", "as", "assert", "async", "await",
    "break", "class", "continue", "def", "del", "elif", "else", "except",
    "finally", "for", "from", "global", "if", "import", "in", "is",
    "lambda", "nonlocal", "not", "or", "pass", "raise", "return", "try",
    "while", "with", "yield",
];

static PYTHON_TYPES: &[&str] = &[
    "bool", "bytes", "complex", "dict", "float", "frozenset", "int",
    "list", "memoryview", "object", "range", "set", "str", "tuple", "type",
];

static GO_KEYWORDS: &[&str] = &[
    "break", "case", "chan", "const", "continue", "default", "defer",
    "else", "fallthrough", "false", "for", "func", "go", "goto", "if",
    "import", "interface", "map", "nil", "package", "range", "return",
    "select", "struct", "switch", "true", "type", "var",
];

static GO_TYPES: &[&str] = &[
    "bool", "byte", "complex128", "complex64", "error", "float32",
    "float64", "int", "int16", "int32", "int64", "int8", "rune",
    "string", "uint", "uint16", "uint32", "uint64", "uint8", "uintptr",
];

static JAVA_KEYWORDS: &[&str] = &[
    "abstract", "assert", "boolean", "break", "byte", "case", "catch",
    "char", "class", "const", "continue", "default", "do", "double",
    "else", "enum", "extends", "false", "final", "finally", "float",
    "for", "goto", "if", "implements", "import", "instanceof", "int",
    "interface", "long", "native", "new", "null", "package", "private",
    "protected", "public", "return", "short", "static", "strictfp",
    "super", "switch", "synchronized", "this", "throw", "throws",
    "transient", "true", "try", "void", "volatile", "while",
];

static JAVA_TYPES: &[&str] = &[
    "ArrayList", "Boolean", "Byte", "Character", "Class", "Double",
    "Float", "HashMap", "HashSet", "Integer", "List", "Long", "Map",
    "Object", "Optional", "Set", "Short", "String", "StringBuilder",
    "System", "Thread", "Void",
];

static C_KEYWORDS: &[&str] = &[
    "auto", "break", "case", "char", "const", "continue", "default",
    "do", "double", "else", "enum", "extern", "float", "for", "goto",
    "if", "inline", "int", "long", "register", "restrict", "return",
    "short", "signed", "sizeof", "static", "struct", "switch", "typedef",
    "union", "unsigned", "void", "volatile", "while",
];

static C_TYPES: &[&str] = &[
    "FILE", "bool", "char", "double", "float", "int", "int16_t", "int32_t",
    "int64_t", "int8_t", "long", "ptrdiff_t", "short", "size_t",
    "ssize_t", "uint16_t", "uint32_t", "uint64_t", "uint8_t",
    "unsigned", "void", "wchar_t",
];

static CPP_KEYWORDS: &[&str] = &[
    "alignas", "alignof", "and", "and_eq", "asm", "auto", "bitand",
    "bitor", "bool", "break", "case", "catch", "char", "class", "compl",
    "concept", "const", "const_cast", "consteval", "constexpr", "constinit",
    "continue", "co_await", "co_return", "co_yield", "decltype", "default",
    "delete", "do", "double", "dynamic_cast", "else", "enum", "explicit",
    "export", "extern", "false", "float", "for", "friend", "goto", "if",
    "inline", "int", "long", "mutable", "namespace", "new", "noexcept",
    "not", "not_eq", "nullptr", "operator", "or", "or_eq", "private",
    "protected", "public", "register", "reinterpret_cast", "requires",
    "return", "short", "signed", "sizeof", "static", "static_assert",
    "static_cast", "struct", "switch", "template", "this", "thread_local",
    "throw", "true", "try", "typedef", "typeid", "typename", "union",
    "unsigned", "using", "virtual", "void", "volatile", "while", "xor",
    "xor_eq",
];

static CPP_TYPES: &[&str] = &[
    "array", "deque", "list", "map", "optional", "pair", "set",
    "shared_ptr", "string", "tuple", "unique_ptr", "unordered_map",
    "unordered_set", "variant", "vector", "weak_ptr",
];

fn keywords_for(lang: Lang) -> &'static [&'static str] {
    match lang {
        Lang::TypeScript => TS_KEYWORDS,
        Lang::Rust => RUST_KEYWORDS,
        Lang::Python => PYTHON_KEYWORDS,
        Lang::Go => GO_KEYWORDS,
        Lang::Java => JAVA_KEYWORDS,
        Lang::C => C_KEYWORDS,
        Lang::Cpp => CPP_KEYWORDS,
        Lang::Unknown => &[],
    }
}

fn types_for(lang: Lang) -> &'static [&'static str] {
    match lang {
        Lang::TypeScript => TS_TYPES,
        Lang::Rust => RUST_TYPES,
        Lang::Python => PYTHON_TYPES,
        Lang::Go => GO_TYPES,
        Lang::Java => JAVA_TYPES,
        Lang::C => C_TYPES,
        Lang::Cpp => CPP_TYPES,
        Lang::Unknown => &[],
    }
}

fn is_keyword(word: &str, list: &[&str]) -> bool {
    list.contains(&word)
}

// ── Character classification helpers ───────────────────────────────

#[inline]
fn is_ident_start(b: u8) -> bool {
    b.is_ascii_alphabetic() || b == b'_'
}

#[inline]
fn is_ident_cont(b: u8) -> bool {
    b.is_ascii_alphanumeric() || b == b'_'
}

#[inline]
fn is_operator_char(b: u8) -> bool {
    matches!(b, b'+' | b'-' | b'*' | b'/' | b'%' | b'=' | b'!' | b'<'
        | b'>' | b'&' | b'|' | b'^' | b'~' | b'?' | b':')
}

// ── Language-specific config ───────────────────────────────────────

struct LangConfig {
    lang: Lang,
    line_comment: &'static [u8],
    block_open: &'static [u8],
    block_close: &'static [u8],
    has_template_literals: bool,
    has_preprocessor: bool,
    /// Python triple-quote support
    has_triple_strings: bool,
}

fn lang_config(lang: Lang) -> LangConfig {
    match lang {
        Lang::TypeScript => LangConfig {
            lang,
            line_comment: b"//",
            block_open: b"/*",
            block_close: b"*/",
            has_template_literals: true,
            has_preprocessor: false,
            has_triple_strings: false,
        },
        Lang::Rust => LangConfig {
            lang,
            line_comment: b"//",
            block_open: b"/*",
            block_close: b"*/",
            has_template_literals: false,
            has_preprocessor: false,
            has_triple_strings: false,
        },
        Lang::Python => LangConfig {
            lang,
            line_comment: b"#",
            block_open: b"",  // Python uses triple-quote, not block comments
            block_close: b"",
            has_template_literals: false,
            has_preprocessor: false,
            has_triple_strings: true,
        },
        Lang::Go => LangConfig {
            lang,
            line_comment: b"//",
            block_open: b"/*",
            block_close: b"*/",
            has_template_literals: false,
            has_preprocessor: false,
            has_triple_strings: false,
        },
        Lang::Java => LangConfig {
            lang,
            line_comment: b"//",
            block_open: b"/*",
            block_close: b"*/",
            has_template_literals: false,
            has_preprocessor: false,
            has_triple_strings: false,
        },
        Lang::C | Lang::Cpp => LangConfig {
            lang,
            line_comment: b"//",
            block_open: b"/*",
            block_close: b"*/",
            has_template_literals: false,
            has_preprocessor: true,
            has_triple_strings: false,
        },
        Lang::Unknown => LangConfig {
            lang,
            line_comment: b"//",
            block_open: b"/*",
            block_close: b"*/",
            has_template_literals: false,
            has_preprocessor: false,
            has_triple_strings: false,
        },
    }
}

// ── Core tokenizer ─────────────────────────────────────────────────

/// Tokenize a single line of source code.
///
/// This is a DFA-style scanner: we walk the byte slice left-to-right,
/// matching the longest token at each position. No allocations for token
/// text — we only record byte offsets. The output is a flat Vec<u32> of
/// (start, end, kind) triples.
#[wasm_bindgen]
pub fn tokenize_line(line: &str, language: &str) -> TokenizerResult {
    let lang = parse_lang(language);
    let cfg = lang_config(lang);
    let kw_list = keywords_for(lang);
    let ty_list = types_for(lang);
    let bytes = line.as_bytes();
    let len = bytes.len();

    // Pre-allocate for a reasonable number of tokens (most lines have < 30)
    let mut tokens: Vec<u32> = Vec::with_capacity(30 * 3);
    let mut pos: usize = 0;

    while pos < len {
        let b = bytes[pos];

        // ── Preprocessor directives (C/C++: lines starting with #) ─────
        if cfg.has_preprocessor && b == b'#' && is_line_start(bytes, pos) {
            // Entire rest of line is preprocessor
            push_token(&mut tokens, pos as u32, len as u32, TokenKind::Preprocessor);
            break;
        }

        // ── Line comments ──────────────────────────────────────────────
        if !cfg.line_comment.is_empty() && starts_with(bytes, pos, cfg.line_comment) {
            push_token(&mut tokens, pos as u32, len as u32, TokenKind::Comment);
            break;
        }

        // ── Block comments ─────────────────────────────────────────────
        if !cfg.block_open.is_empty() && starts_with(bytes, pos, cfg.block_open) {
            let start = pos;
            pos += cfg.block_open.len();
            // Scan for closing delimiter within the same line
            loop {
                if pos >= len {
                    // Block comment extends past end of line — emit what we have
                    break;
                }
                if starts_with(bytes, pos, cfg.block_close) {
                    pos += cfg.block_close.len();
                    break;
                }
                pos += 1;
            }
            push_token(&mut tokens, start as u32, pos as u32, TokenKind::Comment);
            continue;
        }

        // ── Triple-quoted strings (Python) ─────────────────────────────
        if cfg.has_triple_strings && (starts_with(bytes, pos, b"\"\"\"") || starts_with(bytes, pos, b"'''")) {
            let delim_len = 3;
            let delim = &bytes[pos..pos + delim_len];
            let start = pos;
            pos += delim_len;
            loop {
                if pos + delim_len > len {
                    // Triple-string extends past line
                    pos = len;
                    break;
                }
                if &bytes[pos..pos + delim_len] == delim {
                    pos += delim_len;
                    break;
                }
                pos += 1;
            }
            push_token(&mut tokens, start as u32, pos as u32, TokenKind::String);
            continue;
        }

        // ── Strings (single/double quotes) ─────────────────────────────
        if b == b'"' || b == b'\'' {
            let start = pos;
            let quote = b;
            pos += 1;
            while pos < len {
                if bytes[pos] == b'\\' && pos + 1 < len {
                    pos += 2; // skip escape
                } else if bytes[pos] == quote {
                    pos += 1;
                    break;
                } else {
                    pos += 1;
                }
            }
            push_token(&mut tokens, start as u32, pos as u32, TokenKind::String);
            continue;
        }

        // ── Template literals (JS/TS backtick strings) ─────────────────
        if cfg.has_template_literals && b == b'`' {
            let start = pos;
            pos += 1;
            // Simplified: scan to closing backtick, skip \` escapes
            // (Does not recurse into ${} interpolations — the WASM tokenizer
            // is an accelerator, not a full parser. ${} content appears as
            // part of the string token, which is acceptable for highlighting.)
            while pos < len {
                if bytes[pos] == b'\\' && pos + 1 < len {
                    pos += 2;
                } else if bytes[pos] == b'`' {
                    pos += 1;
                    break;
                } else {
                    pos += 1;
                }
            }
            push_token(&mut tokens, start as u32, pos as u32, TokenKind::String);
            continue;
        }

        // ── Rust raw strings: r"...", r#"..."# ─────────────────────────
        if cfg.lang == Lang::Rust && b == b'r' && pos + 1 < len {
            let next = bytes[pos + 1];
            if next == b'"' || next == b'#' {
                let start = pos;
                pos += 1; // skip 'r'
                // Count hashes
                let mut hashes = 0u32;
                while pos < len && bytes[pos] == b'#' {
                    hashes += 1;
                    pos += 1;
                }
                if pos < len && bytes[pos] == b'"' {
                    pos += 1; // skip opening "
                    // Scan for closing "###
                    'outer: while pos < len {
                        if bytes[pos] == b'"' {
                            let mut h = 0u32;
                            let after_quote = pos + 1;
                            while after_quote + (h as usize) < len
                                && bytes[after_quote + h as usize] == b'#'
                                && h < hashes
                            {
                                h += 1;
                            }
                            if h == hashes {
                                pos = after_quote + hashes as usize;
                                break 'outer;
                            }
                        }
                        pos += 1;
                    }
                    push_token(&mut tokens, start as u32, pos as u32, TokenKind::String);
                    continue;
                }
                // Not actually a raw string — fall back, rewind
                pos = start;
            }
        }

        // ── Numbers ────────────────────────────────────────────────────
        if b.is_ascii_digit() || (b == b'.' && pos + 1 < len && bytes[pos + 1].is_ascii_digit()) {
            let start = pos;
            // Hex/oct/bin prefix
            if b == b'0' && pos + 1 < len {
                let p = bytes[pos + 1];
                if p == b'x' || p == b'X' {
                    pos += 2;
                    while pos < len && (bytes[pos].is_ascii_hexdigit() || bytes[pos] == b'_') {
                        pos += 1;
                    }
                    push_token(&mut tokens, start as u32, pos as u32, TokenKind::Number);
                    continue;
                } else if p == b'o' || p == b'O' {
                    pos += 2;
                    while pos < len && ((bytes[pos] >= b'0' && bytes[pos] <= b'7') || bytes[pos] == b'_') {
                        pos += 1;
                    }
                    push_token(&mut tokens, start as u32, pos as u32, TokenKind::Number);
                    continue;
                } else if p == b'b' || p == b'B' {
                    pos += 2;
                    while pos < len && (bytes[pos] == b'0' || bytes[pos] == b'1' || bytes[pos] == b'_') {
                        pos += 1;
                    }
                    push_token(&mut tokens, start as u32, pos as u32, TokenKind::Number);
                    continue;
                }
            }
            // Decimal (with optional dot and exponent)
            while pos < len && (bytes[pos].is_ascii_digit() || bytes[pos] == b'_') {
                pos += 1;
            }
            if pos < len && bytes[pos] == b'.' && pos + 1 < len && bytes[pos + 1].is_ascii_digit() {
                pos += 1;
                while pos < len && (bytes[pos].is_ascii_digit() || bytes[pos] == b'_') {
                    pos += 1;
                }
            }
            if pos < len && (bytes[pos] == b'e' || bytes[pos] == b'E') {
                pos += 1;
                if pos < len && (bytes[pos] == b'+' || bytes[pos] == b'-') {
                    pos += 1;
                }
                while pos < len && bytes[pos].is_ascii_digit() {
                    pos += 1;
                }
            }
            // Type suffix: f32, f64, u8, i64, etc. (Rust/Go)
            if pos < len && is_ident_start(bytes[pos]) {
                let suffix_start = pos;
                while pos < len && is_ident_cont(bytes[pos]) {
                    pos += 1;
                }
                // Only consume known numeric suffixes, otherwise rewind
                let suffix = &bytes[suffix_start..pos];
                let is_numeric_suffix = matches!(
                    suffix,
                    b"f32" | b"f64" | b"u8" | b"u16" | b"u32" | b"u64" | b"u128"
                    | b"i8" | b"i16" | b"i32" | b"i64" | b"i128" | b"usize" | b"isize"
                    | b"n" // JS BigInt
                );
                if !is_numeric_suffix {
                    pos = suffix_start;
                }
            }
            push_token(&mut tokens, start as u32, pos as u32, TokenKind::Number);
            continue;
        }

        // ── Identifiers (keywords, types, plain) ──────────────────────
        if is_ident_start(b) {
            let start = pos;
            pos += 1;
            while pos < len && is_ident_cont(bytes[pos]) {
                pos += 1;
            }
            let word = &line[start..pos];
            let kind = if is_keyword(word, kw_list) {
                TokenKind::Keyword
            } else if is_keyword(word, ty_list) {
                TokenKind::Type
            } else {
                TokenKind::Plain
            };
            push_token(&mut tokens, start as u32, pos as u32, kind);
            continue;
        }

        // ── Operators ──────────────────────────────────────────────────
        if is_operator_char(b) {
            let start = pos;
            pos += 1;
            // Consume multi-character operators (<=, ==, =>, >>, etc.)
            while pos < len && is_operator_char(bytes[pos]) {
                pos += 1;
            }
            push_token(&mut tokens, start as u32, pos as u32, TokenKind::Operator);
            continue;
        }

        // ── Whitespace and other plain characters ──────────────────────
        // Batch consecutive whitespace/plain characters into one Plain token
        {
            let start = pos;
            pos += 1;
            while pos < len {
                let c = bytes[pos];
                // Stop if we'd start a recognized construct
                if is_ident_start(c)
                    || c.is_ascii_digit()
                    || c == b'"' || c == b'\'' || c == b'`'
                    || is_operator_char(c)
                    || c == b'#'
                    || (!cfg.line_comment.is_empty() && starts_with(bytes, pos, cfg.line_comment))
                    || (!cfg.block_open.is_empty() && starts_with(bytes, pos, cfg.block_open))
                {
                    break;
                }
                pos += 1;
            }
            push_token(&mut tokens, start as u32, pos as u32, TokenKind::Plain);
        }
    }

    TokenizerResult { tokens }
}

// ── Helpers ────────────────────────────────────────────────────────

#[inline]
fn push_token(tokens: &mut Vec<u32>, start: u32, end: u32, kind: TokenKind) {
    tokens.push(start);
    tokens.push(end);
    tokens.push(kind as u32);
}

#[inline]
fn starts_with(bytes: &[u8], pos: usize, prefix: &[u8]) -> bool {
    if prefix.is_empty() { return false; }
    pos + prefix.len() <= bytes.len() && &bytes[pos..pos + prefix.len()] == prefix
}

/// Check if position is at the start of a line (only whitespace before it).
#[inline]
fn is_line_start(bytes: &[u8], pos: usize) -> bool {
    for i in 0..pos {
        if bytes[i] != b' ' && bytes[i] != b'\t' {
            return false;
        }
    }
    true
}
