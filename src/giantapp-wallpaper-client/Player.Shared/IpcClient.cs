﻿using NLog;
using System;
using System.Collections.Generic;
using System.Diagnostics;
using System.IO.Pipes;
using System.Text;
using System.Text.Json;

namespace Player.Shared;

public class IpcClient : IDisposable
{
    private static readonly Logger _logger = LogManager.GetCurrentClassLogger();
    private readonly string _serverName;

    public IpcClient(string serverName)
    {
        _serverName = serverName;
    }

    public void Dispose()
    {
    }

    public IpcPayload? Send(IpcPayload ipcPayload)
    {
        string sendContent = "";
        try
        {
            sendContent = JsonSerializer.Serialize(ipcPayload) + "\n";
            using NamedPipeClientStream pipeClient = new(_serverName);
            pipeClient.Connect(0); // 连接超时时间

            if (pipeClient.IsConnected)
            {
                byte[] commandBytes = Encoding.UTF8.GetBytes(sendContent);
                pipeClient.Write(commandBytes, 0, commandBytes.Length);

                // 读取响应
                byte[] buffer = new byte[4096];
                int bytesRead = pipeClient.Read(buffer, 0, buffer.Length);

                // 将字节数组转换为字符串
                string response = Encoding.UTF8.GetString(buffer, 0, bytesRead);
                //减少打印
                //if (!sendContent.Contains("duration") && !sendContent.Contains("time-pos"))
                //{
                //_logger.Info(sendContent + "mpv response: " + response);
                Debug.WriteLine(sendContent + "mpv response: " + response);
                //}
                if (string.IsNullOrEmpty(response))
                    return null;
                var res = JsonSerializer.Deserialize<IpcPayload>(response);
                return res;
            }
            else
            {
                _logger.Warn("Failed to connect to mpv.");
                return null;
            }
        }
        catch (Exception ex)
        {
            _logger.Warn(ex, sendContent + "Failed to get mpv info.");
            return null;
        }
    }
}
