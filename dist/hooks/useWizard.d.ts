export interface WizardStep {
    key: string;
    label: string;
    validate?: () => string | null;
}
export interface UseWizardOptions {
    steps: WizardStep[];
    onComplete?: () => void;
}
export interface UseWizardResult {
    currentStep: number;
    currentKey: string;
    isFirst: boolean;
    isLast: boolean;
    error: string | null;
    next: () => boolean;
    prev: () => void;
    goTo: (step: number) => void;
    isComplete: boolean;
}
export declare function useWizard(options: UseWizardOptions): UseWizardResult;
//# sourceMappingURL=useWizard.d.ts.map