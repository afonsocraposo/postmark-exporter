import { NextResponse } from 'next/server';
import { searchMessages } from '../../../lib/postmark';
import { convertToCSV } from '../../../lib/csv';
import { Readable } from 'stream';

export const maxDuration = 30;

export async function GET(request: Request): Promise<NextResponse> {
    const token = request.headers.get('X-Postmark-Server-Token') || '';
    const url = new URL(request.url);
    const stream = url.searchParams.get('stream') || '';
    const tag = url.searchParams.get('tag') || '';

    const startParam = url.searchParams.get('start') || '';
    const endParam = url.searchParams.get('end') || '';
    if(!startParam || !endParam) {
        throw new Error('Missing start or end date');
    }
    const start = new Date(startParam);
    let end = new Date(endParam);
    start.setHours(0, 0, 0, 0);
    end.setHours(23, 59, 59, 999);

    let isLocked = false; // Lock mechanism

    // Create a Readable stream
    const readableStream = new Readable({
        async read() {
            if (isLocked) {
                return; // Prevent concurrent execution
            }

            isLocked = true; // Acquire the lock

            try {
                let generateHeader = true;
                let hasMore = true;
                let offset = 0;

                while (hasMore) {
                    // Fetch a single page of messages
                    const { messages, hasMore: moreData, newEnd } = await searchMessages(token, stream, tag, start, end, offset);

                    // Convert messages to CSV and push to the stream
                    const csvData = convertToCSV(messages, generateHeader);
                    generateHeader = false;
                    offset = 1;
                    this.push(csvData);

                    // Update control variables
                    hasMore = moreData;
                    end = newEnd;

                    // Prevent rapid looping
                    await new Promise(resolve => setTimeout(resolve, 1000));
                }

                // Signal that the stream has ended
                this.push(null);
            } catch (error) {
                // Handle any error and terminate the stream
                console.error('Error while streaming data:', error);
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
            'Transfer-Encoding': 'chunked',
        },
    });
}


