export interface StepBehaviorDef {
    label: string;
    description?: string;
}
export type StepStatus = "completed" | "active" | "pending";
export interface UseStepperBehaviorOptions {
    steps: StepBehaviorDef[];
    activeStep: number;
    onStepChange?: (step: number) => void;
}
export interface UseStepperBehaviorResult {
    /** The current active step index */
    activeStep: number;
    /** Total number of steps */
    totalSteps: number;
    /** Check if a step at the given index is complete */
    isComplete: (index: number) => boolean;
    /** Get the status of a step ("completed" | "active" | "pending") */
    getStatus: (index: number) => StepStatus;
    /** Go to the next step */
    next: () => void;
    /** Go to the previous step */
    prev: () => void;
    /** Go to a specific step */
    goTo: (step: number) => void;
    /** Whether all steps are complete */
    isAllComplete: boolean;
    /** Get props for a step by its index */
    stepProps: (index: number) => {
        status: StepStatus;
        isComplete: boolean;
        isActive: boolean;
        isPending: boolean;
        label: string;
        description: string | undefined;
        index: number;
    };
}
export declare function useStepperBehavior(options: UseStepperBehaviorOptions): UseStepperBehaviorResult;
//# sourceMappingURL=useStepperBehavior.d.ts.map