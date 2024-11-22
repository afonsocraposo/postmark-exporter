"use client";

import { ActionIcon, Alert, Box, Button, Center, Container, Group, Loader, Progress, Radio, RadioGroup, Stack, Text, TextInput } from "@mantine/core";
import { DatePickerInput, DatesRangeValue } from '@mantine/dates';

import { useForm } from "@mantine/form";
import { useState } from "react";
import { areDaysEqual, humanReadableTimeDiff } from "../../lib/time";
import { getBouncesTotalCount, getMessagesTotalCount } from "../../lib/postmark";
import { IconAlertTriangle, IconRefresh } from '@tabler/icons-react';


export default function Form() {
    const today = new Date();
    const yesterday = new Date(today.getTime() - 1 * 24 * 60 * 60 * 1000);
    const [dateRange, setDateRange] = useState<[Date, Date]>([yesterday, today]);
    const [loading, setLoading] = useState(false);  // Track loading state
    const [totalCount, setTotalCount] = useState<number | null>(null);
    const [currentCount, setCurrentCount] = useState<number | null>(null);
    const [alertText, setAlertText] = useState<string | null>(null);


    const form = useForm({
        initialValues: {
            serverToken: '',
            tag: '',
            stream: '',
            type: 'messages',
        },
        onValuesChange: (values) => {
            setTotalCount(null);
            setAlertText(null);
        },
        validate: {
            serverToken: (value: string) => (/^[0-9a-fA-F]{8}\b-[0-9a-fA-F]{4}\b-[0-9a-fA-F]{4}\b-[0-9a-fA-F]{4}\b-[0-9a-fA-F]{12}$/.test(value) ? null : 'Invalid server token'),
        },
    });
    const onSubmit = (values: { serverToken: string, tag: string, stream: string, type: string }) => {
        if (!dateRange[0] || !dateRange[1]) {
            return
        }
        setAlertText(null);
        return totalCount ? downloadAll(values) : search(values);
    }
    const search = async (values: { serverToken: string, tag: string, stream: string, type: string }) => {
        setLoading(true);  // Set loading to true before starting the fetch

        const start = dateRange[0];
        const end = dateRange[1];
        start.setHours(0, 0, 0, 0);
        end.setHours(23, 59, 59, 999);

        const { serverToken, tag, stream, type } = values;

        try {
            let totalCount: number;
            if (type === 'messages') {
                totalCount = await getMessagesTotalCount(serverToken, stream, tag, start, end);
            } else {
                totalCount = await getBouncesTotalCount(serverToken, stream, tag, start, end);
            }
            setTotalCount(totalCount);
        } catch (error) {
            setAlertText(`${error}`);
        } finally {
            setLoading(false);  // Set loading to false after fetch completes
        }
    }
    const downloadAll = async (values: { serverToken: string, tag: string, stream: string, type: string }) => {
        const { type } = values;

        setLoading(true); // Set loading to true before starting the fetch
        setCurrentCount(0);

        const isoString = new Date().toISOString().slice(0, 19).replace(/:/g, '-'); // e.g., "2024-11-22T10-30-00"
        const filename = `postmark-export-${type}-${isoString}.csv`;

        const startDate = dateRange[0];
        const endDate = dateRange[1];

        startDate.setHours(0, 0, 0, 0);
        endDate.setHours(23, 59, 59, 999);

        const start = startDate.toISOString()?.slice(0, 19) || '';
        let end = endDate.toISOString()?.slice(0, 19) || '';

        try {
            let csvContent = '';
            let header = true;
            let currentCount = 0;
            while (true) {
                const { csvContent: csvContentBatch, hasMore, currentCount: newCurrentCount } = await download(values, start, end, header, currentCount);
                currentCount = newCurrentCount;
                csvContent += csvContentBatch;

                if (!hasMore) {
                    break;
                }

                const lastEntry = csvContentBatch.split('\n').slice(-2)[0];
                // match date of format "2024-11-22T18:28:29Z"
                const lastDateMatch = lastEntry?.match(/\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}/)?.[0];
                if (!lastDateMatch) {
                    break;
                }
                // subtract 1 millisecond to avoid fetching the same entry again
                const newEnd = new Date(Date.parse(lastDateMatch) - 1);
                end = newEnd.toISOString().slice(0, 19);
                header = false;
            }


            downloadCsvContent(csvContent, filename);

            setCurrentCount(null)
        } catch (error) {
            setAlertText(`${error}`);
        } finally {
            setLoading(false); // Set loading to false after fetch completes
        }
    }
    const download = async (values: { serverToken: string; tag: string; stream: string; type: string }, start: string, end: string, header: boolean, currentCount: number) => {

        const prevCounter = currentCount;
        const { serverToken, tag, stream, type } = values;

        const queryParams = new URLSearchParams();
        queryParams.set('start', start);
        queryParams.set('end', end);
        queryParams.set('tag', tag);
        queryParams.set('stream', stream);
        queryParams.set('header', header ? 'true' : 'false');
        const url = `/api/download-${type}?${queryParams.toString()}`;

        // Use fetch to trigger the API route
        const response = await fetch(url, {
            headers: {
                'X-Postmark-Server-Token': serverToken,
            },
        });

        if (response.ok) {

            const reader = response.body?.getReader();
            const decoder = new TextDecoder();
            let csvContent = '';
            if (reader) {
                // Read the stream incrementally
                while (true) {
                    const { done, value } = await reader.read();
                    if (done) break;
                    const content = decoder.decode(value, { stream: true });
                    csvContent += content;
                    // count number of \n on content
                    const newLines = content.match(/\n/g)?.length ?? 0;
                    currentCount += newLines;
                    setCurrentCount(currentCount);
                }

            } else {
                throw new Error('Stream error: Unable to process the response body.');
            }

            const totalCount = parseInt(response.headers.get('Content-Length') ?? '0');
            if (prevCounter == 0) {
                setCurrentCount(totalCount);
            }
            return { csvContent, hasMore: (currentCount - prevCounter) < totalCount, currentCount };
        } else {
            throw new Error(`Failed to fetch: ${response.statusText}`);
        }
    };
    const downloadCsvContent = async (csvContent: string, filename: string) => {
        // Trigger the download once the full CSV is collected
        const blob = new Blob([csvContent], { type: 'text/csv' });
        const downloadUrl = window.URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = downloadUrl;
        link.download = filename;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    }


    return (
        <>
            <form onSubmit={form.onSubmit(onSubmit)}>
                <Stack gap='md'w={380} >
                    <TextInput
                        required
                        label="Server token"
                        placeholder="938107e4-3ccf-4a1c-b8b7-5c184eaa6a3e"
                        key={form.key('serverToken')}
                        {...form.getInputProps('serverToken')}
                    />

                    <TextInput
                        label="Message Stream ID"
                        placeholder="stream-id"
                        key={form.key('stream')}
                        {...form.getInputProps('stream')}
                    />

                    <TextInput
                        label="Tag"
                        placeholder="tag"
                        key={form.key('tag')}
                        {...form.getInputProps('tag')}
                    />

                    <Stack>
                        <DatePickerInput
                            type="range"
                            label="Pick dates range"
                            placeholder="Pick dates range"
                            value={dateRange}
                            maxDate={today}
                            required
                            allowSingleDateInRange
                            onChange={(dateRange: DatesRangeValue) => {
                                setTotalCount(null);
                                const start = dateRange[0] as Date;
                                const end = dateRange[1] as Date;
                                setDateRange([start, end]);
                            }}
                        />
                        {dateRange[0] && dateRange[1] && areDaysEqual(today, dateRange[1]) &&
                            <Text size="sm" c='dimmed'>
                                {
                                    humanReadableTimeDiff(dateRange[0], dateRange[1])
                                }
                            </Text>
                        }
                    </Stack>


                    <RadioGroup
                        label="Select what to export"
                        {...form.getInputProps('type')}
                        required
                    >
                        <Group gap='xl' mt='xs'>
                            <Radio value="messages" label="Messages sent" />
                            <Radio value="bounces" label="Bounces" />
                        </Group>
                    </RadioGroup>

                    <Group justify="flex-end" mt="md" align="start">
                        <Container w={200}>
                            <Stack>
                                <Text size='sm'>
                                    {totalCount ? `Total: ${totalCount} ${form.values.type}` : ''}
                                </Text>
                                {loading && totalCount && currentCount !== null && (
                                    <Progress size="xl" value={Math.min(100, 100 * currentCount / totalCount)} animated striped />
                                )}
                            </Stack>
                        </Container>
                        <Button type="submit" disabled={loading}>{
                            totalCount ? 'Download' : 'Search'
                        }</Button>
                        <Box w='md'>
                            {totalCount && !loading && (
                                <ActionIcon variant="subtle" onClick={() => search(form.values)}>
                                    <IconRefresh style={{ width: '70%', height: '70%' }} stroke={1.5} />
                                </ActionIcon>
                            )}
                            {loading && (
                                <Loader size='sm' />
                            )}
                        </Box>
                    </Group>
                    {alertText &&
                        <Alert variant="light" color="red" title="Something went wrong..." icon={<IconAlertTriangle />}>
                            {alertText}
                        </Alert>
                    }
                </Stack>
            </form>
        </>
    );
}
