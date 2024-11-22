import { NextResponse } from 'next/server';
import { getMessagesTotalCount, searchMessages } from '../../../lib/postmark';
import { convertToCSV } from '../../../lib/csv';
import { Readable } from 'stream';

export const maxDuration = 30;

export async function GET(request: Request): Promise<NextResponse> {
    const token = request.headers.get('X-Postmark-Server-Token') || '';
    const url = new URL(request.url);
    const stream = url.searchParams.get('stream') || '';
    const tag = url.searchParams.get('tag') || '';
    const header = url.searchParams.get('header') || '';

    const startParam = url.searchParams.get('start') || '';
    const endParam = url.searchParams.get('end') || '';
    if (!startParam || !endParam) {
        throw new Error('Missing start or end date');
    }
    const start = new Date(startParam);
    let end = new Date(endParam);
    const now = new Date();
    if (end > now) {
        end = now;
    }


    let isLocked = false; // Lock mechanism

    // Create a Readable stream
    let offset = 0;
    const total = await getMessagesTotalCount(token, stream, tag, start, end);
    const readableStream = new Readable({
        async read() {
            if (isLocked) {
                return; // Prevent concurrent execution
            }

            isLocked = true; // Acquire the lock

            try {
                let generateHeader = header !== 'false';

                while (true) {
                    // Fetch a single page of messages
                    const { messages, hasMore } = await searchMessages(token, stream, tag, start, end, offset);

                    // Convert messages to CSV and push to the stream
                    const csvData = convertToCSV(messages, generateHeader);
                    generateHeader = false;
                    offset += messages.length;
                    this.push(csvData);

                    if (!hasMore) {
                        break;
                    }
                }

                // Signal that the stream has ended
                this.push(null);
            } catch (error) {
                // Handle any error and terminate the stream
                this.destroy(error as Error);
            } finally {
                isLocked = false; // Release the lock
            }
        },
    });

    // Return the stream as the response
    return new NextResponse(readableStream as any, {
        headers: {
            'Content-Type': 'text/csv',
            'Content-Disposition': `attachment; filename="bounces-${Date.now()}.csv"`,
            'Content-Length': total.toString(),
            'Transfer-Encoding': 'chunked',
        },
    });
}

