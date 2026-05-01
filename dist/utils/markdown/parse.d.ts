export type InlineToken = {
    type: "text";
    value: string;
} | {
    type: "bold";
    children: InlineToken[];
} | {
    type: "italic";
    children: InlineToken[];
} | {
    type: "bolditalic";
    children: InlineToken[];
} | {
    type: "strikethrough";
    children: InlineToken[];
} | {
    type: "code";
    value: string;
} | {
    type: "link";
    text: string;
    url: string;
} | {
    type: "image";
    alt: string;
    url: string;
};
export type Block = {
    type: "heading";
    level: 1 | 2 | 3 | 4 | 5 | 6;
    text: string;
} | {
    type: "paragraph";
    text: string;
} | {
    type: "codeblock";
    language: string;
    content: string;
} | {
    type: "blockquote";
    lines: string[];
} | {
    type: "hr";
} | {
    type: "ulist";
    items: ListNode[];
} | {
    type: "olist";
    items: ListNode[];
    start: number;
} | {
    type: "table";
    headers: string[];
    alignments: ("left" | "center" | "right")[];
    rows: string[][];
};
export interface ListNode {
    text: string;
    checked?: boolean | undefined;
    children: ListNode[];
    ordered: boolean;
    start: number;
}
export declare function parseInline(src: string): InlineToken[];
export declare function parseBlocks(content: string): Block[];
//# sourceMappingURL=parse.d.ts.map