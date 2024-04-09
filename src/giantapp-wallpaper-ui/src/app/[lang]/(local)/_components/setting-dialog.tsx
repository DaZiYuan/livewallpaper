import { Fit, Wallpaper, WallpaperSetting, WallpaperType } from "@/lib/client/types/wallpaper"
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
    // DialogTrigger,
} from "@/components/ui/dialog"
import * as z from "zod"
import { useForm, useFormState } from "react-hook-form"
import { Button } from "@/components/ui/button"
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel } from "@/components/ui/form"
import { Switch } from "@/components/ui/switch"
import { useEffect, useState } from "react"
import api from "@/lib/client/api"
import { toast } from "sonner"
import { getGlobal } from '@/i18n-config';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"

interface SettingDialogProps {
    wallpaper: Wallpaper
    open: boolean
    onChange: (open: boolean) => void
    saveSuccess?: (wallpaper: Wallpaper) => void
}

const formSchema = z.object({
    enableMouseEvent: z.boolean(),
    hardwareDecoding: z.boolean(),
    isPanScan: z.boolean(),
    volume: z.number().min(0).max(100),
    fit: z.nativeEnum(Fit),
    keepWallpaper: z.boolean()
})

export function SettingDialog(props: SettingDialogProps) {
    const dictionary = getGlobal();
    const form = useForm<z.infer<typeof formSchema>>({
        mode: "onChange",
        defaultValues: {
            enableMouseEvent: props.wallpaper?.setting.enableMouseEvent ?? true,
            hardwareDecoding: props.wallpaper?.setting.hardwareDecoding ?? true,
            isPanScan: props.wallpaper?.setting.isPanScan ?? true,
            // volume: props.wallpaper?.setting.volume ?? 100,
            fit: props.wallpaper?.setting.fit ?? Fit.Center,
            keepWallpaper: props.wallpaper?.setting.keepWallpaper,
        },
    })
    const { isDirty } = useFormState({ control: form.control });
    const [saving, setSaving] = useState(false);
    const [wallpaperType, setWallpaperType] = useState<WallpaperType>(WallpaperType.NotSupported)

    //每次打开重置状态
    useEffect(() => {
        if (props.open)
            form.reset({
                enableMouseEvent: props.wallpaper.setting.enableMouseEvent,
                hardwareDecoding: props.wallpaper.setting.hardwareDecoding,
                isPanScan: props.wallpaper.setting.isPanScan,
                // volume: props.wallpaper.setting.volume,
                fit: props.wallpaper.setting.fit,
                keepWallpaper: props.wallpaper.setting.keepWallpaper,
            })
        setWallpaperType(props.wallpaper.meta.type || WallpaperType.NotSupported)
    }, [form, props.open, props.wallpaper])

    async function onSubmit(data: z.infer<typeof formSchema>) {
        if (saving) return;
        setSaving(true);

        const setting = new WallpaperSetting({
            enableMouseEvent: data.enableMouseEvent,
            hardwareDecoding: data.hardwareDecoding,
            isPanScan: data.isPanScan,
            // volume: data.volume,
            fit: data.fit,
            keepWallpaper: data.keepWallpaper,
        });

        const res = await api.setWallpaperSetting(setting, props.wallpaper);
        if (res.data) {
            toast.success(dictionary['local'].set_successful);
        }
        else {
            toast.error(dictionary['local'].set_failed);
        }

        props.onChange(false);
        props.saveSuccess?.({
            ...props.wallpaper,
            setting,
        });

        setSaving(false);
    }

    return <Dialog open={props.open} onOpenChange={(e) => {
        if (!e && isDirty) {
            confirm(dictionary['local'].not_saved_confirm_close) && props.onChange(e);
            return;
        }
        props.onChange(e);
    }} >
        <DialogContent>
            <DialogHeader>
                <DialogTitle>{dictionary['local'].setting}</DialogTitle>
                <DialogDescription>{dictionary['local'].setting_parameters}</DialogDescription>
            </DialogHeader>
            <Form {...form}>
                <form className="space-y-6"
                    onSubmit={form.handleSubmit(onSubmit)}>
                    {wallpaperType === WallpaperType.Exe && <>
                        <FormField
                            control={form.control}
                            name="enableMouseEvent"
                            render={({ field }) => (
                                <FormItem className="flex flex-row items-center justify-between rounded-lg border p-3 shadow-sm">
                                    <div className="space-y-0.5">
                                        <FormLabel>
                                            {dictionary['local'].mouse_event}
                                        </FormLabel>
                                        <FormDescription>
                                            {dictionary['local'].enable_mouse_events}
                                        </FormDescription>
                                    </div>
                                    <FormControl>
                                        <Switch
                                            checked={field.value}
                                            onCheckedChange={field.onChange}
                                        />
                                    </FormControl>
                                </FormItem>
                            )}
                        />
                    </>}
                    {wallpaperType === WallpaperType.Video && <>
                        <FormField
                            control={form.control}
                            name="hardwareDecoding"
                            render={({ field }) => (
                                <FormItem className="flex flex-row items-center justify-between rounded-lg border p-3 shadow-sm">
                                    <div className="space-y-0.5">
                                        <FormLabel>
                                            {dictionary['local'].enable_hardware_decoding}
                                        </FormLabel>
                                        <FormDescription>
                                            {dictionary['local'].disable_cpu_consumption}
                                        </FormDescription>
                                    </div>
                                    <FormControl>
                                        <Switch
                                            checked={field.value}
                                            onCheckedChange={field.onChange}
                                        />
                                    </FormControl>
                                </FormItem>
                            )}
                        />
                        <FormField
                            control={form.control}
                            name="isPanScan"
                            render={({ field }) => (
                                <FormItem className="flex flex-row items-center justify-between rounded-lg border p-3 shadow-sm">
                                    <div className="space-y-0.5">
                                        <FormLabel>
                                            {dictionary['local'].stretch_image}
                                        </FormLabel>
                                        <FormDescription>
                                            {dictionary['local'].stretch_image_description}
                                        </FormDescription>
                                    </div>
                                    <FormControl>
                                        <Switch
                                            checked={field.value}
                                            onCheckedChange={field.onChange}
                                        />
                                    </FormControl>
                                </FormItem>
                            )}
                        />
                    </>}
                    {wallpaperType === WallpaperType.Img && <>
                        <FormField
                            control={form.control}
                            name="fit"
                            render={({ field }) => (
                                <FormItem className=" items-center justify-between rounded-lg border p-3 shadow-sm">
                                    <FormLabel>
                                        {dictionary['local'].fit_mode}
                                    </FormLabel>
                                    <Select onValueChange={field.onChange} defaultValue={field.value.toString()}>
                                        <FormControl>
                                            <SelectTrigger>
                                                <SelectValue placeholder="Select a verified email to display" />
                                            </SelectTrigger>
                                        </FormControl>
                                        <SelectContent>
                                            {Object.entries(Fit).filter(([key]) => isNaN(Number(key))).map(([key, value]) => (
                                                <SelectItem key={key.toString()} value={value}>
                                                    {dictionary['local'][key.toLowerCase()]}
                                                </SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                    <FormDescription>
                                        {dictionary['local'].fit_description}
                                    </FormDescription>
                                </FormItem>
                            )}
                        />
                        <FormField
                            control={form.control}
                            name="keepWallpaper"
                            render={({ field }) => (
                                <FormItem className="flex flex-row items-center justify-between rounded-lg border p-3 shadow-sm">
                                    <div className="space-y-0.5">
                                        <FormLabel>
                                            {dictionary['local'].keep_wallpaper}
                                        </FormLabel>
                                        <FormDescription>
                                            {dictionary['local'].keep_wallpaper_description}
                                        </FormDescription>
                                    </div>
                                    <FormControl>
                                        <Switch
                                            checked={field.value}
                                            onCheckedChange={field.onChange}
                                        />
                                    </FormControl>
                                </FormItem>
                            )}
                        />
                    </>}
                    <DialogFooter>
                        <Button className="btn btn-primary" type="submit" disabled={saving}>
                            {saving && <div className="animate-spin w-4 h-4 border-t-2 border-muted rounded-full mr-2" />}
                            {saving ? dictionary['local'].saving : dictionary['local'].save}
                        </Button>
                    </DialogFooter>
                </form>
            </Form>
        </DialogContent>
    </Dialog >
}
