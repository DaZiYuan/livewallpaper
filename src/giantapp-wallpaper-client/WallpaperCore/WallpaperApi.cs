﻿using NLog;
using System.Collections.Concurrent;
using Windows.Win32;

namespace WallpaperCore;

/// <summary>
/// 暴露壁纸API
/// </summary>
public static class WallpaperApi
{
    #region properties

    public static Logger Logger { get; } = LogManager.GetCurrentClassLogger();

    //运行中的屏幕和对应的播放列表，线程安全
    public static ConcurrentDictionary<uint, WallpaperManager> RunningWallpapers { get; } = new();

    #endregion

    static WallpaperApi()
    {
        //禁用DPI
        SetPerMonitorV2DpiAwareness();
    }

    #region events

    #endregion

    #region public method

    //一次性获取目录内的壁纸
    public static Wallpaper[] GetWallpapers(params string[] directories)
    {
        var wallpapers = new List<Wallpaper>();
        foreach (var directory in directories)
        {
            wallpapers.AddRange(EnumerateWallpapersAsync(directory));
        }

        return wallpapers.ToArray();
    }

    //枚举目录内的壁纸
    public static IEnumerable<Wallpaper> EnumerateWallpapersAsync(string directory)
    {
        //目录不存在
        if (!Directory.Exists(directory))
            yield break;

        // 遍历目录文件，筛选壁纸
        foreach (var file in Directory.EnumerateFiles(directory, "*", SearchOption.AllDirectories))
        {
            var fileInfo = new FileInfo(file);

            // 符合支持格式的
            if (Wallpaper.IsSupportedFile(fileInfo.Extension))
            {
                Wallpaper? wallpaper = Wallpaper.From(file);
                if (wallpaper == null)
                    continue;

                yield return wallpaper;
            }
        }
    }

    //获取屏幕信息
    public static Screen[] GetScreens()
    {
        var res = Screen.AllScreens;
        //根据bounds x坐标排序,按逗号分隔，x坐标是第一个
        Array.Sort(res, (a, b) =>
        {
            var aBounds = a.Bounds;
            var bBounds = b.Bounds;
            return aBounds.X.CompareTo(bBounds.X);
        });
        return res;
    }

    //显示壁纸
    public static bool ShowWallpaper(Playlist playlist)
    {
        if (playlist == null || playlist.Setting == null || playlist.Setting.ScreenIndexes.Length == 0)
            return false;

        foreach (var screenIndex in playlist.Setting.ScreenIndexes)
        {
            RunningWallpapers.TryGetValue(screenIndex, out WallpaperManager manager);
            if (manager == null)
            {
                manager = new WallpaperManager()
                {
                    Playlist = playlist,
                    ScreenIndex = screenIndex
                };
                RunningWallpapers.TryAdd(screenIndex, manager);
            }
            else
            {
                manager.Playlist = playlist;
            }

            manager.Play(screenIndex);
        }

        return true;
    }

    //关闭壁纸
    public static void CloseWallpaper(uint screenIndex = 0)
    {
        RunningWallpapers.TryRemove(screenIndex, out _);
    }

    //删除壁纸
    public static void DeleteWallpaper(params Wallpaper[] wallpapers)
    {
        foreach (var wallpaper in wallpapers)
        {
            try
            {
                File.Delete(wallpaper.FilePath);

                //存在meta删除meta
                string fileName = Path.GetFileNameWithoutExtension(wallpaper.FileName);
                string metaJsonFile = Path.Combine(wallpaper.Dir, $"{fileName}.meta.json");
                if (File.Exists(metaJsonFile))
                    File.Delete(metaJsonFile);

                //如果文件夹空了，删除文件夹
                if (Directory.GetFiles(wallpaper.Dir).Length == 0)
                    Directory.Delete(wallpaper.Dir);
            }
            catch (Exception ex)
            {
                Logger?.Warn($"删除壁纸失败：{wallpaper.FilePath} ${ex}");
            }
        }
    }

    //下载壁纸
    public static void DownloadWallpaper(string saveDirectory, Wallpaper wallpapers, Playlist? toPlaylist)
    {
    }

    public static void Dispose()
    {
        foreach (var item in RunningWallpapers)
        {
            item.Value.Dispose();
        }

        RunningWallpapers.Clear();
    }

    //获取快照
    public static WallpaperApiSnapshot GetSnapshot()
    {
        var res = new WallpaperApiSnapshot
        {
            Data = new List<(Playlist Playlist, object PlayerData)>()
        };
        foreach (var item in RunningWallpapers)
        {
            var snapshotData = item.Value.GetSnapshotData();
            if (item.Value.Playlist != null)
                res.Data.Add((item.Value.Playlist, snapshotData));
        }

        return res;
    }

    //恢复快照
    public static void RestoreFromSnapshot(WallpaperApiSnapshot? snapshot)
    {
        if (snapshot == null || snapshot.Data == null)
            return;

        foreach (var item in snapshot.Data)
        {
            ShowWallpaper(item.Playlist);
        }
    }

    #endregion

    #region private methods

    static void SetPerMonitorV2DpiAwareness()
    {
        try
        {
            // 首先，尝试将DPI感知设置为PerMonitorV2
            if (PInvoke.SetProcessDpiAwarenessContext(new Windows.Win32.UI.HiDpi.DPI_AWARENESS_CONTEXT(-4)))
            {
                Logger.Info("成功设置为PerMonitorV2 DPI感知。");
            }
            else
            {
                // 如果函数失败，可以尝试使用较旧的方法设置
                if (PInvoke.SetProcessDpiAwareness(Windows.Win32.UI.HiDpi.PROCESS_DPI_AWARENESS.PROCESS_PER_MONITOR_DPI_AWARE).Succeeded)
                {
                    Logger.Info("成功设置为PerMonitor DPI感知。");
                }
                else
                {
                    Logger.Info("无法设置DPI感知。");
                }
            }
        }
        catch (Exception ex)
        {
            Logger.Error($"设置DPI感知时出错：{ex.Message}");
        }
    }

    #endregion

    #region internal methods

    //暂停壁纸
    static void PauseWallpaper(uint screenIndex = 0)
    {
    }

    //恢复壁纸
    static void ResumeWallpaper(uint screenIndex = 0)
    {
    }

    #endregion
}
