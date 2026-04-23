export function useStderr() {
    return {
        stderr: process.stderr,
        write: (data) => {
            try {
                process.stderr.write(data);
            }
            catch {
                // stderr may be closed
            }
        },
    };
}
//# sourceMappingURL=useStderr.js.map