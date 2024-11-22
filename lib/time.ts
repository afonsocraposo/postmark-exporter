function timeDiff(date1: Date, date2: Date): [number, string] {
    const timeIntervals = [31536000, 2628000, 604800, 86400, 3600, 60, 1];
    const intervalNames = ['year', 'month', 'week', 'day', 'hour', 'minute', 'second'];

    const diff = Math.abs(date2.getTime() - date1.getTime()) / 1000;
    const index = timeIntervals.findIndex(i => (diff / i) >= 1);
    const n = Math.floor(diff / timeIntervals[index]);
    const interval = intervalNames[index];

    return [n, interval];
}

function localize(value: number, str: string): string {
    if (value != 1)
        str += 's';

    return `${value} ${str}`
}

export function humanReadableTimeDiff(date1: Date, date2: Date): string {
    if (areDaysEqual(date1, date2)) return 'Today';
    return "Last " + localize(...timeDiff(date1, date2));
}
export const areDaysEqual = (date1: Date, date2: Date) => {
    return date1.getFullYear() == date2.getFullYear() && date1.getMonth() == date2.getMonth() && date1.getDate() == date2.getDate();
}

import dayjs from 'dayjs';
import utc from 'dayjs/plugin/utc';
import timezone from 'dayjs/plugin/timezone';

// Load plugins
dayjs.extend(utc);
dayjs.extend(timezone);

export function convertUTCtoEastern(utcTime: string): string {
    const time = dayjs.utc(utcTime);
    // return as YYYY-MM-DDT23:00:00
    return time.tz('America/New_York').format().slice(0, 19);
}
