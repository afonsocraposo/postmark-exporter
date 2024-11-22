"use server";

import { ServerClient } from 'postmark';
import { Bounce, OutboundMessage, OutboundMessageStatus } from 'postmark/dist/client/models';
import { convertUTCtoEastern } from './time';

function getPostmarkClient(token: string): ServerClient {
    return new ServerClient(token);
}

const BATCH_SIZE = 500;
const MAX_MESSAGES = 3000;

export async function getMessagesTotalCount(token: string, stream: string, tag: string, start: Date, end: Date): Promise<number> {
    const client = getPostmarkClient(token);

    const fromDate = convertUTCtoEastern(start.toISOString());
    const toDate = convertUTCtoEastern(end.toISOString());

    const { TotalCount: total } = await client.getOutboundMessages({ count: 1, offset: 0, tag, messageStream: stream, fromDate, toDate, status: OutboundMessageStatus.Sent });

    return parseInt(total);
}

export async function getBouncesTotalCount(token: string, stream: string, tag: string, start: Date, end: Date): Promise<number> {
    const client = getPostmarkClient(token);

    const fromDate = convertUTCtoEastern(start.toISOString());
    const toDate = convertUTCtoEastern(end.toISOString());

    const { TotalCount: total } = await client.getBounces({ count: 1, offset: 0, tag, messageStream: stream, fromDate, toDate });

    return total;
}


export async function searchMessages(token: string, stream: string, tag: string, start: Date, end: Date, offset: number=0): Promise<any> {
    const client = getPostmarkClient(token);
    const allMessages: OutboundMessage[] = [];

    let fromDate = convertUTCtoEastern(start.toISOString());
    const toDate = convertUTCtoEastern(end.toISOString());
    try {
        while (true) {
            const { TotalCount: total, Messages: messages } = await client.getOutboundMessages({ count: BATCH_SIZE, offset, tag, messageStream: stream, fromDate, toDate, status: OutboundMessageStatus.Sent });
            if (messages.length === 0) {
                break;
            }
            allMessages.push(...messages);
            offset += messages.length;
            if (offset >= parseInt(total)) {
                return { messages: allMessages, hasMore: false, newEnd: undefined };
            }

            if (offset >= MAX_MESSAGES) {
                return { messages: allMessages, hasMore: true, newEnd: new Date(messages[messages.length - 1].ReceivedAt) };
            }
        }
    } catch (e) {
        console.error(e);
    }
    return { messages: allMessages, hasMore: false, newEnd: undefined };
}

export async function searchBounces(token: string, stream: string, tag: string, start: Date, end: Date, offset: number=0): Promise<any> {
    const client = getPostmarkClient(token);
    const allMessages: Bounce[] = [];

    const fromDate = convertUTCtoEastern(start.toISOString());
    let toDate = convertUTCtoEastern(end.toISOString());
    try {
        while (true) {
            const { TotalCount: total, Bounces: messages } = await client.getBounces({ count: BATCH_SIZE, offset, tag, messageStream: stream, fromDate, toDate });
            if (messages.length === 0) {
                break;
            }
            allMessages.push(...messages);
            offset += messages.length;

            console.log(fromDate, toDate, offset, allMessages.length, total)

            if (offset >= total) {
                return { messages: allMessages, hasMore: false, newEnd: undefined };
            }

            if (offset >= MAX_MESSAGES) {
                return { messages: allMessages, hasMore: true, newEnd: new Date(messages[messages.length - 1].BouncedAt) };
            }
        }
    } catch (e) {
        console.error(e);
    }
    return { messages: allMessages, hasMore: false, newEnd: undefined };
}
