using System;
using System.Collections.Generic;
using System.Diagnostics;
using System.Windows.Forms;
using WinAPI.Helpers;

namespace Giantapp.LiveWallpaper.Engine.Utils
{
    public class AppMaximizedEvent : EventArgs
    {
        public List<Screen>? MaximizedScreens { get; set; }
    }

    public static class MaximizedMonitor
    {
        static Process? _cp;
        static List<Screen> _maximizedScreens = new List<Screen>();

        public static List<Screen> MaximizedScreens { get => _maximizedScreens; }

        public static event EventHandler<AppMaximizedEvent>? AppMaximized;

        public static void Check()
        {
            if (_cp == null)
                _cp = Process.GetCurrentProcess();

            new DZY.WinAPI.Helpers.OtherProgramChecker(_cp.Id).CheckMaximized(out List<Screen> fullscreenWindow);
            if (_maximizedScreens.Count == fullscreenWindow.Count)
                return;

            _maximizedScreens = fullscreenWindow;

            AppMaximized?.Invoke(null, new AppMaximizedEvent()
            {
                MaximizedScreens = _maximizedScreens
            });
        }
    }
}
