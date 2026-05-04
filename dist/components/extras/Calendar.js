import React, { useRef, useCallback, createContext, useContext } from "react";
import { useInput } from "../../hooks/useInput.js";
import { useTui } from "../../context/TuiContext.js";
import { useColors } from "../../hooks/useColors.js";
import { usePluginProps } from "../../hooks/usePluginProps.js";
import { pickLayoutProps } from "../../styles/applyStyles.js";
import { MONTH_NAMES, DAY_HEADERS_SUN, DAY_HEADERS_MON, getDaysInMonth, getFirstDayOfWeek } from "../../utils/date.js";
export const CalendarContext = createContext(null);
export function useCalendarContext() {
    const ctx = useContext(CalendarContext);
    if (!ctx)
        throw new Error("Calendar sub-components must be used inside Calendar.Root");
    return ctx;
}
function CalendarRoot({ year, month, selectedDay, focusedDay, onSelect, onMonthChange, children }) {
    const colors = useColors();
    const { requestRender } = useTui();
    const onSelectRef = useRef(onSelect);
    onSelectRef.current = onSelect;
    const onMonthChangeRef = useRef(onMonthChange);
    onMonthChangeRef.current = onMonthChange;
    const ctx = {
        year,
        month,
        selectedDay,
        focusedDay,
        selectDay: (day) => { onSelectRef.current?.(day); requestRender(); },
        changeMonth: (y, m) => { onMonthChangeRef.current?.(y, m); requestRender(); },
    };
    return React.createElement(CalendarContext.Provider, { value: ctx }, React.createElement("tui-box", { flexDirection: "column" }, children));
}
function CalendarCompoundHeader() {
    const colors = useColors();
    const { year, month, changeMonth } = useCalendarContext();
    const monthName = MONTH_NAMES[Math.max(0, Math.min(11, month - 1))] ?? "";
    return React.createElement("tui-box", { flexDirection: "row" }, React.createElement("tui-text", { color: colors.text.dim }, "< "), React.createElement("tui-text", { bold: true, color: colors.text.primary }, `${monthName} ${year}`), React.createElement("tui-text", { color: colors.text.dim }, " >"));
}
function CalendarCompoundGrid({ weekStartsOn = 0, children }) {
    const colors = useColors();
    const dayHeaders = weekStartsOn === 1 ? "Mo Tu We Th Fr Sa Su" : "Su Mo Tu We Th Fr Sa";
    return React.createElement("tui-box", { flexDirection: "column" }, React.createElement("tui-text", { color: colors.text.secondary }, dayHeaders), children);
}
function CalendarCompoundDay({ day, children }) {
    const colors = useColors();
    const { selectedDay, focusedDay, selectDay } = useCalendarContext();
    const isSelected = day === selectedDay;
    const isFocused = day === focusedDay;
    const ds = String(day).padStart(2, " ");
    if (children) {
        return React.createElement("tui-box", null, children);
    }
    return React.createElement("tui-text", {
        ...(isSelected ? { bold: true, inverse: true, color: colors.brand.primary } : {}),
        ...(isFocused && !isSelected ? { underline: true } : {}),
    }, ds);
}
const CalendarBase = React.memo(function Calendar(rawProps) {
    const colors = useColors();
    const props = usePluginProps("Calendar", rawProps);
    const { year, month: rawMonth, selectedDay: rawSelectedDay, onSelect, onMonthChange, color = colors.text.primary, selectedColor = colors.brand.primary, today: todayProp, isFocused = true, rangeStart, rangeEnd, disabledDates, weekStartsOn = 0, } = props;
    // Clamp month to 1-12
    const month = Math.max(1, Math.min(12, rawMonth));
    // Clamp selectedDay to valid range for this month
    const maxDay = getDaysInMonth(year, month);
    const selectedDay = rawSelectedDay !== undefined
        ? Math.max(1, Math.min(maxDay, rawSelectedDay))
        : undefined;
    const onSelectRef = useRef(onSelect);
    onSelectRef.current = onSelect;
    const onMonthChangeRef = useRef(onMonthChange);
    onMonthChangeRef.current = onMonthChange;
    const selectedDayRef = useRef(selectedDay);
    selectedDayRef.current = selectedDay;
    const yearRef = useRef(year);
    yearRef.current = year;
    const monthRef = useRef(month);
    monthRef.current = month;
    const disabledDatesRef = useRef(disabledDates);
    disabledDatesRef.current = disabledDates;
    /** Check if a day is disabled */
    const isDayDisabled = (day) => {
        if (!disabledDatesRef.current)
            return false;
        return disabledDatesRef.current(new Date(yearRef.current, monthRef.current - 1, day));
    };
    const handleInput = useCallback((event) => {
        if (event.key === "left") {
            const cb = onSelectRef.current;
            const day = selectedDayRef.current;
            if (!cb || day === undefined)
                return;
            const daysInMonth = getDaysInMonth(yearRef.current, monthRef.current);
            const findNextDay = (start, direction, step) => {
                let next = start + step * direction;
                if (next < 1 || next > daysInMonth)
                    return start;
                let attempts = 0;
                while (isDayDisabled(next) && attempts < daysInMonth) {
                    next += direction;
                    if (next < 1 || next > daysInMonth)
                        return start;
                    attempts++;
                }
                return next;
            };
            const next = day > 1 ? findNextDay(day, -1, 1) : daysInMonth;
            if (!isDayDisabled(next))
                cb(next);
        }
        else if (event.key === "right") {
            const cb = onSelectRef.current;
            const day = selectedDayRef.current;
            if (!cb || day === undefined)
                return;
            const daysInMonth = getDaysInMonth(yearRef.current, monthRef.current);
            const findNextDay = (start, direction, step) => {
                let next = start + step * direction;
                if (next < 1 || next > daysInMonth)
                    return start;
                let attempts = 0;
                while (isDayDisabled(next) && attempts < daysInMonth) {
                    next += direction;
                    if (next < 1 || next > daysInMonth)
                        return start;
                    attempts++;
                }
                return next;
            };
            const next = day < daysInMonth ? findNextDay(day, 1, 1) : 1;
            if (!isDayDisabled(next))
                cb(next);
        }
        else if (event.key === "up") {
            const cb = onSelectRef.current;
            const day = selectedDayRef.current;
            if (!cb || day === undefined)
                return;
            const daysInMonth = getDaysInMonth(yearRef.current, monthRef.current);
            const findNextDay = (start, direction, step) => {
                let next = start + step * direction;
                if (next < 1 || next > daysInMonth)
                    return start;
                let attempts = 0;
                while (isDayDisabled(next) && attempts < daysInMonth) {
                    next += direction;
                    if (next < 1 || next > daysInMonth)
                        return start;
                    attempts++;
                }
                return next;
            };
            if (day > 7) {
                const next = findNextDay(day, -1, 7);
                if (!isDayDisabled(next))
                    cb(next);
            }
            else {
                const mcb = onMonthChangeRef.current;
                if (mcb) {
                    const py = monthRef.current === 1 ? yearRef.current - 1 : yearRef.current;
                    const pm = monthRef.current === 1 ? 12 : monthRef.current - 1;
                    mcb(py, pm);
                }
            }
        }
        else if (event.key === "down") {
            const cb = onSelectRef.current;
            const day = selectedDayRef.current;
            if (!cb || day === undefined)
                return;
            const daysInMonth = getDaysInMonth(yearRef.current, monthRef.current);
            const findNextDay = (start, direction, step) => {
                let next = start + step * direction;
                if (next < 1 || next > daysInMonth)
                    return start;
                let attempts = 0;
                while (isDayDisabled(next) && attempts < daysInMonth) {
                    next += direction;
                    if (next < 1 || next > daysInMonth)
                        return start;
                    attempts++;
                }
                return next;
            };
            if (day + 7 <= daysInMonth) {
                const next = findNextDay(day, 1, 7);
                if (!isDayDisabled(next))
                    cb(next);
            }
            else {
                const mcb = onMonthChangeRef.current;
                if (mcb) {
                    const ny = monthRef.current === 12 ? yearRef.current + 1 : yearRef.current;
                    const nm = monthRef.current === 12 ? 1 : monthRef.current + 1;
                    mcb(ny, nm);
                }
            }
        }
        else if (event.key === "pageup") {
            const mcb = onMonthChangeRef.current;
            if (mcb) {
                const py = monthRef.current === 1 ? yearRef.current - 1 : yearRef.current;
                const pm = monthRef.current === 1 ? 12 : monthRef.current - 1;
                mcb(py, pm);
            }
        }
        else if (event.key === "pagedown") {
            const mcb = onMonthChangeRef.current;
            if (mcb) {
                const ny = monthRef.current === 12 ? yearRef.current + 1 : yearRef.current;
                const nm = monthRef.current === 12 ? 1 : monthRef.current + 1;
                mcb(ny, nm);
            }
        }
    }, []);
    useInput(handleInput, { isActive: isFocused });
    const todayDate = todayProp ?? new Date();
    const isCurrentMonth = todayDate.getFullYear() === year && todayDate.getMonth() + 1 === month;
    const todayDay = isCurrentMonth ? todayDate.getDate() : -1;
    const rangeStartTime = rangeStart ? rangeStart.getTime() : null;
    const rangeEndTime = rangeEnd ? rangeEnd.getTime() : null;
    const hasRange = rangeStartTime !== null && rangeEndTime !== null;
    const rangeMin = hasRange ? Math.min(rangeStartTime, rangeEndTime) : 0;
    const rangeMax = hasRange ? Math.max(rangeStartTime, rangeEndTime) : 0;
    const isInRange = (day) => {
        if (!hasRange)
            return false;
        const dayTime = new Date(year, month - 1, day).getTime();
        return dayTime >= rangeMin && dayTime <= rangeMax;
    };
    const daysInMonth = getDaysInMonth(year, month);
    const rawFirstDay = getFirstDayOfWeek(year, month);
    const firstDay = weekStartsOn === 1
        ? (rawFirstDay === 0 ? 6 : rawFirstDay - 1)
        : rawFirstDay;
    const monthName = MONTH_NAMES[month - 1] ?? "";
    const headerText = `${monthName} ${year}`;
    const rows = [];
    // Month + year header with navigation hints
    rows.push(React.createElement("tui-box", { key: "header", flexDirection: "row" }, React.createElement("tui-text", { key: "nav-left", color: colors.text.dim }, "< "), React.createElement("tui-text", { key: "title", bold: true, color }, headerText), React.createElement("tui-text", { key: "nav-right", color: colors.text.dim }, " >")));
    // Day-of-week row
    const dayHeaders = weekStartsOn === 1 ? DAY_HEADERS_MON : DAY_HEADERS_SUN;
    rows.push(React.createElement("tui-text", { key: "days", color: colors.text.secondary }, dayHeaders));
    let dayOfWeek = firstDay;
    for (let d = 1; d <= daysInMonth;) {
        const weekKey = `week-${d}`;
        const weekChildren = [];
        const weekStartDay = d;
        if (weekStartDay === 1 && firstDay > 0) {
            weekChildren.push(React.createElement("tui-text", { key: "pad" }, "   ".repeat(firstDay)));
        }
        const daysLeftInWeek = 7 - dayOfWeek;
        const weekEndDay = Math.min(daysInMonth, d + daysLeftInWeek - 1);
        for (let wd = d; wd <= weekEndDay; wd++) {
            const ds = String(wd).padStart(2, " ");
            const disabled = disabledDates ? disabledDates(new Date(year, month - 1, wd)) : false;
            const inRange = isInRange(wd);
            if (props.renderDay) {
                weekChildren.push(React.createElement(React.Fragment, { key: `d${wd}` }, props.renderDay(wd, { isSelected: wd === selectedDay, isToday: wd === todayDay, isDisabled: disabled, isInRange: inRange })));
            }
            else if (disabled) {
                weekChildren.push(React.createElement("tui-text", { key: `d${wd}`, color: colors.text.disabled, dim: true }, ds));
            }
            else if (wd === selectedDay) {
                weekChildren.push(React.createElement("tui-text", { key: `d${wd}`, bold: true, inverse: true, color: selectedColor }, ds));
            }
            else if (inRange) {
                weekChildren.push(React.createElement("tui-text", { key: `d${wd}`, color: selectedColor, inverse: true }, ds));
            }
            else if (wd === todayDay) {
                weekChildren.push(React.createElement("tui-text", { key: `d${wd}`, color, underline: true }, ds));
            }
            else {
                weekChildren.push(React.createElement("tui-text", { key: `d${wd}`, color }, ds));
            }
            if (wd < weekEndDay || (weekEndDay < daysInMonth && dayOfWeek + (wd - d) < 6)) {
                weekChildren.push(React.createElement("tui-text", { key: `s${wd}` }, " "));
            }
        }
        rows.push(React.createElement("tui-box", { key: weekKey, flexDirection: "row" }, ...weekChildren));
        d = weekEndDay + 1;
        dayOfWeek = 0;
    }
    const outerBoxProps = {
        flexDirection: "column",
        overflow: "hidden",
        role: "grid",
        "aria-label": props["aria-label"],
        ...pickLayoutProps(props),
    };
    return React.createElement("tui-box", outerBoxProps, ...rows);
});
export const Calendar = Object.assign(CalendarBase, {
    Root: CalendarRoot,
    Header: CalendarCompoundHeader,
    Grid: CalendarCompoundGrid,
    Day: CalendarCompoundDay,
});
//# sourceMappingURL=Calendar.js.map