import { useRef, useCallback } from "react";
import { useTui } from "../../context/TuiContext.js";
export function useStepperBehavior(options) {
    const { steps, activeStep: rawActiveStep, onStepChange, } = options;
    const { requestRender } = useTui();
    const onStepChangeRef = useRef(onStepChange);
    onStepChangeRef.current = onStepChange;
    // Allow activeStep >= steps.length to indicate all completed
    const activeStep = steps.length > 0
        ? Math.max(0, rawActiveStep)
        : 0;
    const isComplete = useCallback((index) => {
        return index < activeStep;
    }, [activeStep]);
    const getStatus = useCallback((index) => {
        if (index < activeStep)
            return "completed";
        if (index === activeStep)
            return "active";
        return "pending";
    }, [activeStep]);
    const next = useCallback(() => {
        const cb = onStepChangeRef.current;
        if (cb) {
            cb(activeStep + 1);
        }
    }, [activeStep]);
    const prev = useCallback(() => {
        const cb = onStepChangeRef.current;
        if (cb && activeStep > 0) {
            cb(activeStep - 1);
        }
    }, [activeStep]);
    const goTo = useCallback((step) => {
        const cb = onStepChangeRef.current;
        if (cb) {
            cb(Math.max(0, step));
        }
    }, []);
    const stepProps = useCallback((index) => {
        const status = getStatus(index);
        const step = steps[index];
        return {
            status,
            isComplete: index < activeStep,
            isActive: index === activeStep,
            isPending: index > activeStep,
            label: step?.label ?? "",
            description: step?.description,
            index,
        };
    }, [steps, activeStep, getStatus]);
    return {
        activeStep,
        totalSteps: steps.length,
        isComplete,
        getStatus,
        next,
        prev,
        goTo,
        isAllComplete: activeStep >= steps.length,
        stepProps,
    };
}
//# sourceMappingURL=useStepperBehavior.js.map