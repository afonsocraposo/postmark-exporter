import { ServerClient } from 'postmark';
import { Bounce, OutboundMessage } from 'postmark/dist/client/models';

function getPostmarkClient(token: string): ServerClient {
    console.log(token);
    return new ServerClient(token);
}

const BATCH_SIZE = 500;

export async function searchMessages(token: string, stream: string, tag: string): Promise<OutboundMessage[]> {
    const client = getPostmarkClient(token);
    let offset = 0;
    const allMessages: OutboundMessage[] = [];
    try {
        while (true) {
            const { TotalCount: total, Messages: messages } = await client.getOutboundMessages({ count: BATCH_SIZE, offset, tag, messageStream: stream });
            if (messages.length === 0) {
                break;
            }
            allMessages.push(...messages);
            offset += messages.length;
            if (offset >= parseInt(total)) {
                break;
            }
        }
        return allMessages;
    } catch (e) {
        console.error(e);
        return [];
    }
}

export async function searchBounces(token: string, stream: string, tag: string): Promise<Bounce[]> {
    const client = getPostmarkClient(token);
    let offset = 0;
    const allMessages: Bounce[] = [];
    try {
        while (true) {
            const { TotalCount: total, Bounces: messages } = await client.getBounces({ count: BATCH_SIZE, offset, tag, messageStream: stream });
            if (messages.length === 0) {
                break;
            }
            allMessages.push(...messages);
            offset += messages.length;
            if (offset >= total) {
                break;
            }
        }
        return allMessages;
    } catch (e) {
        console.error(e);
        return [];
    }
}

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

