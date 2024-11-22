"use server";

import { ServerClient } from 'postmark';
import { Bounce, OutboundMessage, OutboundMessageStatus } from 'postmark/dist/client/models';
import { convertUTCtoEastern } from './time';

function getPostmarkClient(token: string): ServerClient {
    return new ServerClient(token);
}

const BATCH_SIZE = 500;
const MAX_MESSAGES = 10000;

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


export async function searchMessages(token: string, stream: string, tag: string, start: Date, end: Date): Promise<OutboundMessage[]> {
    const client = getPostmarkClient(token);
    let offset = 0;
    const allMessages: OutboundMessage[] = [];

    const fromDate = convertUTCtoEastern(start.toISOString());
    const toDate = convertUTCtoEastern(end.toISOString());
    try {
        while (true) {
            const { TotalCount: total, Messages: messages } = await client.getOutboundMessages({ count: BATCH_SIZE, offset, tag, messageStream: stream, fromDate, toDate, status: OutboundMessageStatus.Sent });
            if (messages.length === 0) {
                break;
            }
            allMessages.push(...messages);
            offset += messages.length;
            if (offset >= parseInt(total) || offset > MAX_MESSAGES) {
                break;
            }
        }
        return allMessages;
    } catch (e) {
        console.error(e);
        return allMessages;
    }
}

export async function searchBounces(token: string, stream: string, tag: string, start: Date, end: Date): Promise<Bounce[]> {
    const client = getPostmarkClient(token);
    let offset = 0;
    const allMessages: Bounce[] = [];

    const fromDate = convertUTCtoEastern(start.toISOString());
    const toDate = convertUTCtoEastern(end.toISOString());
    try {
        while (true) {
            const { TotalCount: total, Bounces: messages } = await client.getBounces({ count: BATCH_SIZE, offset, tag, messageStream: stream, fromDate, toDate });
            if (messages.length === 0) {
                break;
            }
            allMessages.push(...messages);
            offset += messages.length;
            if (offset >= total || offset > MAX_MESSAGES) {
                break;
            }
        }
        return allMessages;
    } catch (e) {
        console.error(e);
        return allMessages;
    }
}


