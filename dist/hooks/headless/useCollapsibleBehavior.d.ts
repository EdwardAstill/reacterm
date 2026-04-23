export interface UseCollapsibleBehaviorOptions {
    expanded?: boolean;
    onToggle?: (expanded: boolean) => void;
    isActive?: boolean;
    animated?: boolean;
}
export interface UseCollapsibleBehaviorResult {
    /** Whether the section is currently expanded */
    expanded: boolean;
    /** Toggle the expanded state */
    toggle: () => void;
    /** Animation progress (0 = collapsed, 1 = expanded) */
    animationProgress: number;
    /** Whether an animation is currently in progress */
    isAnimating: boolean;
    /** Props for the header/trigger element */
    headerProps: {
        onToggle: () => void;
        role: string;
        expanded: boolean;
    };
    /** Props for the content element */
    contentProps: {
        visible: boolean;
        role: string;
    };
}
export declare function useCollapsibleBehavior(options: UseCollapsibleBehaviorOptions): UseCollapsibleBehaviorResult;
//# sourceMappingURL=useCollapsibleBehavior.d.ts.map