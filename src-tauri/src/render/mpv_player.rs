use crate::utils::windows::find_window_handle;
use std::io;
use std::process::{Child, Command};
use tokio::net::windows::named_pipe;
use uuid::Uuid;
use windows::Win32::Foundation::HWND;

pub struct MpvPlayerOption {
    pipe_name: String,
    pub stop_screen_saver: bool,
    pub hwdec: String, //no/auto
    pub pan_scan: bool,
    pub loop_file: bool,
    pub volume: u8,
}
pub struct MpvPlayer {
    pub option: MpvPlayerOption,
    process: Option<Child>,
}

impl MpvPlayerOption {
    pub fn new() -> Self {
        Self {
            pipe_name: format!(r"\\.\pipe\{}", Uuid::new_v4().to_string()),
            stop_screen_saver: false,
            hwdec: "auto".to_string(),
            pan_scan: true,
            loop_file: true,
            volume: 0,
        }
    }
}

impl MpvPlayer {
    pub fn new() -> Self {
        Self {
            option: MpvPlayerOption::new(),
            process: None,
        }
    }

    pub async fn launch(&mut self, path: Option<String>) {
        let mut args: Vec<String> = vec![];
        args.push(format!(
            "--stop-screensaver={}",
            if self.option.stop_screen_saver {
                "yes"
            } else {
                "no"
            }
        ));

        args.push(format!(
            "--panscan={}",
            if self.option.pan_scan { "1.0" } else { "0.0" }
        ));

        args.push(format!(
            "--loop-file={}",
            if self.option.loop_file { "inf" } else { "no" }
        ));

        args.push(format!("--volume={}", self.option.volume));

        args.push(format!("--hwdec={}", self.option.hwdec));

        args.push(format!(r"--input-ipc-server={}", self.option.pipe_name));
        if path.is_some() {
            args.push(format!("{}", path.unwrap()));
        }
        println!("args:{:?}", args);

        self.process = Some(
            Command::new("resources\\mpv\\mpv.exe")
                .args(args)
                .spawn()
                .expect("failed to launch mpv"),
        );
        let pid = self.process.as_ref().unwrap().id();
        let handle = tokio::spawn(async move {
            let mut window_handle = HWND(0);
            let expire_time = tokio::time::Instant::now() + tokio::time::Duration::from_secs(5);
            while window_handle.0 == 0 && tokio::time::Instant::now() < expire_time {
                window_handle = find_window_handle(pid, false);
                tokio::time::sleep(tokio::time::Duration::from_millis(1)).await;
                println!("wait window_handle");
            }
            println!("pid {} , {}", pid, window_handle.0);
            return window_handle;
        });

        let pipe_name = self.option.pipe_name.clone();

        //读取mpv管道
        tokio::spawn(async move {
            let client = named_pipe::ClientOptions::new().open(pipe_name).unwrap();

            let mut msg = vec![0; 1024];

            loop {
                // Wait for the pipe to be readable
                println!("GOT = {:?}", String::from_utf8(msg.clone()));
                //buffer to string
                client.readable().await.unwrap();

                // Try to read data, this may still fail with `WouldBlock`
                // if the readiness event is a false positive.
                match client.try_read(&mut msg) {
                    Ok(n) => {
                        msg.truncate(n);
                        continue;
                    }
                    Err(e) if e.kind() == io::ErrorKind::WouldBlock => {
                        println!("error = {:?}", e);
                        continue;
                    }
                    Err(e) => {
                        println!("error = {:?}", e);
                        continue;
                    }
                }
            }
        });

        let window_handle: HWND = handle.await.unwrap();

        println!("show {}", window_handle.0);
    }

    pub async fn play(&mut self, path: String) {
        let mut args: Vec<String> = vec![];
        args.push(format!("loadfile \"{}\"", path));
        println!("args:{:?}", args);
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[tokio::test]
    async fn test_launch() {
        let mut mpv_player = MpvPlayer::new();
        mpv_player.launch(None).await;
        println!("test_launch");
        mpv_player.process.unwrap().kill().unwrap();
        println!("test_launch end")
    }

    #[tokio::test]
    async fn test_launch_with_video() {
        let mut mpv_player = MpvPlayer::new();

        mpv_player
            .launch(Some("resources\\wallpaper_samples\\video.mp4".to_string()))
            .await;
        println!("test_launch_with_video");
        tokio::time::sleep(tokio::time::Duration::from_secs(2)).await;
        mpv_player.process.unwrap().kill().unwrap();
        println!("test_launch_with_video end")
    }

    #[tokio::test]
    async fn test_set_video() {
        let mut mpv_player = MpvPlayer::new();
        mpv_player.launch(None).await;
        println!("test_set_video");
        tokio::time::sleep(tokio::time::Duration::from_secs(2)).await;
        mpv_player
            .play("resources\\wallpaper_samples\\video.mp4".to_string())
            .await;
        tokio::time::sleep(tokio::time::Duration::from_secs(200)).await;
        // mpv_player.process.unwrap().kill().unwrap();
        println!("test_set_video end")
    }
}
