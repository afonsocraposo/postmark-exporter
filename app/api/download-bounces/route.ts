import { NextResponse } from 'next/server';
import { searchBounces } from '../../../lib/postmark';
import { convertToCSV } from '../../../lib/csv';

export async function GET(request: Request): Promise<NextResponse> {
    const token = request.headers.get('X-Postmark-Server-Token') || '';
    const url = new URL(request.url);
    const stream = url.searchParams.get('stream') || '';
    const tag = url.searchParams.get('tag') || '';

    const start = new Date(url.searchParams.get('start') || '');
    const end = new Date(url.searchParams.get('end') || '');
    start.setHours(0, 0, 0, 0);
    end.setHours(23, 59, 59, 999);

    const messages = await searchBounces(token, stream, tag, start, end);

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
