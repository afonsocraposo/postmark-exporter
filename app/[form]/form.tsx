"use client";

import { ActionIcon, Box, Button, Center, Container, Group, Loader, Radio, RadioGroup, Stack, Text, TextInput } from "@mantine/core";
import { DatePickerInput, DatesRangeValue } from '@mantine/dates';

import { useForm } from "@mantine/form";
import { useState } from "react";
import { humanReadableTimeDiff } from "../../lib/time";
import { getBouncesTotalCount, getMessagesTotalCount } from "../../lib/postmark";
import { IconRefresh } from '@tabler/icons-react';


export default function Form() {
    const today = new Date();
    const yesterday = new Date(today.getTime() - 1 * 24 * 60 * 60 * 1000);
    const [dateRange, setDateRange] = useState<[Date, Date]>([yesterday, today]);
    const [loading, setLoading] = useState(false);  // Track loading state
    const [totalCount, setTotalCount] = useState<number | null>(null);


    const isToday = (date: Date) => {
        return date.getFullYear() == today.getFullYear() && date.getMonth() == today.getMonth() && date.getDate() == today.getDate();
    }
    const form = useForm({
        initialValues: {
            serverToken: '',
            tag: '',
            stream: '',
            type: 'messages',
        },
        onValuesChange: (values) => {
            setTotalCount(null);
        },
        validate: {
            serverToken: (value: string) => (/^[0-9a-fA-F]{8}\b-[0-9a-fA-F]{4}\b-[0-9a-fA-F]{4}\b-[0-9a-fA-F]{4}\b-[0-9a-fA-F]{12}$/.test(value) ? null : 'Invalid server token'),
        },
    });
    const onSubmit = (values: { serverToken: string, tag: string, stream: string, type: string }) => {
        return totalCount ? download(values) : search(values);
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
            alert("An error occurred while fetching.");
        } finally {
            setLoading(false);  // Set loading to false after fetch completes
        }
    }
    const download = async (values: { serverToken: string, tag: string, stream: string, type: string }) => {
        setLoading(true);  // Set loading to true before starting the fetch

        const { serverToken, tag, stream, type } = values;

        const start = dateRange[0]?.toISOString()?.slice(0, 10) || '';
        const end = dateRange[1]?.toISOString()?.slice(0, 10) || '';

        const queryParams = new URLSearchParams();
        queryParams.set('start', start);
        queryParams.set('end', end);
        queryParams.set('tag', tag);
        queryParams.set('stream', stream);
        const url = `/api/download-${type}?${queryParams.toString()}`;

        try {
            // Use fetch to trigger the API route
            const response = await fetch(url, {
                headers: {
                    'X-Postmark-Server-Token': serverToken,
                },
            });

            if (response.ok) {
                const isoString = new Date().toISOString().slice(0, 19).replace(/:/g, '-'); // e.g., "2024-11-22T10-30-00"
                const filename = `${type}-${isoString}.csv`;
                const blob = await response.blob();
                const downloadUrl = window.URL.createObjectURL(blob);
                const link = document.createElement('a');
                link.href = downloadUrl;
                link.download = filename;
                document.body.appendChild(link);
                link.click();
                document.body.removeChild(link);
            } else {
                alert('Failed to download messages.');
            }
        } catch (error) {
            console.error("Fetch error:", error);
            alert("An error occurred while fetching.");
        } finally {
            setLoading(false);  // Set loading to false after fetch completes
        }
    };

    return (
        <>
            <form onSubmit={form.onSubmit(onSubmit)}>
                <Stack gap='md'>
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
                            onChange={(dateRange: DatesRangeValue) => {
                                setTotalCount(null);
                                setDateRange(dateRange);
                            }}
                        />
                        {dateRange[0] && dateRange[1] && isToday(dateRange[1]) &&
                            <Text size="sm" c='dimmed'>
                                {
                                    "Last " + humanReadableTimeDiff(dateRange[0], dateRange[1])
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

                    <Group justify="flex-end" mt="md" align="start" w={380}>
                        <Container w={200}>
                            <Stack>
                                <Text size='sm'>
                                    {totalCount ? `Total: ${totalCount} ${form.values.type}` : ''}
                                </Text>
                                {totalCount && totalCount > 10000 && (
                                    <Text size='xs' c='red'>
                                        Due to Postmark API limitations, only the first 10,000 records will be exported.
                                    </Text>
                                )}
                            </Stack>
                        </Container>
                        <Button type="submit" disabled={loading}>{
                            totalCount ? 'Download' : 'Search'
                        }</Button>
                        <Box w='md'>
                        {totalCount && !loading && (
                            <ActionIcon variant="subtle" onClick={()=>search(form.values)}>
                                <IconRefresh style={{ width: '70%', height: '70%' }} stroke={1.5} />
                            </ActionIcon>
                        )}
                        {loading && (
                            <Loader size='sm'/>
                        )}
                        </Box>
                    </Group>

                </Stack>
            </form>
        </>
    );
}
