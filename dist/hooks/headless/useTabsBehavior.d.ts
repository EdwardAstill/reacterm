export interface TabBehaviorItem {
    key: string;
    label: string;
    closable?: boolean;
    disabled?: boolean;
}
export interface UseTabsBehaviorOptions {
    tabs: TabBehaviorItem[];
    activeKey: string;
    onChange?: (key: string) => void;
    onClose?: (key: string) => void;
    isActive?: boolean;
    orientation?: "horizontal" | "vertical";
    /** Enable arrow-key navigation. Default: true */
    enableArrows?: boolean;
    /** Enable numeric 1-9 tab selection. Default: true */
    enableNumbers?: boolean;
    /** Enable Delete/Backspace to close active closable tab. Default: true */
    enableCloseKeys?: boolean;
}
export interface UseTabsBehaviorResult {
    /** The currently active tab key */
    activeKey: string;
    /** Set the active tab key (calls onChange) */
    setActiveKey: (key: string) => void;
    /** Get props for a tab trigger element */
    getTriggerProps: (key: string) => {
        isActive: boolean;
        isDisabled: boolean;
        isClosable: boolean;
        onSelect: () => void;
        role: string;
    };
    /** Get props for a tab panel element */
    getPanelProps: (key: string) => {
        isActive: boolean;
        role: string;
        hidden: boolean;
    };
}
export declare function useTabsBehavior(options: UseTabsBehaviorOptions): UseTabsBehaviorResult;
//# sourceMappingURL=useTabsBehavior.d.ts.map