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
    playingPlaylist: Playlist[]
    screens: Screen[]
}

type PlaylistWrapper = {
    current: Wallpaper;
    playlist?: Playlist;
    screen: Screen;
}

export function ToolBar({ playingPlaylist, screens }: ToolBarProps) {
    const [selectedPlaylist, setSelectedPlaylist] = useState<PlaylistWrapper | null>(null);
    const [playlists, setPlaylists] = useState<PlaylistWrapper[]>([]);
    const [isPaused, setIsPaused] = useState<boolean>(false);

    useEffect(() => {
        let tmpPlaylists: PlaylistWrapper[] = [];
        playingPlaylist?.forEach(item => {
            if (item.setting?.playIndex !== undefined) {
                var currentWallpaper = item.wallpapers[item.setting?.playIndex];
                var exist = tmpPlaylists.some(x => x.current.fileUrl === currentWallpaper.fileUrl);
                if (!exist)
                    tmpPlaylists.push({
                        current: currentWallpaper,
                        playlist: item,
                        screen: screens[item.setting.screenIndexes[0]],
                    });
            }
        });
        setPlaylists(tmpPlaylists);
    }, [playingPlaylist, screens]);

    const handlePlayClick = useCallback(() => {
        var index = screens.findIndex(x => x.deviceName === selectedPlaylist?.screen.deviceName);
        api.resumeWallpaper(index);
        //更新playlist对应屏幕的ispaused
        var tmpPlaylists = [...playlists];
        //没有选中，就影响所有playlist
        tmpPlaylists.forEach(element => {
            if (selectedPlaylist && element.screen.deviceName !== selectedPlaylist.screen.deviceName)
                return;
            if (element.playlist && element.playlist.setting) {
                element.playlist.setting.isPaused = false;
            }
        });
        setPlaylists(tmpPlaylists);
    }, [playlists, screens, selectedPlaylist]);

    const handlePauseClick = useCallback(() => {
        var index = screens.findIndex(x => x.deviceName === selectedPlaylist?.screen.deviceName);
        api.pauseWallpaper(index);
        //更新playlist对应屏幕的ispaused
        var tmpPlaylists = [...playlists];
        //没有选中，就影响所有playlist
        tmpPlaylists.forEach(element => {
            if (selectedPlaylist && element.screen.deviceName !== selectedPlaylist.screen.deviceName)
                return;
            if (element.playlist && element.playlist.setting) {
                element.playlist.setting.isPaused = true;
            }
        });
        setPlaylists(tmpPlaylists);
    }, [playlists, screens, selectedPlaylist]);

    useEffect(() => {
        //选中播放列表已移除
        var exist = playlists?.some(x => x.playlist?.wallpapers.some(y => y.fileUrl === selectedPlaylist?.current.fileUrl));
        if (!exist)
            setSelectedPlaylist(null);

        //设置isPaused
        var isPaused = playlists.some(x => x.playlist?.setting?.isPaused);
        if (selectedPlaylist)
            isPaused = selectedPlaylist.playlist?.setting?.isPaused || false;
        setIsPaused(isPaused);
    }, [playlists, selectedPlaylist]);

    return <div className="fixed inset-x-0 ml-18 bottom-0 bg-background h-20 border-t border-primary-300 dark:border-primary-600 flex items-center px-4 space-x-4">
        <div className="flex flex-wrap flex-initial w-1/4 overflow-hidden h-full">
            {playlists.map((item, index) => {
                const isSelected = selectedPlaylist?.current === item.current;
                return <div key={index} className="flex items-center space-x-4 p-1">
                    <picture onClick={() => isSelected ? setSelectedPlaylist(null) : setSelectedPlaylist(item)} className={cn({ "cursor-pointer": playlists.length > 1 })}>
                        <img
                            alt="Cover"
                            title={item.current.meta?.title}
                            className={cn(["rounded-lg object-scale-cover aspect-square", playlists.length > 1 && isSelected ? " border-2 border-primary" : ""])}
                            height={50}
                            src={item.current.coverUrl || "/wp-placeholder.webp"}
                            width={50}
                        />
                    </picture>
                    {
                        (playlists.length === 1) && <div className="flex flex-col text-sm truncate">
                            <div className="font-semibold">{item?.current.meta?.title}</div>
                            <div >{item?.current.meta?.description}</div>
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
                {
                    isPaused && <Button variant="ghost" className="hover:text-primary" title="播放" onClick={handlePlayClick}>
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
                }
                {
                    !isPaused && <Button variant="ghost" className="hover:text-primary" title="暂停" onClick={handlePauseClick}>
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
                }
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
            {(selectedPlaylist || playlists.length === 1) && <div className="flex items-center justify-between text-xs w-full">
                <div className="text-primary-600 dark:text-primary-400">00:00</div>
                <div className="w-full h-1 mx-4 bg-primary/60 rounded" />
                <div className="text-primary-600 dark:text-primary-400">04:30</div>
            </div>}
        </div>

        <div className="flex flex-initial w-1/4 items-center justify-end">
            <Popover>
                <PopoverTrigger asChild>
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
            {(selectedPlaylist || playlists.length === 1) && <>
                <Sheet>
                    <SheetTrigger asChild>
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
