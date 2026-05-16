import type { Metadata } from "next";
import { Inter, JetBrains_Mono } from "next/font/google";
import "./globals.css";
import { Nav } from "@/components/Nav";

const sans = Inter({ subsets: ["latin"], variable: "--font-sans" });
const mono = JetBrains_Mono({ subsets: ["latin"], variable: "--font-mono" });

export const metadata: Metadata = {
    title: "Tagent · AI SRE Platform",
    description: "Kubernetes incident intelligence. Runs on your hardware.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
    return (
        <html lang="en" className={`${sans.variable} ${mono.variable}`}>
            <body className="font-sans">
                <div className="flex h-screen overflow-hidden">
                    <Nav />
                    <main className="flex-1 flex flex-col overflow-hidden">
                        {children}
                    </main>
                </div>
            </body>
        </html>
    );
}
