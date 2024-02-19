"use client"

import * as React from "react"
import { ThemeProvider as NextThemesProvider } from "next-themes"
import { ThemeProviderProps } from "next-themes/dist/types"
import { TooltipProvider } from "@radix-ui/react-tooltip"
import { defaultConfig, useConfig } from '@/hooks/use-config';
import { useCallback, useEffect } from "react"
import api from "@/lib/client/api";
import { ConfigAppearance } from "@/lib/client/types/config"
import { Toaster } from "sonner"

export function ThemeProvider({ children, ...props }: ThemeProviderProps) {
    const [_, setConfig] = useConfig()
    //读取主题设置
    const fetchConfig = useCallback(async () => {
        const { data } = await api.getConfig<ConfigAppearance>("Appearance");
        setConfig(data || defaultConfig);
        return data;
    }, [setConfig]);

    useEffect(() => {
        fetchConfig();

        api.onRefreshPage(() => {
            console.log("refresh page");
            window.location.reload();
        });
    }, [fetchConfig]);

    return (
        <>
            <NextThemesProvider {...props}>
                <TooltipProvider>{children}</TooltipProvider>
            </NextThemesProvider>
            <Toaster closeButton={true} position="top-center" />
        </>
    )
}
