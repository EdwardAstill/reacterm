import React from "react";
import type { StormLayoutStyleProps } from "../../styles/styleProps.js";
export interface StepperContextValue {
    activeStep: number;
    orientation: "horizontal" | "vertical";
    completedColor: string | number;
    activeColor: string | number;
    pendingColor: string | number;
    stepCount: number;
    registerStep: () => number;
}
export declare const StepperContext: React.Context<StepperContextValue | null>;
export declare function useStepperContext(): StepperContextValue;
export interface StepperRootProps {
    activeStep: number;
    orientation?: "horizontal" | "vertical";
    completedColor?: string | number;
    activeColor?: string | number;
    pendingColor?: string | number;
    children: React.ReactNode;
}
declare function StepperRoot({ activeStep, orientation, completedColor: completedColorProp, activeColor: activeColorProp, pendingColor: pendingColorProp, children, }: StepperRootProps): React.ReactElement;
export interface StepperStepProps {
    index: number;
    label: string;
    description?: string;
    children?: React.ReactNode;
}
declare function StepperStep({ index, label, description, children }: StepperStepProps): React.ReactElement;
export interface StepDef {
    label: string;
    description?: string;
}
export interface StepperProps extends StormLayoutStyleProps {
    steps: StepDef[];
    activeStep: number;
    orientation?: "horizontal" | "vertical";
    completedColor?: string | number;
    activeColor?: string | number;
    pendingColor?: string | number;
    /** Custom render for each step. */
    renderStep?: (step: StepDef, state: {
        isActive: boolean;
        isCompleted: boolean;
        index: number;
    }) => React.ReactNode;
}
export declare const Stepper: React.NamedExoticComponent<StepperProps> & {
    Root: typeof StepperRoot;
    Step: typeof StepperStep;
};
export {};
//# sourceMappingURL=Stepper.d.ts.map