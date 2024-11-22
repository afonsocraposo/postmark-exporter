export function convertToCSV(messages: any[], includeHeaders: boolean = true): string {
    if (messages.length === 0) return '';

    // Format each message into a CSV row
    const rows = messages.map(message => {
        return Object.values(message).map(value => {
            if (Array.isArray(value)) {
                // Join arrays with commas
                return `"${value.map(item => JSON.stringify(item)).join(', ').replace(/\n/g, ' ')}"`;
            } else if (typeof value === 'object' && value !== null) {
                // Serialize objects to JSON and remove newline characters
                return `"${JSON.stringify(value).replace(/"/g, '""').replace(/\n/g, ' ')}"`;
            } else if (typeof value === 'string') {
                // Escape double quotes and remove newline characters for strings
                return `"${value.replace(/"/g, '""').replace(/\n/g, ' ')}"`;
            } else {
                // Default handling for other types (e.g., null, numbers, booleans)
                return `"${String(value).replace(/\n/g, ' ')}"`;
            }
        }).join(',');
    });

    if (!includeHeaders) return rows.join('\n') + '\n';

    // Define CSV headers based on keys in the first message
    const headers = Object.keys(messages[0]).join(',');
    return [headers, ...rows].join('\n') + '\n';
}
