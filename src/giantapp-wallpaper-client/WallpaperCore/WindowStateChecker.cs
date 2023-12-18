﻿//# define PrintInfo
#if PrintInfo
using System.Runtime.InteropServices;
#endif
using System.Timers;
using Windows.Win32;
using Windows.Win32.Foundation;

namespace WallpaperCore;

public class WindowStateChecker
{
    #region private fields
    private readonly System.Timers.Timer? _timer;
    private readonly Dictionary<string, WindowState> _cacheScreenState = new();
    private List<IntPtr> _checkHandles = new();//等待检查的窗口
    #endregion

    public WindowStateChecker()
    {
        _timer = new(1000);
        _timer.Elapsed += CheckWindowState; // 每秒调用一次CheckWindowState方法
        _checkHandles = GetAllMaximizedWindow();
    }

    #region properties
    public static WindowStateChecker Instance { get; } = new();
    // 定义一个枚举类型，表示窗口的状态
    public enum WindowState
    {
        Maximized,
        NotMaximized
    }
    public event Action<WindowState, Screen>? WindowStateChanged;
    #endregion

    #region private
    private List<IntPtr> GetAllMaximizedWindow()
    {
        var list = new List<IntPtr>();
        PInvoke.EnumWindows(new Windows.Win32.UI.WindowsAndMessaging.WNDENUMPROC((tophandle, topparamhandle) =>
        {       
            if (IsWindowMaximized(tophandle))
            {
                list.Add(tophandle);
            }

            return true;
        }), IntPtr.Zero);
        return list;
    }

    private static string GetClassName(HWND tophandle)
    {
        const int bufferSize = 256;
        string className;
        unsafe
        {
            fixed (char* classNameChars = new char[bufferSize])
            {
                PInvoke.GetClassName(tophandle, classNameChars, bufferSize);
                className = new(classNameChars);
            }
        }
        return className;
    }

    private void CheckWindowState(object source, ElapsedEventArgs e)
    {
        _timer?.Stop();

        if (WindowStateChanged != null)
        {
            //把当前窗口加入到检查列表
            var hWnd = PInvoke.GetForegroundWindow();
            if (!_checkHandles.Contains(hWnd))
                _checkHandles.Add(hWnd);

            //临时检查列表
            var tmpCheckHandles = new List<IntPtr>();
            //当前屏幕状态，默认没有最大化
            Dictionary<Screen, WindowState> _tmpCurrentScreenState = new();
            foreach (var item in Screen.AllScreens)
                _tmpCurrentScreenState.Add(item, WindowState.NotMaximized);
            //遍历检查列表
            foreach (var item in _checkHandles)
            {
                WindowState state = IsWindowMaximized(item) ? WindowState.Maximized : WindowState.NotMaximized;
                //只保留有遮挡的屏幕数据
                if (state == WindowState.Maximized && !tmpCheckHandles.Contains(item))
                    tmpCheckHandles.Add(item);
                _tmpCurrentScreenState[Screen.FromHandle(item)] = state;
            }
            _checkHandles = tmpCheckHandles;

            //更新数据
            foreach (var item in _tmpCurrentScreenState)
            {
                var screen = item.Key;
                var screenName = screen.DeviceName;
                var state = item.Value;
                if (!_cacheScreenState.TryGetValue(screenName, out var previousState) || state != previousState)
                {
                    WindowStateChanged.Invoke(state, screen);
                    _cacheScreenState[screenName] = state;
                }
            }
        }

        _timer?.Start();
    }
    #endregion

    public static bool IsWindowMaximized(IntPtr hWnd)
    {
        HWND handle = new(hWnd);
        //判断窗口是否可见
        if (!PInvoke.IsWindowVisible(handle))
        {
            return false;
        }

        //判断UWP程序是否可见
        int cloakedVal;
        unsafe
        {
            PInvoke.DwmGetWindowAttribute(handle, Windows.Win32.Graphics.Dwm.DWMWINDOWATTRIBUTE.DWMWA_CLOAKED, &cloakedVal, sizeof(int));
        }

        if (cloakedVal != 0)
        {
            return false;
        }

        //过滤掉一些不需要的窗口
        string className = GetClassName(handle);
        string[] ignoreClass = new string[] { "WorkerW", "Progman" };
        if (ignoreClass.Contains(className))
        {
            return false;
        }

#if PrintInfo
        int bufferSize = PInvoke.GetWindowTextLength(handle) + 1;
        string windowName;
        unsafe
        {
            fixed (char* windowNameChars = new char[bufferSize])
            {
                if (PInvoke.GetWindowText(handle, windowNameChars, bufferSize) == 0)
                {
                    int errorCode = Marshal.GetLastWin32Error();
                }

                windowName = new(windowNameChars);
            }
        }
#endif

        if (PInvoke.IsZoomed(handle))
        {
#if PrintInfo
            System.Diagnostics.Debug.WriteLine($"{handle},{windowName},{className} is IsZoomed");
#endif
            return true;
        }
        else
        {
            //屏幕几乎遮挡完桌面，也认为是最大化
            PInvoke.GetWindowRect(handle, out var rect);
            var screen = Screen.FromHandle(hWnd);
            double? windowArea = rect.Width * rect.Height;
            double? screenArea = screen.Bounds.Width * screen.Bounds.Height;
            var tmp = windowArea / screenArea >= 0.9;

#if PrintInfo
            if (tmp)
            {
                System.Diagnostics.Debug.WriteLine($"{handle.Value},{windowName} windowArea,{className} {rect.X},{rect.Y},{rect.Width},{rect.Height}");
                System.Diagnostics.Debug.WriteLine($"{handle.Value},{windowName} screenArea,{className} , {screen.DeviceName},{screen.Bounds.Width},{screen.Bounds.Height}");
                System.Diagnostics.Debug.WriteLine($"{handle.Value},{windowName},{className} IsZoomed: {windowArea / screenArea}, {tmp}");
            }
#endif
            return tmp;
        }
    }

    public void Start()
    {
        _timer?.Start(); // 开始定时器
    }

    public void Stop()
    {
        _timer?.Stop(); // 停止定时器
        _cacheScreenState.Clear();
    }
}
