"use client"

import { Locale } from "@/i18n-config";
import { SidebarNav } from "./_components/sidebar-nav"

interface SettingsLayoutProps {
    children: React.ReactNode;
    params: { lang: Locale };
}

export default function SettingsLayout(
    {
        children,
        params,
    }: SettingsLayoutProps) {
    return (
        <>
            <div className="grid h-screen min-h-screen w-full overflow-hidden grid-cols-[280px_1fr]">
                <div className="border-r">
                    <SidebarNav lang={params.lang} />
                </div>
                <div className="flex flex-col overflow-auto">
                    <main className="flex flex-1 flex-col gap-4 p-4 md:gap-8 md:p-6">
                        <div className="flex flex-1 flex-col space-y-4 md:space-y-6">
                            {children}
                        </div>
                    </main>
                </div>
            </div>
        </>
    )
}