import { NextResponse } from 'next/server';
import { convertToCSV, searchMessages } from '../../../lib/postmark';

export async function GET(request: Request): Promise<NextResponse> {
    const token = request.headers.get('X-Postmark-Server-Token') || '';
    const url = new URL(request.url);
    const stream = url.searchParams.get('stream') || '';
    const tag = url.searchParams.get('tag') || '';

    const messages = await searchMessages(token, stream, tag);

    // Convert messages to a CSV string
    const csvData = convertToCSV(messages);

    // Create and return a Response with CSV data
    return new NextResponse(csvData, {
        headers: {
            'Content-Type': 'text/csv',
            'Content-Disposition': `attachment; filename="messages-${Date.now()}.csv"`,
        },
    });
}
