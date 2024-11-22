export function convertToCSV(messages: any[]): string {
    if (messages.length === 0) return '';

    // Define CSV headers based on keys in the first message
    const headers = Object.keys(messages[0]).join(',');

    // Format each message into a CSV row
    const rows = messages.map(message => {
        return Object.values(message).map(value => {
            if (Array.isArray(value)) {
                // Join arrays with commas
                return `"${value.map(item => JSON.stringify(item)).join(', ')}"`;
            } else if (typeof value === 'object' && value !== null) {
                // Serialize objects to JSON
                return `"${JSON.stringify(value).replace(/"/g, '""')}"`;
            } else if (typeof value === 'string') {
                // Escape double quotes for strings
                return `"${value.replace(/"/g, '""')}"`;
            } else {
                // Default handling for other types (e.g., null, numbers, booleans)
                return `"${String(value)}"`;
            }
        }).join(',');
    });

    return [headers, ...rows].join('\n');
}
