import type { ReactermColors } from "../theme/colors.js";
import { useTheme } from "../theme/provider.js";

export function useColors(): ReactermColors {
  return useTheme().colors;
}
