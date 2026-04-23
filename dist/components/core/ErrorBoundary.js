import React from "react";
import { colors as staticColors } from "../../theme/colors.js";
export class ErrorBoundary extends React.Component {
    state = { error: null };
    static getDerivedStateFromError(error) {
        return { error };
    }
    componentDidCatch(error, errorInfo) {
        this.props.onError?.(error, errorInfo);
    }
    reset = () => {
        this.setState({ error: null });
    };
    render() {
        if (this.state.error) {
            const { fallback } = this.props;
            if (typeof fallback === "function") {
                return fallback(this.state.error, this.reset);
            }
            if (fallback)
                return fallback;
            // Default fallback: show error in a box
            return React.createElement("tui-box", { flexDirection: "column" }, React.createElement("tui-text", { color: staticColors.error, bold: true }, "Error: " + this.state.error.message));
        }
        return this.props.children;
    }
}
//# sourceMappingURL=ErrorBoundary.js.map