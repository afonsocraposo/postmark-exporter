function timeDiff(date1:Date, date2: Date): [number, string]{
    const timeIntervals = [31536000, 2628000, 604800, 86400, 3600, 60, 1];
    const intervalNames = ['year', 'month', 'week', 'day', 'hour', 'minute', 'second'];

    const diff = Math.abs(date2.getTime()-date1.getTime())/1000;
    const index = timeIntervals.findIndex(i=>(diff/i) >= 1);
    const n = Math.floor(diff/timeIntervals[index]);
    const interval = intervalNames[index];

    return [n, interval];
}

function localize(value:number, str:string):string
{
    if (value != 1)
        str += 's';

    return `${value} ${str}`
}

export function humanReadableTimeDiff(date1:Date, date2: Date): string{
    return localize(...timeDiff(date1, date2));
}
