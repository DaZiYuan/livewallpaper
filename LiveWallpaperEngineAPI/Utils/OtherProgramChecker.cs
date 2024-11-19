using System;
using System.Collections.Generic;
using System.Diagnostics;
using System.Runtime.InteropServices;
using System.Text;
using System.Windows.Forms;
using WinAPI;

namespace DZY.WinAPI.Helpers
{
    public class OtherProgramChecker
    {
        private bool _maximized = false;
        private static int? _ignorePid;
        private readonly bool _onlyFullScreen;
        private List<Screen> _maximizedScreens;

        public OtherProgramChecker(int? currentProcess = null, bool onlyFullScreen = false)
        {
            _ignorePid = currentProcess;
            //是否只检测全屏，任务栏没遮挡不算
            _onlyFullScreen = onlyFullScreen;
        }

        public void CheckMaximized(out List<Screen> maximizedScreens)
        {
            _maximizedScreens = new List<Screen>();
            bool ok = User32Wrapper.EnumDesktopWindows(IntPtr.Zero, new User32Wrapper.EnumDelegate(EnumDesktopWindowsCallBack), IntPtr.Zero);
            maximizedScreens = _maximizedScreens;
            //return _maximized;
        }

        private bool EnumDesktopWindowsCallBack(IntPtr hWnd, int lParam)
        {
            if (_ignorePid != null)
            {
                //过滤当前进程
                int pid = User32WrapperEx.GetProcessId(hWnd);
                if (pid == _ignorePid)
                    return true;
            }

            _maximized = IsMAXIMIZED(hWnd, _onlyFullScreen);
            if (_maximized)
            {
                var screen = Screen.FromHandle(hWnd);
                if (_maximizedScreens.Contains(screen))
                    return true;

                _maximizedScreens.Add(screen);
                if (Screen.AllScreens.Length == _maximizedScreens.Count)
                    //所有屏幕都已经全屏，不用继续检查
                    return false;
                return true;
            }

            return true;
        }

        /// <summary>
        /// 窗口是否是最大化
        /// </summary>
        /// <param name="handle"></param>
        /// <returns></returns>
        public static bool IsMAXIMIZED(IntPtr handle, bool onlyFullScreen)
        {
            var className = User32Wrapper.GetClassName(handle);
            //过滤一些class，导致错误暂停视频
            string[] strings = { "Progman", "WorkerW", "Shell_TrayWnd", "DV2ControlHost" };
            if (Array.IndexOf(strings, className) >= 0)
                return false;

            WINDOWPLACEMENT placment = new WINDOWPLACEMENT();
            User32Wrapper.GetWindowPlacement(handle, ref placment);
            //_ = User32WrapperEx.GetProcessId(handle);

            bool visible = User32Wrapper.IsWindowVisible(handle);
            if (visible)
            {
                if (!onlyFullScreen && placment.showCmd == WINDOWPLACEMENTFlags.SW_SHOWMAXIMIZED)
                {//窗口最大化
                 // Exclude suspended Windows apps
                    _ = DwmapiWrapper.DwmGetWindowAttribute(handle, DwmapiWrapper.DWMWINDOWATTRIBUTE.DWMWA_CLOAKED, out var cloaked, Marshal.SizeOf<bool>());
                    //隐藏的UWP窗口
                    if (cloaked)
                    {
                        return false;
                    }
                    //System.Diagnostics.Debug.WriteLine($"pid:{pid} maximized");
                    return true;
                }

                ////判断一些隐藏窗口
                ////http://forums.codeguru.com/showthread.php?445207-Getting-HWND-of-visible-windows
                //var wl = User32Wrapper.GetWindowLong(handle, WindowLongConstants.GWL_STYLE) & WindowStyles.WS_EX_APPWINDOW;
                //if (wl <= 0)
                //    return false;

                //判断是否是游戏全屏
                User32Wrapper.GetWindowRect(handle, out var r);

                //System.Diagnostics.Debug.WriteLine($"pid:{pid} r:{r.Left} {r.Top} {r.Right} {r.Bottom} {DateTime.Now}");
                if (r.Left == 0 && r.Top == 0)
                {
                    int with = r.Right - r.Left;
                    int height = r.Bottom - r.Top;

                    if (height == Screen.PrimaryScreen.Bounds.Height
                        && with == Screen.PrimaryScreen.Bounds.Width)
                    {
                        //当前窗口最大化，进入了游戏
                        var foregroundWIndow = User32Wrapper.GetForegroundWindow();
                        if (foregroundWIndow == handle)
                        {
                            _ = User32WrapperEx.GetWindowTextEx(handle);
                            //var desktop = User32Wrapper.GetDesktopWindow();
                            if (className == "WorkerW")
                                return false;
                            return true;
                        }
                    }
                }
            }
            return false;
        }
    }
}