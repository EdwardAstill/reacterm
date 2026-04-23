import React from "react";
export interface DiagramNode {
    id: string;
    label: string;
    sublabel?: string;
    color?: string | number;
    width?: number;
}
export interface DiagramEdge {
    from: string;
    to: string;
    label?: string;
}
export interface DiagramProps {
    nodes: DiagramNode[];
    edges: DiagramEdge[];
    direction?: "horizontal" | "vertical";
    nodeStyle?: "round" | "single" | "double" | "heavy";
    arrowChar?: string;
    gapX?: number;
    gapY?: number;
    color?: string | number;
    edgeColor?: string | number;
}
export declare const Diagram: React.NamedExoticComponent<DiagramProps>;
//# sourceMappingURL=Diagram.d.ts.map