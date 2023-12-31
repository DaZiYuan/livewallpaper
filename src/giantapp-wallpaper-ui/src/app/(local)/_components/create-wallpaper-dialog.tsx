
import { Button } from "@/components/ui/button"
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { DeleteIcon, UploadCloudIcon } from "lucide-react"
import { Progress } from "@/components/ui/progress"
import { useCallback, useEffect, useRef, useState } from "react"
import { cn } from "@/lib/utils"
import api from "@/lib/client/api"
import { toast } from "sonner"
import * as z from "zod"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { Form, FormControl, FormField, FormItem, FormMessage } from "@/components/ui/form"

const formSchema = z.object({
    title: z.string(),
    file: z.instanceof(File, {
        message: "文件未上传",
    }).refine((file) => file.size < 1024 * 1024 * 1024, {
        message: "文件大小不能超过1G",
    }),
})

interface CreateWallpaperDialogProps {
    open: boolean
    onChange: (open: boolean) => void
    createSuccess?: () => void
}

function processFile(file: File, onProgress: (progress: number) => void, controller: AbortController): Promise<string> {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = async (e) => {
            if (!e.target) {
                reject(new Error('事件中找不到目标'));
                return;
            }
            try {
                const contents = new Uint8Array(e.target.result as ArrayBuffer);
                if (contents) {
                    let binaryString = '';
                    const chunkSize = 50000; // 防止堆栈溢出的块大小
                    let i = 0; // 在函数外部初始化以跟踪进度
                    let lastReportedProgress = 0; // 上次报告的进度

                    const processChunk = () => {
                        if (controller.signal.aborted) {
                            reject(new Error('Processing aborted'));
                            return;
                        }

                        const start = i;
                        const end = Math.min(i + chunkSize, contents.length);
                        const subArray = Array.from(contents.subarray(start, end));
                        binaryString += String.fromCharCode.apply(null, subArray);
                        i += chunkSize;

                        // 计算并报告进度
                        const progress = i / contents.length * 100;
                        //变化大于一才触发
                        if (Math.floor(progress) > Math.floor(lastReportedProgress)) {
                            onProgress(progress);
                            lastReportedProgress = progress;
                        }

                        if (i < contents.length) {
                            // 如果还有更多要处理的，安排下一个块
                            setTimeout(processChunk, 0);
                        } else {
                            // 否则，完成处理
                            let base64String = btoa(binaryString);
                            resolve(base64String);
                        }
                    }

                    // 开始处理
                    processChunk();
                }
            } catch (error) {
                reject(error);
            }
        };
        reader.readAsArrayBuffer(file);

        controller.signal.addEventListener('abort', () => {
            reader.abort();
            reject(new Error('导入已中止'));
        });
    });
}

let abortController: AbortController | undefined = undefined;

export function CreateWallpaperDialog(props: CreateWallpaperDialogProps) {
    const form = useForm<z.infer<typeof formSchema>>({
        resolver: zodResolver(formSchema),
        defaultValues: {
            title: "",
            file: undefined
        }
    })
    const [isOver, setIsOver] = useState(false);
    const [progress, setProgress] = useState(0);
    const [uploading, setUploading] = useState(false);
    const uploadingFile = form.watch("file");
    const [uploadedFile, setUploadedFile] = useState<{
        name: string,
        path: string
    }>();
    const fileInputRef = useRef<HTMLInputElement>(null);

    //每次打开重置状态
    useEffect(() => {
        if (!props.open) {
            setIsOver(false);
            setProgress(0);
            setUploading(false);
            setUploadedFile(undefined);
            abortController?.abort();
            form.reset();
        }
    }, [form, props.open]);

    const uploadFile = useCallback(async (file: File) => {
        setProgress(0);
        setUploading(true);
        setUploadedFile(undefined);

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
            setUploadedFile({
                name: file.name,
                path: data || ""
            });
            const fileName = file.name.split(".")[0];
            if (!form.getValues("title"))
                form.setValue("title", fileName);
        } catch (e) {
            toast.error((e as any).message);
        } finally {
            setUploading(false);
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
        setIsOver(false);
    }, []);

    //form.file变化后自动上传
    useEffect(() => {
        if (uploadingFile) {
            uploadFile(uploadingFile);
        }
    }, [uploadFile, uploadingFile]);

    async function onSubmit(data: z.infer<typeof formSchema>) {
        if (!data.title)
            data.title = "未命名";
        console.log(data);
        if (uploading) {
            toast.info("导入中，请稍等");
            return;
        }
        var res = await api.createWallpaper(data.title, uploadedFile?.path || "");
        if (!res.data)
            toast.warning("创建失败，不支持的格式");
        else {
            toast.success(`创建成功`);
            props.createSuccess?.();
        }
    }

    return <Dialog open={props.open} onOpenChange={(e) => {
        if (!e && uploading) {
            confirm("导入未完成，确定要关闭吗？") && props.onChange(e);
            return;
        }
        props.onChange(e);
    }} >
        <DialogTrigger asChild>
            <Button
                aria-label="创建壁纸"
                className="flex w-full h-full hover:text-primary"
                title="创建壁纸"
                variant="ghost"
                onClick={() => props.onChange(!props.open)}
            >
                <svg
                    className="h-5 w-5"
                    fill="none"
                    stroke="currentColor"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="2"
                    viewBox="0 0 24 24"
                    xmlns="http://www.w3.org/2000/svg"
                >
                    <path d="M12 4v16m8-8H4" />
                </svg>
            </Button>
        </DialogTrigger>
        <DialogContent className="sm:max-w-[425px]">
            <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)}>
                    <DialogHeader>
                        <DialogTitle>创建壁纸</DialogTitle>
                        <DialogDescription>
                            本地壁纸，仅保存在你本机
                        </DialogDescription>
                    </DialogHeader>
                    <div className="mt-2 mb-3">
                        <div className="flex flex-col space-y-4">
                            <FormField
                                control={form.control}
                                name="title"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormControl>
                                            <Input autoFocus placeholder="输入标题" {...field} autoComplete="off" />
                                        </FormControl>
                                    </FormItem>
                                )}
                            />
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
                            {!uploadedFile
                                ?
                                <>
                                    {!uploading ?
                                        <div
                                            onClick={() => { fileInputRef.current?.click() }}
                                            onDragOver={handleDragOver}
                                            onDragLeave={handleDragLeave}
                                            onDrop={handleDrop}
                                            className={cn(["flex flex-col items-center justify-center w-full h-32 border-2 border-dashed rounded-md cursor-pointer hover:border-primary hover:bg-muted", {
                                                "border-primary bg-muted": isOver,
                                            }])}>
                                            <UploadCloudIcon className="text-foreground w-10 h-10" />
                                            <p className="text-gray-500">{isOver ? "释放鼠标" : " 点击导入或拖入文件到这里"}</p>
                                        </div>
                                        :
                                        <div>
                                            <span> 导入中...</span>
                                            <Progress className="mt-2" value={progress} />
                                        </div>}
                                </>
                                :
                                <>
                                    <h4 className="text-[#9CA3AF] mb-2">已导入文件:</h4>
                                    <div className="flex justify-between items-center text-[#9CA3AF]">
                                        <p>{uploadedFile.name}</p>
                                        <Button type="button" variant="ghost" onClick={() => setUploadedFile(undefined)}>
                                            <DeleteIcon className="h-6 w-6" />
                                        </Button>
                                    </div>
                                </>
                            }
                        </div>
                    </div>
                    <DialogFooter >
                        <Button type="submit">保存</Button>
                    </DialogFooter>
                </form>
            </Form>
        </DialogContent>
    </Dialog >
}