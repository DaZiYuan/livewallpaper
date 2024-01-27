
import { Button } from "@/components/ui/button"
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
    // DialogTrigger,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { DeleteIcon, UploadCloudIcon, ListPlus, PlusIcon } from "lucide-react"
import { Progress } from "@/components/ui/progress"
import { useCallback, useEffect, useRef, useState } from "react"
import { cn } from "@/lib/utils"
import api from "@/lib/client/api"
import { toast } from "sonner"
import * as z from "zod"
import { useForm, useFormState } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { Form, FormControl, FormField, FormItem, FormMessage } from "@/components/ui/form"
import { Wallpaper } from "@/lib/client/types/wallpaper"
import processFile from "./process-file"
import { Switch } from "@/components/ui/switch"
import { SelectWallpaperDialog } from "../select-wallpaper-dialog"
import { ScrollArea } from "@/components/ui/scroll-area"

interface WallpaperDialogProps {
    wallpaper?: Wallpaper | null
    open: boolean
    onChange: (open: boolean) => void
    createSuccess?: () => void
}

function getBase64FromBlob(blob: Blob): Promise<string> {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = (e) => {
            if (!e.target) {
                reject(new Error('事件中找不到目标'));
                return;
            }
            const arrayBuffer = e.target.result;
            const binaryString = Array.from(new Uint8Array(arrayBuffer as ArrayBuffer)).map(byte => String.fromCharCode(byte)).join('');
            const base64 = btoa(binaryString);
            resolve(base64);
        };
        reader.readAsArrayBuffer(blob);
    });
}

let abortController: AbortController | undefined = undefined;

export function WallpaperDialog(props: WallpaperDialogProps) {
    const formSchema = z.object({
        title: z.string().refine(value => value !== '', {
            message: '标题不能为空',
        }),
        isPlaylist: z.boolean().optional(),
        file: z.instanceof(File, {
            message: "文件未上传",
        }).optional().refine((file) => file && file.size < 1024 * 1024 * 1024, {
            message: "文件大小不能超过1G",
        }),
        wallpapers: z.array(z.any()).optional(),
    })
    const form = useForm<z.infer<typeof formSchema>>({
        resolver: zodResolver(formSchema),
        defaultValues: {
            title: "",
            isPlaylist: false,
            file: undefined,
            wallpapers: [],
        }
    })
    const { isDirty } = useFormState({ control: form.control });
    const [isOver, setIsOver] = useState(false);
    const [progress, setProgress] = useState(0);
    const [importing, setImporting] = useState(false);
    const importingFile = form.watch("file");
    const isPlaylist = form.watch("isPlaylist");
    const wallpapers = form.watch("wallpapers");
    const [importedFile, setImportedFile] = useState<{
        name: string,
        url: string,
        fileType: string | null
    }>();
    const [uploading, setUploading] = useState(false); //是否正在上传
    const fileInputRef = useRef<HTMLInputElement>(null);
    const inputRef = useRef<HTMLInputElement>(null);
    const previewVideoRef = useRef<HTMLVideoElement>(null);
    const previewImgRef = useRef<HTMLImageElement>(null);
    const [openSelectWallpaperDialog, setOpenSelectWallpaperDialog] = useState(false);

    //每次打开重置状态
    useEffect(() => {
        if (!props.open) {
            setIsOver(false);
            setProgress(0);
            setImporting(false);
            setImportedFile(undefined);
            abortController?.abort();
            form.reset();
        } else {
            if (props.wallpaper) {
                const isPlaylist = props.wallpaper?.setting.isPlaylist || false;
                form.setValue("title", props.wallpaper?.meta.title || "");
                form.setValue("file", new File([], ""));
                if (isPlaylist) {
                    form.setValue("isPlaylist", isPlaylist)
                    form.setValue("wallpapers", props.wallpaper?.setting.wallpapers || []);
                }
                else {
                    setImportedFile({
                        name: props.wallpaper?.fileName || "",
                        url: props.wallpaper?.fileUrl || "",
                        fileType: Wallpaper.getFileType(props.wallpaper?.fileUrl)
                    });
                }
            }
        }
    }, [form, props.open, props.wallpaper]);

    const uploadFile = useCallback(async (file: File) => {
        setProgress(0);
        setImporting(true);
        setImportedFile(undefined);

        abortController?.abort();
        abortController = new AbortController();

        const progressCallback = (progress: number) => {
            console.log(`导入进度: ${progress}%`);
            progress = Math.floor(progress);
            setProgress(progress);
        };
        try {
            const base64String = await processFile(file, progressCallback, abortController);
            var { data } = await api.uploadToTmp(file.name, base64String);
            console.log(data);
            setImportedFile({
                name: file.name,
                url: data || "",
                fileType: Wallpaper.getFileType(data)
            });
            const fileName = file.name.split(".")[0];
            if (!form.getValues("title"))
                form.setValue("title", fileName);
        } catch (e) {
            toast.error((e as any).message);
        } finally {
            setImporting(false);
            inputRef.current?.focus();
        }
    }, [form]);

    const handleDrop = useCallback(async (e: React.DragEvent<HTMLDivElement>) => {
        e.preventDefault();
        form.setValue("file", e.dataTransfer.files[0]);
    }, [form]);

    const handleDragOver = useCallback((e: React.DragEvent<HTMLDivElement>) => {
        e.preventDefault();
        setIsOver(true);
    }, []);

    const handleDragLeave = useCallback((e: React.DragEvent<HTMLDivElement>) => {
        e.preventDefault();
        // 检查鼠标是否真的离开了元素，还是只是移动到了子元素
        if (e.currentTarget.contains(e.relatedTarget as Node)) {
            // 鼠标指针移动到了子元素，不做任何处理
            return;
        }
        setIsOver(false);
    }, []);

    //form.file变化后自动上传
    useEffect(() => {
        if (importingFile && importingFile.size > 0) {
            uploadFile(importingFile);
        }
    }, [uploadFile, importingFile]);

    function generateCoverImage(): Promise<Blob> {
        return new Promise((resolve, reject) => {
            if (!importedFile) {
                reject(new Error('未导入文件'));
                return;
            }

            //当前预览元素
            let previewElement: HTMLVideoElement | HTMLImageElement | undefined | null;
            let eWidth: number;
            let eHeight: number;
            if (importedFile.fileType === "img") {
                previewElement = previewImgRef.current;
                eWidth = previewElement?.width || 0;
                eHeight = previewElement?.height || 0;
            } else {
                previewElement = previewVideoRef.current;
                eWidth = previewElement?.videoWidth || 0;
                eHeight = previewElement?.videoHeight || 0;
            }

            if (!previewElement) {
                reject(new Error('预览元素未找到'));
                return;
            }
            // 创建一个canvas元素
            const canvas = document.createElement('canvas');

            const ctx = canvas.getContext('2d');
            if (!ctx) {
                reject(new Error('Could not create canvas context'));
                return;
            }

            //按previewElement元素比例缩放到500
            const drawWidth = 500;
            const drawHeight = drawWidth * (eHeight / eWidth);
            canvas.width = drawWidth;
            canvas.height = drawHeight;
            ctx.drawImage(previewElement, 0, 0, drawWidth, drawHeight);
            // 将canvas的内容转换为Blob对象
            canvas.toBlob((blob) => {
                if (blob) {
                    resolve(blob);
                } else {
                    reject(new Error('Could not create blob from canvas'));
                }
            }, 'image/jpeg');
        });
    }

    async function submitWallpaper(data: z.infer<typeof formSchema>) {
        if (uploading || !importedFile || !importedFile.url)
            return;

        if (!data.title)
            data.title = "未命名";
        console.log(data);
        if (importing) {
            toast.info("导入中，请稍等");
            return;
        }
        setUploading(true);

        const imgData = await generateCoverImage();
        //Blob转换成base64
        const base64String = await getBase64FromBlob(imgData);
        const fileName = importedFile.name.split(".")[0] + ".jpg";
        var { data: coverUrl } = await api.uploadToTmp(fileName, base64String);
        if (props.wallpaper) {
            var res = await api.updateWallpaper(data.title, coverUrl || "", importedFile.url, props.wallpaper);
            if (!res.data)
                toast.warning("更新失败，不支持的格式");
            else {
                toast.success(`更新成功`);
                props.createSuccess?.();
            }
        }
        else {
            // var res = await api.createWallpaper(data.title, coverUrl || "", importedFile.url);
            var wallpaper = new Wallpaper({
                meta: {
                    title: data.title,
                },
                coverUrl: coverUrl || "",
                fileUrl: importedFile.url,
            });
            var res = await api.createWallpaperNew(wallpaper);
            if (!res.data)
                toast.warning("创建失败，不支持的格式");
            else {
                toast.success(`创建成功`);
                props.createSuccess?.();
            }
        }
        setUploading(false);
    }

    async function submitPlaylist(data: z.infer<typeof formSchema>) {
        if (!data.wallpapers?.length) {
            toast.warning("列表模式，壁纸不能为空");
            return;
        }
        console.log("submitPlaylist", data);
    }

    function onSubmit(data: z.infer<typeof formSchema>) {
        debugger
        if (data.isPlaylist) {
            return submitPlaylist(data);
        }
        else {
            return submitWallpaper(data);
        }

    }

    return <Dialog open={props.open} onOpenChange={(e) => {
        if (!e && isDirty) {
            confirm("尚未保存，确定要关闭吗？") && props.onChange(e);
            return;
        }
        props.onChange(e);
    }} >
        <DialogContent className="sm:max-w-[425px]">
            <DialogHeader>
                <DialogTitle>{props.wallpaper ? `编辑${isPlaylist ? "列表" : "壁纸"}` : `创建${isPlaylist ? "列表" : "壁纸"}`}</DialogTitle>
                <DialogDescription>
                    {`本地${isPlaylist ? "列表" : "壁纸"}，仅保存在你本机`}
                </DialogDescription>
            </DialogHeader>
            <ScrollArea className="max-h-[80vh]">
                <Form {...form}>
                    <form onSubmit={form.handleSubmit(onSubmit)}>
                        <div className="mt-2 mb-3">
                            <div className="flex flex-col space-y-4">
                                <FormField
                                    control={form.control}
                                    name="title"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormControl>
                                                <Input autoFocus placeholder="输入标题" {...field} autoComplete="off" ref={inputRef} />
                                            </FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />
                                {/* 是否是播放列表 */}
                                <FormField
                                    control={form.control}
                                    name="isPlaylist"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormControl>
                                                <label className="flex items-center space-x-2">
                                                    <Switch
                                                        checked={field.value}
                                                        onCheckedChange={field.onChange}
                                                    />
                                                    <span>播放列表</span>
                                                </label>
                                            </FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />
                                {/* 壁纸界面 */}
                                {isPlaylist === false && <>
                                    {!importedFile
                                        ?
                                        <>
                                            {!importing ?
                                                <div
                                                    onClick={() => { fileInputRef.current?.click() }}
                                                    onDragOver={handleDragOver}
                                                    onDragLeave={handleDragLeave}
                                                    onDrop={handleDrop}
                                                    className={cn(["flex flex-col items-center justify-center w-full h-32 border-2 border-dashed rounded-md cursor-pointer hover:border-primary hover:bg-muted", {
                                                        "border-primary bg-muted": isOver,
                                                    }])}>
                                                    <UploadCloudIcon className="text-foreground  w-5 h-5 mb-2" />
                                                    <p className="text-gray-500">{isOver ? "释放鼠标" : " 点击导入或拖入文件到这里"}</p>
                                                </div>
                                                :
                                                <div>
                                                    <span> 导入中...</span>
                                                    <Progress className="mt-2" value={progress} />
                                                </div>
                                            }
                                        </>
                                        :
                                        <>
                                            <h4 className="text-[#9CA3AF] mb-2">已导入文件:</h4>
                                            <div className="flex justify-between items-center text-[#9CA3AF]">
                                                <div>
                                                    <div className="flex justify-between items-center">
                                                        <p>{importedFile.name}</p>   <Button type="button" variant="ghost" onClick={() => {
                                                            setImportedFile(undefined);
                                                            if (fileInputRef.current)
                                                                fileInputRef.current.value = '';
                                                        }}>
                                                            <DeleteIcon className="h-6 w-6" />
                                                        </Button>
                                                    </div>
                                                    {
                                                        importedFile.fileType === "video" && <video
                                                            onError={(e) => console.error('Video loading error:', e)}
                                                            autoPlay={true} ref={previewVideoRef} className="object-contain">
                                                            <source src={importedFile.url} />
                                                        </video>
                                                    }
                                                    {
                                                        importedFile.fileType === "img" &&
                                                        <picture>
                                                            <img alt="预览" src={importedFile.url} ref={previewImgRef} />
                                                        </picture>
                                                    }
                                                </div>
                                            </div>
                                        </>
                                    }
                                </>}
                                {/* 列表界面 */}
                                {isPlaylist && <>
                                    {!wallpapers || wallpapers.length === 0 && <>
                                        <div
                                            onClick={() => { setOpenSelectWallpaperDialog(true) }}
                                            className={cn(["flex flex-col items-center justify-center w-full h-32 border-2 border-dashed rounded-md cursor-pointer hover:border-primary hover:bg-muted", {
                                                "border-primary bg-muted": isOver,
                                            }])}>
                                            <ListPlus className="text-foreground w-5 h-5 mb-2" />
                                            <p className="text-gray-500">{"设置壁纸列表"}</p>
                                        </div>
                                    </>}
                                    {wallpapers && wallpapers.length > 0 && <div className="flex flex-col space-y-2">
                                        <ul role="list" className="grid grid-cols-2 gap-x-4 gap-y-8 p-2">
                                            {wallpapers.map((wallpaper, index) => (
                                                <li key={index} className="relative">
                                                    <div className="group aspect-h-7 aspect-w-10 block w-full overflow-hidden rounded-lg" title={wallpaper.meta.title}>
                                                        <picture>
                                                            <img src={wallpaper.coverUrl}
                                                                height="200"
                                                                width="300"
                                                                style={{
                                                                    aspectRatio: "300/200",
                                                                    objectFit: "cover",
                                                                }}
                                                                alt={wallpaper.title} className="pointer-events-none object-cover group-hover:opacity-75" />
                                                        </picture>
                                                    </div>
                                                    <p className="pointer-events-none mt-2 block truncate text-sm font-medium">{wallpaper.meta.title}</p>
                                                    <Button className="absolute top-0 right-0" type="button" variant="ghost" onClick={() => {
                                                        form.setValue("wallpapers", wallpapers.filter((_, i) => i !== index));
                                                    }}>
                                                        <DeleteIcon className="h-6 w-6" />
                                                    </Button>
                                                </li>
                                            ))}
                                        </ul>
                                    </div>}
                                </>}
                                <FormField
                                    control={form.control}
                                    name="file"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormControl>
                                                <Input {...field}
                                                    accept="image/*,video/*"
                                                    type="file"
                                                    value={undefined}
                                                    ref={fileInputRef}
                                                    style={{ display: 'none' }}
                                                    onChange={(e) => {
                                                        const file = e.target.files ? e.target.files[0] : null;
                                                        field.onChange(file);
                                                    }
                                                    } />
                                            </FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />
                            </div>
                        </div>

                        <SelectWallpaperDialog selectedWallpapers={props.wallpaper?.setting.wallpapers || []}
                            open={openSelectWallpaperDialog}
                            onChangeOpen={setOpenSelectWallpaperDialog}
                            onSaveSuccess={(wallpapers) => {
                                //append
                                form.setValue("wallpapers", [...wallpapers, ...(form.getValues("wallpapers") || [])]);
                            }}
                        />
                    </form>
                </Form>
            </ScrollArea>
            <DialogFooter>
                <div className="flex w-full justify-between">
                    {
                        isPlaylist ? <Button type="button" variant="secondary" onClick={() => { setOpenSelectWallpaperDialog(true) }}>
                            添加壁纸
                        </Button> : <div></div>
                    }
                    <Button type="submit" disabled={uploading}>
                        {uploading && <div className="animate-spin w-4 h-4 border-t-2 border-muted rounded-full mr-2" />}
                        {uploading ? "创建中..." : "保存"}
                    </Button>
                </div>
            </DialogFooter>
        </DialogContent>
    </Dialog>
}