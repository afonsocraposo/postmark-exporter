"use client";

import { Button, Group, Radio, RadioGroup, Stack, Text, TextInput } from "@mantine/core";
import { DatePickerInput } from '@mantine/dates';

import { useForm } from "@mantine/form";
import { useState } from "react";
import { humanReadableTimeDiff } from "../../lib/time";

export default function Form() {
    const today = new Date();
    const weekAgo = new Date(today.getTime() - 7 * 24 * 60 * 60 * 1000);
    const [dateRange, setDateRange] = useState<[Date | null, Date | null]>([weekAgo, today]);

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
        validate: {
            serverToken: (value: string) => (/^[0-9a-fA-F]{8}\b-[0-9a-fA-F]{4}\b-[0-9a-fA-F]{4}\b-[0-9a-fA-F]{4}\b-[0-9a-fA-F]{12}$/.test(value) ? null : 'Invalid server token'),
        },
    });
    const onSubmit = async (values: { serverToken: string, tag: string, stream: string, type: string }) => {
        const { serverToken, tag, stream, type } = values;

        const queryParams = new URLSearchParams();
        queryParams.set('start', dateRange[0]?.toISOString() || '');
        queryParams.set('end', dateRange[1]?.toISOString() || '');
        queryParams.set('tag', tag);
        queryParams.set('stream', stream);
        const url = `/api/download-${type}?${queryParams.toString()}`;

        // Use fetch to trigger the API route
        const response = await fetch(url, {
            headers: {
                'X-Postmark-Server-Token': serverToken,
            },
        });

        if (response.ok) {
            const isoString = new Date().toISOString().slice(0, 19).replace(/:/g, '-'); // e.g., "2024-11-22T10-30-00"
            // const filename = `messages-${isoString}.csv`;
            const filename = "output.csv";
            const blob = await response.blob();
            const downloadUrl = window.URL.createObjectURL(blob);
            const link = document.createElement('a');
            link.href = downloadUrl;
            link.download = filename;
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
        } else {
            console.error('Failed to download messages:', await response.json());
            alert('Failed to download messages.');
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
                            onChange={setDateRange}
                        />
                        {dateRange[0] && dateRange[1] && isToday(dateRange[1]) &&
                            <Text>
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
                            <Radio value="messages" label="Messages" />
                            <Radio value="bounces" label="Bounces" />
                        </Group>
                    </RadioGroup>

                    <Group justify="flex-end" mt="md">
                        <Button type="submit">Download</Button>
                    </Group>
                </Stack>
            </form>
        </>
    );
}
