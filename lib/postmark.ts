"use server";

import { ServerClient } from 'postmark';
import { Bounce, OutboundMessage, OutboundMessageStatus } from 'postmark/dist/client/models';
import { convertUTCtoEastern } from './time';

function getPostmarkClient(token: string): ServerClient {
    return new ServerClient(token);
}

const BATCH_SIZE = 500;
const MAX_MESSAGES = 2000;

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

export async function searchMessages(token: string, stream: string, tag: string, start: Date, end: Date, offset: number = 0): Promise<any> {
    const client = getPostmarkClient(token);
    const allMessages: OutboundMessage[] = [];
    let total = 0;

    const fromDate = convertUTCtoEastern(start.toISOString());
    let toDate = convertUTCtoEastern(end.toISOString());
    try {
        const { TotalCount: totalCount, Messages: messages } = await client.getOutboundMessages({ count: BATCH_SIZE, offset, tag, messageStream: stream, fromDate, toDate, status: OutboundMessageStatus.Sent });
        total = parseInt(totalCount);

        if (messages.length === 0) {
            return { messages: allMessages, hasMore: false, total };
        }
        allMessages.push(...messages);
        offset += messages.length;

        if (offset >= total) {
            return { messages: allMessages, hasMore: false, total };
        }

        if (offset >= MAX_MESSAGES) {
            return { messages: allMessages, hasMore: false, total };
        }

    } catch (e) {
        console.error(e);
    }
    return { messages: allMessages, hasMore: true, total };
}

export async function searchBounces(token: string, stream: string, tag: string, start: Date, end: Date, offset: number = 0): Promise<any> {
    const client = getPostmarkClient(token);
    const allMessages: Bounce[] = [];
    let total = 0;

    const fromDate = convertUTCtoEastern(start.toISOString());
    let toDate = convertUTCtoEastern(end.toISOString());
    try {
        const { TotalCount: totalCount, Bounces: messages } = await client.getBounces({ count: BATCH_SIZE, offset, tag, messageStream: stream, fromDate, toDate });
        total = totalCount;

        if (messages.length === 0) {
            return { messages: allMessages, hasMore: false, total };
        }
        allMessages.push(...messages);
        offset += messages.length;

        if (offset >= total) {
            return { messages: allMessages, hasMore: false, total };
        }

        if (offset >= MAX_MESSAGES) {
            return { messages: allMessages, hasMore: false, total };
        }

    } catch (e) {
        console.error(e);
    }
    return { messages: allMessages, hasMore: true, total };
}
