interface API {
  GetConfig(key: string): Promise<string>;
  SetConfig(key: string, value: string);
  addEventListener(type: string, listener: (e: any) => void);
}

interface Shell {
  ShowFolderDialog(): Promise<string>;
}

interface Window {
  chrome: {
    webview: {
      hostObjects: {
        sync: {
          api: API;
          shell: Shell;
        };
        api: API;
        shell: Shell;
      };
    };
  };
}
