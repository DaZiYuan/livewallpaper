﻿
using NLog;
using WallpaperCore.Players;

namespace WallpaperCore;

public class WallpaperManagerSnapshot
{
    public MpvPlayerSnapshot? MpvPlayerSnapshot { get; set; }
}

//管理一个屏幕的壁纸播放
public class WallpaperManager
{
    readonly MpvPlayer _mpvPlayer = new();
    readonly Logger _logger = LogManager.GetCurrentClassLogger();
    readonly bool _isRestore;
    WallpaperCoveredBehavior _currentCoveredBehavior = WallpaperCoveredBehavior.Pause;

    public WallpaperManager(WallpaperManagerSnapshot? snapshot = null)
    {
        if (snapshot != null)
        {
            if (snapshot.MpvPlayerSnapshot != null)
            {
                _mpvPlayer = new MpvPlayer(snapshot.MpvPlayerSnapshot);
                _isRestore = true;
            }
        }
    }

    public Wallpaper? Wallpaper { get; set; }
    public bool IsScreenMaximized { get; private set; }

    internal void Dispose()
    {
        try
        {
            _mpvPlayer.Process?.CloseMainWindow();
            if (_isRestore && _mpvPlayer.Process?.HasExited == false)
                _mpvPlayer.Process?.Kill();//快照恢复的进程关不掉
        }
        catch (Exception ex)
        {
            _logger.Error(ex, "Dispose WallpaperManager");
            Console.WriteLine(ex.Message);
        }
    }

    internal int GetPlayIndex()
    {
        return _mpvPlayer.GetPlayIndex();
    }

    internal async Task Play()
    {
        //当前播放设置
        var playSetting = Wallpaper?.Setting;
        var playMeta = Wallpaper?.Meta;
        var playWallpaper = Wallpaper;

        if (playWallpaper == null || playSetting == null || playMeta == null)
            return;

        bool isPlaylist = playMeta.Type == WallpaperType.Playlist;

        if (isPlaylist && playMeta.Wallpapers.Count == 0)
            return;

        if (!isPlaylist && playWallpaper.FilePath == null)
            return;

        //前端可以传入多个屏幕，但是到WallpaperManger只处理一个屏幕
        uint screenIndex = playWallpaper.RunningInfo.ScreenIndexes[0];

        //是播放列表就更新当前播放的设置
        if (isPlaylist && playMeta.PlayIndex < playMeta.Wallpapers.Count())
        {
            playSetting = playMeta.Wallpapers[(int)playMeta.PlayIndex].Setting;
        }
        _mpvPlayer.ApplySetting(playSetting);

        //生成playlist.txt
        var playlist = new string[] { playWallpaper.FilePath! };
        if (isPlaylist)
        {
            playlist = playMeta.Wallpapers.Where(m => m.FilePath != null).Select(w => w.FilePath!).ToArray();
        }

        var playlistPath = Path.Combine(Path.GetTempPath(), $"playlist{screenIndex}.txt");
        File.WriteAllLines(playlistPath, playlist);

        if (!_mpvPlayer.ProcessLaunched)
        {
            await _mpvPlayer.LaunchAsync(playlistPath);
            var bounds = WallpaperApi.GetScreens()[screenIndex].Bounds;
            DesktopManager.SendHandleToDesktopBottom(_mpvPlayer.MainHandle, bounds);
        }
        else
        {
            _mpvPlayer.LoadList(playlistPath);
            _mpvPlayer.Resume();
        }

        if (IsScreenMaximized)
        {
            SetScreenMaximized(true);
        }
    }

    internal WallpaperManagerSnapshot GetSnapshotData()
    {
        return new WallpaperManagerSnapshot()
        {
            MpvPlayerSnapshot = _mpvPlayer.GetSnapshot()
        };
    }

    internal void Pause()
    {
        _mpvPlayer.Pause();

        if (Wallpaper != null)
            Wallpaper.RunningInfo.IsPaused = true;
    }

    internal void Resume()
    {
        _mpvPlayer.Resume();

        if (Wallpaper != null)
            Wallpaper.RunningInfo.IsPaused = false;
    }

    //internal void SetVolume(int volume)
    //{
    //    _mpvPlayer.SetVolume(volume);

    //    //if (Playlist != null)
    //    //    Playlist.Setting.Volume = volume;
    //}

    internal void Stop()
    {
        _mpvPlayer.Stop();
        Wallpaper = null;
    }

    internal void SetScreenMaximized(bool screenMaximized)
    {
        IsScreenMaximized = screenMaximized;
        if (IsScreenMaximized)
        {
            _currentCoveredBehavior = WallpaperApi.Settings.CoveredBehavior;
            switch (_currentCoveredBehavior)
            {
                case WallpaperCoveredBehavior.None:
                    break;
                case WallpaperCoveredBehavior.Pause:
                    _mpvPlayer.Pause();
                    break;
                case WallpaperCoveredBehavior.Stop:
                    _mpvPlayer.Stop();
                    break;
            }
        }
        else
        {
            //用户已手动暂停壁纸
            if (Wallpaper == null || Wallpaper.RunningInfo.IsPaused)
                return;
            //恢复壁纸
            switch (_currentCoveredBehavior)
            {
                case WallpaperCoveredBehavior.None:
                    break;
                case WallpaperCoveredBehavior.Pause:
                    _mpvPlayer.Resume();
                    break;
                case WallpaperCoveredBehavior.Stop:
                    _ = Play();
                    break;
            }
        }
    }

    internal void ReApplySetting()
    {
        //mpv 重新play就行了
        _ = Play();
    }

    internal double GetTimePos()
    {
        return _mpvPlayer.GetTimePos();
    }

    internal double GetDuration()
    {
        return _mpvPlayer.GetDuration();
    }

    internal void SetProgress(double progress)
    {
        _mpvPlayer.SetProgress(progress);
    }

    internal bool CheckIsPlaying(Wallpaper wallpaper)
    {
        if (Wallpaper == null)
            return false;

        if (Wallpaper.Meta.IsPlaylist())
            return Wallpaper.Meta.Wallpapers.Exists(m => m.FileUrl == wallpaper.FileUrl);
        else
            return Wallpaper.FilePath == wallpaper.FilePath;
    }

    internal Wallpaper? GetRunningWallpaper()
    {
        if (Wallpaper == null)
            return null;

        if (Wallpaper.Meta.IsPlaylist() && Wallpaper.Meta.PlayIndex < Wallpaper.Meta.Wallpapers.Count())
            return Wallpaper.Meta.Wallpapers[(int)Wallpaper.Meta.PlayIndex];

        return Wallpaper;
    }

    internal void SetVolume(uint volume)
    {
        _mpvPlayer.SetVolume(volume);
    }
}
