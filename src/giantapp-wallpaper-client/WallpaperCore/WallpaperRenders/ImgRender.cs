﻿namespace WallpaperCore.WallpaperRenders;

internal class ImgRender : BaseRender
{
    public override WallpaperType[] SupportTypes { get; protected set; } = new WallpaperType[] { WallpaperType.Img };

    internal override void Init(WallpaperManagerSnapshot? snapshot)
    {

    }

    internal override object? GetSnapshot()
    {
        return null;
    }

    internal override void Resume()
    {

    }
}
