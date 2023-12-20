import { Button } from "@/components/ui/button";
import { Playlist } from "@/lib/client/types/playlist";
import { Wallpaper } from "@/lib/client/types/wallpaper";
import { useCallback, useEffect, useState } from "react";
import { Screen } from "@/lib/client/types/screen";
import { cn } from "@/lib/utils";
import {
    Sheet,
    SheetContent,
    SheetDescription,
    SheetHeader,
    SheetTitle,
    SheetTrigger,
} from "@/components/ui/sheet"
import {
    Popover,
    PopoverContent,
    PopoverTrigger,
} from "@/components/ui/popover"
import { Slider } from "@/components/ui/slider"
import api from "@/lib/client/api";

interface ToolBarProps extends React.HTMLAttributes<HTMLElement> {
    playingPlaylist: Playlist[] | null | undefined
    screens: Screen[] | null | undefined
}

type WallpaperWrapper = {
    wallpaper: Wallpaper;
    screen: Screen;
}

export function ToolBar({ playingPlaylist, screens }: ToolBarProps) {
    const [selectedWallpaper, setSelectedWallpaper] = useState<WallpaperWrapper | null>(null);

    const handlePlayClick = useCallback(() => {
        var index = screens?.findIndex(x => x.deviceName === selectedWallpaper?.screen.deviceName);
        api.resumeWallpaper(index);
    }, [screens, selectedWallpaper?.screen.deviceName]);

    const handlePauseClick = useCallback(() => {
        var index = screens?.findIndex(x => x.deviceName === selectedWallpaper?.screen.deviceName);
        api.pauseWallpaper(index);
    }, [screens, selectedWallpaper?.screen.deviceName]);

    useEffect(() => {
        //判断selectedWallpaper是否已经被playingPlaylist移除
        var exist = playingPlaylist?.some(x => x.wallpapers.some(y => y.fileUrl === selectedWallpaper?.wallpaper.fileUrl));
        if (!exist)
            setSelectedWallpaper(null); // 当playingPlaylist变化时重置selectedWallpaper
    }, [playingPlaylist, selectedWallpaper?.wallpaper.fileUrl]);

    if (!playingPlaylist || !screens)
        return;

    let wallpapers: WallpaperWrapper[] = [];
    //遍历playingPlaylist，根据playIndex找到当前播放的wallpaper
    playingPlaylist?.forEach(item => {
        if (item.setting?.playIndex !== undefined) {
            var currentWallpaper = item.wallpapers[item.setting?.playIndex];
            var exist = wallpapers.some(x => x.wallpaper.fileUrl === currentWallpaper.fileUrl);
            if (!exist)
                wallpapers.push({
                    wallpaper: currentWallpaper,
                    screen: screens[item.setting.screenIndexes[0]]
                });
        }
    });

    return <div className="fixed inset-x-0 ml-18 bottom-0 bg-background h-20 border-t border-primary-300 dark:border-primary-600 flex items-center px-4 space-x-4">
        <div className="flex flex-wrap flex-initial w-1/4 overflow-hidden h-full">
            {[...wallpapers].map((item, index) => {
                const isSelected = selectedWallpaper === item.wallpaper;
                return <div key={index} className="flex items-center space-x-4 p-1">
                    <picture onClick={() => isSelected ? setSelectedWallpaper(null) : setSelectedWallpaper(item)} className={cn({ "cursor-pointer": wallpapers.length > 1 })}>
                        <img
                            alt="Cover"
                            title={item.wallpaper.meta?.title}
                            className={cn(["rounded-lg object-scale-cover aspect-square", wallpapers.length > 1 && isSelected ? " border-2 border-primary" : ""])}
                            height={50}
                            src={item.wallpaper.coverUrl || "/wp-placeholder.webp"}
                            width={50}
                        />
                    </picture>
                    {
                        (wallpapers.length === 1) && <div className="flex flex-col text-sm truncate">
                            <div className="font-semibold">{item?.wallpaper.meta?.title}</div>
                            <div >{item?.wallpaper.meta?.description}</div>
                        </div>
                    }
                </div>
            })}
        </div>

        <div className="flex flex-col flex-1 w-1/2 items-center justify-between">
            <div className="space-x-4">
                <Button variant="ghost" className="hover:text-primary" title="上一个壁纸">
                    <svg
                        className="h-5 w-5 "
                        fill="none"
                        height="24"
                        stroke="currentColor"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth="2"
                        viewBox="0 0 24 24"
                        width="24"
                        xmlns="http://www.w3.org/2000/svg"
                    >
                        <polygon points="11 19 2 12 11 5 11 19" />
                        <polygon points="22 19 13 12 22 5 22 19" />
                    </svg>
                </Button>
                <Button variant="ghost" className="hover:text-primary" title="播放" onClick={handlePlayClick}>
                    <svg
                        className="h-5 w-5 "
                        fill="none"
                        height="24"
                        stroke="currentColor"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth="2"
                        viewBox="0 0 24 24"
                        width="24"
                        xmlns="http://www.w3.org/2000/svg"
                    >
                        <polygon points="5 3 19 12 5 21 5 3" />
                    </svg>
                </Button>
                <Button variant="ghost" className="hover:text-primary" title="暂停" onClick={handlePauseClick}>
                    <svg
                        className="h-5 w-5 "
                        fill="none"
                        height="24"
                        stroke="currentColor"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth="2"
                        viewBox="0 0 24 24"
                        width="24"
                        xmlns="http://www.w3.org/2000/svg"
                    >
                        <rect height="20" rx="2" ry="2" width="6" x="4" y="2" />
                        <rect height="20" rx="2" ry="2" width="6" x="14" y="2" />
                    </svg>
                </Button>
                <Button variant="ghost" className="hover:text-primary" title="下一个壁纸">
                    <svg
                        className=" h-5 w-5 "
                        fill="none"
                        height="24"
                        stroke="currentColor"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth="2"
                        viewBox="0 0 24 24"
                        width="24"
                        xmlns="http://www.w3.org/2000/svg"
                    >
                        <polygon points="13 19 22 12 13 5 13 19" />
                        <polygon points="2 19 11 12 2 5 2 19" />
                    </svg>
                </Button>
            </div>
            {(selectedWallpaper || wallpapers.length === 1) && <div className="flex items-center justify-between text-xs w-full">
                <div className="text-primary-600 dark:text-primary-400">00:00</div>
                <div className="w-full h-1 mx-4 bg-primary/60 rounded" />
                <div className="text-primary-600 dark:text-primary-400">04:30</div>
            </div>}
        </div>

        <div className="flex flex-initial w-1/4 items-center justify-end">
            {(selectedWallpaper || wallpapers.length === 1) && <>
                <Popover>
                    <PopoverTrigger>
                        <Button variant="ghost" className="hover:text-primary px-3" title="音量">
                            <svg
                                className=" h-6 w-6 "
                                fill="none"
                                height="24"
                                stroke="currentColor"
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth="2"
                                viewBox="0 0 24 24"
                                width="24"
                                xmlns="http://www.w3.org/2000/svg"
                            >
                                <polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5" />
                            </svg>
                        </Button>
                    </PopoverTrigger>
                    <PopoverContent>
                        <Slider defaultValue={[33]} max={100} step={1} />
                    </PopoverContent>
                </Popover>
                <Sheet>
                    <SheetTrigger>
                        <Button variant="ghost" className="hover:text-primary px-3" title="播放列表">
                            <svg
                                className=" h-6 w-6"
                                fill="none"
                                height="24"
                                stroke="currentColor"
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth="2"
                                viewBox="0 0 24 24"
                                width="24"
                                xmlns="http://www.w3.org/2000/svg"
                            >
                                <line x1="8" x2="21" y1="6" y2="6" />
                                <line x1="8" x2="21" y1="12" y2="12" />
                                <line x1="8" x2="21" y1="18" y2="18" />
                                <line x1="3" x2="3.01" y1="6" y2="6" />
                                <line x1="3" x2="3.01" y1="12" y2="12" />
                                <line x1="3" x2="3.01" y1="18" y2="18" />
                            </svg>
                        </Button>
                    </SheetTrigger>
                    <SheetContent>
                        <SheetHeader>
                            <SheetTitle>播放列表</SheetTitle>
                            <SheetDescription>
                                This action cannot be undone. This will permanently delete your account
                                and remove your data from our servers.
                            </SheetDescription>
                        </SheetHeader>
                    </SheetContent>
                </Sheet>
            </>}
        </div>
    </div >
}
