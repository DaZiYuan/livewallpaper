import { ApiResult } from "./types";

class Shell {
  async showFolderDialog(): Promise<ApiResult<string>> {
    try {
      if (!window.chrome.webview) return { error: "no webview", data: null };
      const { shell } = window.chrome.webview.hostObjects;
      let res = await shell.ShowFolderDialog();
      return { error: null, data: res };
    } catch (e) {
      console.log(e);
      return { error: e, data: null };
    }
  }

  hideLoading() {
    if (!window.chrome.webview) return;
    const { shell } = window.chrome.webview.hostObjects;
    shell.HideLoading();
  }
}

const shellApi = new Shell();

export default shellApi;
