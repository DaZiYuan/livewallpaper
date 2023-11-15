﻿using Client.Libs;
using Newtonsoft.Json;
using System;
using System.Runtime.InteropServices;
using System.Windows.Forms;
using WallpaperCore;

namespace Client.Apps;

public class ConfigSetAfterEventArgs : EventArgs
{
    public string Key { get; set; } = string.Empty;
    public string Json { get; set; } = string.Empty;
}

public class CorrectConfigEventArgs : ConfigSetAfterEventArgs
{
    public object? Corrected { get; set; }
}

public class ProgressEventArgs : EventArgs
{
    public int Progress { get; set; }
    public string Message { get; set; } = string.Empty;
    public bool IsCompleted { get; set; }
    public bool IsError { get; set; }
}

/// <summary>
/// 前端api
/// </summary>
[ClassInterface(ClassInterfaceType.AutoDual)]
[ComVisible(true)]
public class ApiObject
{
    public static event EventHandler<ConfigSetAfterEventArgs>? ConfigSetAfterEvent;
    public static event EventHandler<CorrectConfigEventArgs>? CorrectConfigEvent;
    //public delegate void EventDelegate(string data);
    //public event EventDelegate? InitProgressEvent;

    public ApiObject()
    {
        //Task.Run(() =>
        //{
        //    //模拟10秒进度
        //    for (int i = 0; i < 1000; i++)
        //    {
        //        Task.Delay(1000).Wait();
        //        string json = JsonConvert.SerializeObject(new ProgressEventArgs
        //        {
        //            Progress = i * 10,
        //            Message = $"``初始化中{i * 10}%"
        //        });
        //        InitProgressEvent?.Invoke(json);
        //    }
        //});
    }

    public void SetConfig(string key, string json)
    {
        key = $"Client.Apps.Configs.{key}";
        var obj = JsonConvert.DeserializeObject(json, Configer.JsonSettings);
        Configer.Set(key, obj, true);
        if (ConfigSetAfterEvent != null && obj != null)
        {
            ConfigSetAfterEvent(this, new ConfigSetAfterEventArgs
            {
                Key = key,
                Json = json
            });
        }
    }

    public string GetConfig(string key)
    {
        key = $"Client.Apps.Configs.{key}";
        var config = Configer.Get<object>(key) ?? "";
        var json = JsonConvert.SerializeObject(config, Configer.JsonSettings);
        if (CorrectConfigEvent != null)
        {
            var e = new CorrectConfigEventArgs
            {
                Key = key,
                Json = json
            };
            CorrectConfigEvent(this, e);
            if (e.Corrected != null)
            {
                json = JsonConvert.SerializeObject(e.Corrected, Configer.JsonSettings);
            }
        }

        return json;
    }

    public string GetWallpapers()
    {
        var directories = (Configer.Get<Configs.Wallpaper>() ?? new()).Directories;
        var res = WallpaperApi.GetWallpapers(directories ?? Configs.Wallpaper.DefaultWallpaperSaveFolder);
        foreach (var item in res)
        {
            //把本地路径转换为网址
            item.CoverPath = AppService.ConvertPathToUrl(item.CoverPath);
            item.FilePath = AppService.ConvertPathToUrl(item.FilePath);
        }
        return JsonConvert.SerializeObject(res, Configer.JsonSettings);
    }

    public string GetScreens()
    {
        var screens = WallpaperApi.GetScreens();
        return JsonConvert.SerializeObject(screens, Configer.JsonSettings);
    }

    public void ShowWallpaper(string wallpaperJson, uint? screenIndex)
    {
        var wallpaper = JsonConvert.DeserializeObject<Wallpaper>(wallpaperJson, Configer.JsonSettings);
        if (wallpaper == null)
            return;
        var playList = new Playlist();
        playList.Wallpapers.Add(wallpaper);

        WallpaperApi.ShowWallpaper(playList, screenIndex);
    }
}
