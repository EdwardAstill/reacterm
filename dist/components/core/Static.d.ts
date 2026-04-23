import React from "react";
export interface StaticProps<T> {
    items: T[];
    children: (item: T, index: number) => React.ReactNode;
}
declare function StaticInner<T>(props: StaticProps<T>): React.ReactElement;
export declare const Static: typeof StaticInner;
export {};
//# sourceMappingURL=Static.d.ts.map