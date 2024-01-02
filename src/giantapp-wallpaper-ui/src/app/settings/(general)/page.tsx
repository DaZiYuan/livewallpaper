
"use client";

import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import api from "@/lib/client/api";
import React from "react";
import { Skeleton } from "@/components/ui/skeleton";
import { ConfigGeneral } from "@/lib/client/types/config";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem } from "@/components/ui/command";
import { CaretSortIcon, CheckIcon } from "@radix-ui/react-icons";
import { toast } from "sonner";

const Page = () => {
    const languages = [
        { label: "简体中文", value: "zh" },
        { label: "English", value: "en" },
    ] as const
    const [mounted, setMounted] = React.useState(false)
    const [config, setConfig] = React.useState<ConfigGeneral>({} as any)
    const [open, setOpen] = React.useState(false)

    //读取配置
    const fetchConfig = async () => {
        const config = await api.getConfig<ConfigGeneral>("General")
        if (config.error || !config.data) {
            toast.error("读取配置失败")
            return
        }

        console.log(config);
        setConfig(config.data)
    }

    // 保存配置
    const saveConfig = async (config: ConfigGeneral) => {
        setConfig(config);
        await api.setConfig("General", config);
    };

    React.useEffect(() => {
        if (!mounted) {
            setMounted(true);
            fetchConfig();
        }
    }, [mounted]);

    return <div className="h-screen space-y-6">
        {
            mounted ?
                <>
                    <div className="space-y-2">
                        <h1 className="text-2xl font-semibold">常规设置</h1>
                    </div>
                    <div className="flex items-center space-x-2">
                        <Label htmlFor="startup">开机启动</Label>
                        <Switch id="startup" checked={config.autoStart}
                            onCheckedChange={async (e) => {
                                saveConfig({ ...config, autoStart: e });
                            }}
                        />
                    </div>
                    <div className="flex items-center space-x-2">
                        <Label htmlFor="minimize-after-start">启动后最小化</Label>
                        <Switch id="minimize-after-start"
                            checked={config.hideWindow}
                            onCheckedChange={async (e) => {
                                saveConfig({ ...config, hideWindow: e });
                            }}
                        />
                    </div>
                    <div className="flex items-center space-x-2">
                        <Label htmlFor="minimize-after-start">多语言</Label>
                        <Popover open={open} onOpenChange={setOpen}>
                            <PopoverTrigger asChild>
                                <Button
                                    variant="outline"
                                    role="combobox"
                                    className={cn(
                                        "w-[200px] justify-between",
                                    )}
                                >
                                    {config.currentLan
                                        ? languages.find(
                                            (language) => language.value === config.currentLan
                                        )?.label
                                        : "Select language"}
                                    <CaretSortIcon className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                                </Button>
                            </PopoverTrigger>
                            <PopoverContent className="w-[200px] p-0">
                                <Command>
                                    <CommandInput placeholder="搜索..." className="h-9" />
                                    <CommandEmpty>未找到</CommandEmpty>
                                    <CommandGroup>
                                        {languages.map((language) => (
                                            <CommandItem
                                                value={language.label}
                                                key={language.value}
                                                onSelect={() => {
                                                    saveConfig({
                                                        ...config,
                                                        currentLan: language.value
                                                    })
                                                    setOpen(false)
                                                }}
                                            >
                                                {language.label}
                                                <CheckIcon
                                                    className={cn(
                                                        "ml-auto h-4 w-4",
                                                        language.value === config.currentLan
                                                            ? "opacity-100"
                                                            : "opacity-0"
                                                    )}
                                                />
                                            </CommandItem>
                                        ))}
                                    </CommandGroup>
                                </Command>
                            </PopoverContent>
                        </Popover>
                    </div>
                </>
                :
                <>
                    <Skeleton className="h-8 w-32" />
                    <Skeleton className="h-8 w-32" />
                </>
        }
    </div>
};

export default Page;
