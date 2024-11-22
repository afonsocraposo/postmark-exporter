import "@mantine/core/styles.css";
import React from "react";
import { MantineProvider, ColorSchemeScript, ActionIcon, Container, Affix } from "@mantine/core";
import { theme } from "../theme";
import '@mantine/dates/styles.css';
import { IconBrandGithub } from "@tabler/icons-react";
import Link from "next/link";

export const metadata = {
    title: "Postmark Exporter",
    description: "Simple tool to export Postmark events to CSV",
};

export default function RootLayout({ children }: { children: any }) {
    return (
        <html lang="en" suppressHydrationWarning>
            <head>
                <ColorSchemeScript />
                <link rel="shortcut icon" href="data:image/svg+xml,<svg xmlns=%22http://www.w3.org/2000/svg%22 viewBox=%220 0 100 100%22><text y=%22.9em%22 font-size=%2290%22>💾</text></svg>" />
                <meta
                    name="viewport"
                    content="minimum-scale=1, initial-scale=1, width=device-width, user-scalable=no"
                />
            </head>
            <body>
                <MantineProvider theme={theme}>{children}
                    <Affix position={{ bottom: 20, right: 20 }}>
                        <Link href="https://github.com/afonsocraposo/postmark-exporter" target="_blank">
                            <ActionIcon variant="filled" radius="xl" color='black' size='lg' >
                                <IconBrandGithub style={{ width: '70%', height: '70%' }} stroke={1.5} />
                            </ActionIcon>
                        </Link>
                    </Affix>
                </MantineProvider>
            </body>
        </html>
    );
}
