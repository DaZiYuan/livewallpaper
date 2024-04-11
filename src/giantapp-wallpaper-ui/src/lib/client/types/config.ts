import { i18n, Locale } from "@/i18n-config";
import { VideoPlayer } from "./wallpaper";

export type ConfigAppearance = {
  theme: string;
  mode: "system" | "light" | "dark";
};

export type ConfigGeneral = {
  autoStart: boolean;
  hideWindow: boolean;
  currentLan: Locale;
};

export enum WallpaperCoveredBehavior {
  //不做任何处理
  None,
  //暂停播放
  Pause,
  //停止播放
  Stop
}

export type ConfigWallpaper = {
  directories: string[];
  // keepWallpaper: boolean;
  coveredBehavior: WallpaperCoveredBehavior;
  defaultVideoPlayer: VideoPlayer;
};
