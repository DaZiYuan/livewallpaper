import { langDictAtom } from "@/atoms/lang";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { SheetTrigger, SheetContent, SheetHeader, SheetTitle, SheetDescription, Sheet } from "@/components/ui/sheet";
import { Wallpaper } from "@/lib/client/types/wallpaper";
import { Label } from "@radix-ui/react-label";
import { useAtomValue } from "jotai";

//定义组件
const PlaylistSheet = ({ selectedWallpaper }: {
    selectedWallpaper?: Wallpaper | null
}) => {
    const dictionary = useAtomValue(langDictAtom);
    return <Sheet modal={true}>
        <SheetTrigger asChild>
            <Button variant="ghost" className="hover:text-primary px-3" title={dictionary['local'].play_list}>
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
                <SheetTitle>{dictionary['local'].play_list}</SheetTitle>
                <SheetDescription>
                    <Dialog>
                        <DialogTrigger asChild>
                            <Button variant="outline">{dictionary['local'].add_wallpaper}</Button>
                        </DialogTrigger>
                        <DialogContent className="sm:max-w-[425px]">
                            <DialogHeader>
                                <DialogTitle>Edit profile</DialogTitle>
                                <DialogDescription>
                                    Make changes to your profile here. Click save whe
                                </DialogDescription>
                            </DialogHeader>
                            <div className="grid gap-4 py-4">
                                <div className="grid grid-cols-4 items-center gap-4">
                                    <Label htmlFor="name" className="text-right">
                                        Name
                                    </Label>
                                    <Input id="name" value="Pedro Duarte" className="col-span-3" />
                                </div>
                                <div className="grid grid-cols-4 items-center gap-4">
                                    <Label htmlFor="username" className="text-right">
                                        Username
                                    </Label>
                                    <Input id="username" value="@peduarte" className="col-span-3" />
                                </div>
                            </div>
                            <DialogFooter>
                                <Button type="submit">Save changes</Button>
                            </DialogFooter>
                        </DialogContent>
                    </Dialog>
                </SheetDescription>
            </SheetHeader>
            {/* 选中播放列表的壁纸列表 */}
            <div className="flex flex-col space-y-2">
                {selectedWallpaper?.meta.wallpapers?.map((item, index) => {
                    return <div key={index} className="flex items-center p-0 m-0" >
                        <picture className="mr-2">
                            <img
                                alt="Cover"
                                title={item.meta?.title}
                                className="rounded-lg object-scale-cover aspect-square"
                                height={50}
                                src={item.coverUrl || "/wp-placeholder.webp"}
                                width={50}
                            />
                        </picture>
                        <div className="flex flex-col text-sm truncate">
                            <div className="font-semibold">{item?.meta?.title}</div>
                            <div >{item?.meta?.description}</div>
                        </div>
                    </div>
                })}
            </div>
        </SheetContent>
    </Sheet>
}
export default PlaylistSheet;