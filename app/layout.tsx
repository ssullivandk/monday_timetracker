"use client";

import "@vibe/core/tokens";
import "@/public/css/mondayThemeMapping.css";
import "@/public/css/fonts.css";
import "./globals.scss";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";

const queryClient = new QueryClient();

export default function RootLayout({ children }: { children: React.ReactNode }) {
	return (
		<html>
			<body>
				<QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
			</body>
		</html>
	);
}
