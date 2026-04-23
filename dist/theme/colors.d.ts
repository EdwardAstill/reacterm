export type StormColors = {
    brand: {
        primary: string;
        light: string;
        glow: string;
    };
    text: {
        primary: string;
        secondary: string;
        dim: string;
        disabled: string;
    };
    surface: {
        base: string;
        raised: string;
        overlay: string;
        highlight: string;
    };
    divider: string;
    success: string;
    warning: string;
    error: string;
    info: string;
    system: {
        text: string;
    };
    user: {
        symbol: string;
    };
    assistant: {
        symbol: string;
    };
    thinking: {
        symbol: string;
        shimmer: string;
    };
    tool: {
        running: string;
        completed: string;
        failed: string;
        pending: string;
        cancelled: string;
    };
    approval: {
        approve: string;
        deny: string;
        always: string;
        header: string;
        border: string;
    };
    input: {
        border: string;
        borderActive: string;
        prompt: string;
    };
    diff: {
        added: string;
        removed: string;
        addedBg: string;
        removedBg: string;
    };
    syntax: {
        keyword: string;
        string: string;
        number: string;
        function: string;
        type: string;
        comment: string;
        operator: string;
    };
};
export declare const colors: StormColors;
//# sourceMappingURL=colors.d.ts.map