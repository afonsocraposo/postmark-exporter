import { Center, Stack, Title } from "@mantine/core";
import Form from "./[form]/form";

export default function HomePage() {
    return <Center>
        <Stack>
            <Title>
                Postmark Exporter
            </Title>
            <Form />
        </Stack>
    </Center>;
}
