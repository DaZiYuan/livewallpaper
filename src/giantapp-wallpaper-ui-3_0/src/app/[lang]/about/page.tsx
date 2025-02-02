"use client";

import api from "@/lib/client/api";
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button"
import LinkClient from "@/components/link-client"
import {
    LayoutGrid,
    MessageCircleWarning,
    Github,
    DollarSign
} from "lucide-react";
import Link from "next/link";
import { langDictAtom } from "@/atoms/lang";
import { useAtomValue } from "jotai";

const Author = ({ dictionary }: { dictionary: any; }) => {
    const parts = dictionary['about'].produced_by.split("{0}");

    return (
        <p>
            {parts[0]}
            <LinkClient className="underline-offset-4 hover:underline" href="https://www.mscoder.cn" target="_blank"><span className="font-bold underline">{dictionary['about'].author}</span></LinkClient>
            {parts[1]}
        </p>
    );
}

const AboutPage = () => {
    const [version, setVersion] = useState<string | null>();
    const dictionary = useAtomValue(langDictAtom);

    //获取version
    useEffect(() => {
        if (version) return;
        api.getVersion().then((version) => {
            setVersion(version.data);
        });
    }, [version]);

    return <div className="h-screen flex flex-col items-start space-y-6 m-6">
        <h1 className="text-2xl">{dictionary['about'].product_name.replace("{0}", version)} </h1>
        <div className="flex flex-col space-y-2">
            <h1 className="text-2xl font-semibold mt-4">
                {dictionary['about'].feedback_and_source_code}
                <Button variant="ghost" asChild>
                    <Link
                        onClick={(e) => {
                            api.openLogFolder();
                            e.preventDefault();
                        }}
                        className="ml-4 underline-offset-4 flex items-center" href="#" title={dictionary['about'].open_log_folder} target="_blank">
                        
                        <MessageCircleWarning className="h-4 w-4" />
                    </Link>
                </Button>
            </h1>
            {dictionary['about'].reminder}
            <LinkClient
                className="underline-offset-4 hover:underline" href="https://support.qq.com/products/315103" target="_blank">
                {dictionary['about'].problems_and_suggestions}
            </LinkClient>
            <LinkClient
                className="underline-offset-4 hover:underline" href="https://github.com/GiantappMan/livewallpaper" target="_blank">
                Github
            </LinkClient>
            <LinkClient
                className="underline-offset-4 hover:underline" href="https://gitee.com/GiantappMan/livewallpaper" target="_blank">
                Gitee
            </LinkClient>
        </div>
        <div className="flex flex-col space-y-2">
            <h1 className="text-2xl font-semibold mt-4">{dictionary['about'].encourage}</h1>
            <Button variant="outline" asChild>
                <Link
                    onClick={(e) => {
                        api.openStoreReview(process.env.NEXT_PUBLIC_MS_Address!);
                        e.preventDefault();
                    }}
                    className="underline-offset-4 flex items-center" href="#" target="_blank">
                    <LayoutGrid className="h-4 w-4 mr-1" />
                    {dictionary['about'].rate_us}
                </Link>
            </Button>
            <Button variant="outline" asChild>
                <LinkClient
                    className="underline-offset-4 flex items-center" href="https://github.com/GiantappMan/livewallpaper" target="_blank">
                    <Github className="h-4 w-4 mr-1" />
                    {dictionary['about'].give_star}
                </LinkClient>
            </Button>
            <Button variant="outline" asChild>
                <LinkClient
                    className="underline-offset-4 flex items-center" href="https://afdian.net/a/giantapp" target="_blank">
                    <DollarSign className="h-4 w-4 mr-1" />
                    {dictionary['about'].donate_membership}
                </LinkClient>
            </Button>
        </div>
        <div className="flex items-center space-x-2 text-lg">
            <Author dictionary={dictionary} />
        </div>
    </div>
}
export default AboutPage;
