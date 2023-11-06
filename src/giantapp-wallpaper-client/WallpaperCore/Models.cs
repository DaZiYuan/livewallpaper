﻿using Newtonsoft.Json;

namespace WallpaperCore;

/// <summary>
/// 2.x用的
/// </summary>
public class V2GroupProjectInfo
{
    public V2GroupProjectInfo()
    {

    }
    public V2GroupProjectInfo(V2ProjectInfo? info)
    {
        ID = info?.ID;
        LocalID = info?.LocalID;
    }

    public string? ID { get; set; }
    public string? LocalID { get; set; }
}

/// <summary>
/// 2.x用的
/// </summary>
public class V2ProjectInfo
{
    public List<V2GroupProjectInfo>? GroupItems { get; set; }
    public string? ID { get; set; }
    public string? LocalID { get; set; }
    public string? Description { get; set; }
    public string? Title { get; set; }
    public string? File { get; set; }
    public string? Preview { get; set; }
    /// <summary>
    /// group，分组
    /// null，壁纸
    /// </summary>
    public string? Type { get; set; }
    public string? Visibility { get; set; }
    public List<string>? Tags { get; set; }
}

/// <summary>
/// 壁纸的描述数据
/// </summary>
public class WallpaperMeta
{
    public string? Title { get; set; }
    public string? Description { get; set; }
    public string? Author { get; set; }
    public string? AuthorId { get; set; }
    public DateTime? CreateTime { get; set; }
    public DateTime? UpdateTime { get; set; }
}

public class PlaylistMeta : WallpaperMeta
{

}

/// <summary>
/// playlist的设置
/// </summary>
public class PlaylistSetting
{

}

//一个壁纸的设置
public class WallpaperSetting
{

}

/// <summary>
/// 表示一个壁纸
/// </summary>
public class Wallpaper
{
    //描述数据
    public WallpaperMeta? Meta { get; set; }

    //设置
    public WallpaperSetting? Setting { get; set; }

    //本地绝对路径
    public string? LocalAbsolutePath { get; set; }

    public void LoadMeta(string filePath)
    {
        try
        {
            // 同目录包含[文件名].meta.json 的
            string dir = Path.GetDirectoryName(filePath) ?? string.Empty;
            string fileName = Path.GetFileNameWithoutExtension(filePath);
            string metaJsonFile = Path.Combine(dir, $"{fileName}.meta.json");
            string projectJsonFile = Path.Combine(dir, "project.json");
            if (File.Exists(metaJsonFile))
            {
                var metaJson = JsonConvert.DeserializeObject<WallpaperMeta>(File.ReadAllText(metaJsonFile));
                Meta = metaJson;
            }
            else if (File.Exists(projectJsonFile))
            {
                //包含 project.json
                //迁移数据到meta.json
                var projectJson = JsonConvert.DeserializeObject<V2ProjectInfo>(File.ReadAllText(projectJsonFile));
                if (projectJson != null)
                {
                    var meta = new WallpaperMeta
                    {
                        Title = projectJson.Title,
                        Description = projectJson.Description,
                    };
                    Meta = meta;
                    File.WriteAllText(metaJsonFile, JsonConvert.SerializeObject(meta));
                }
            }
        }
        catch (Exception ex)
        {
            WallpaperApi.Logger?.Warn($"加载壁纸描述数据失败：{filePath} ${ex}");
        }
    }

    public void LoadSetting(string filePath)
    {
        try
        {
            // 同目录包含[文件名].setting.json 的
            string dir = Path.GetDirectoryName(filePath) ?? string.Empty;
            string fileName = Path.GetFileNameWithoutExtension(filePath);
            string settingJsonFile = Path.Combine(dir, $"{fileName}.setting.json");
            if (File.Exists(settingJsonFile))
            {
                var settingJson = JsonConvert.DeserializeObject<WallpaperSetting>(File.ReadAllText(settingJsonFile));
                Setting = settingJson;
            }
        }
        catch (Exception ex)
        {
            WallpaperApi.Logger?.Warn($"加载壁纸设置失败：{filePath} ${ex}");
        }
    }

    public static Wallpaper From(string filePath, bool loadMeta = true, bool loadSetting = true)
    {
        var data = new Wallpaper
        {
            LocalAbsolutePath = filePath
        };

        if (loadMeta)
            data.LoadMeta(filePath);

        if (loadSetting)
            data.LoadSetting(filePath);
        return data;
    }
}

/// <summary>
/// 播放列表
/// </summary>
public class Playlist
{
    //描述数据
    public PlaylistMeta? Meta { get; set; }

    //设置
    public PlaylistSetting? Setting { get; set; }

    //播放列表内的壁纸
    public Wallpaper[] Wallpapers { get; set; } = new Wallpaper[0];
}

