export {};

type ClickbookDesktopWindowState = {
  focused: boolean;
  maximized: boolean;
  fullscreen: boolean;
};

type ClickbookDesktopAppInfo = {
  name: string;
  version: string;
  packaged: boolean;
  platform: NodeJS.Platform;
  defaultUrl: string;
};

declare global {
  interface Window {
    clickbookDesktop?: {
      isDesktop: true;
      platform: NodeJS.Platform;
      minimize: () => Promise<void>;
      toggleMaximize: () => Promise<boolean>;
      close: () => Promise<void>;
      isMaximized: () => Promise<boolean>;
      openExternal: (url: string) => Promise<boolean>;
      reload: () => Promise<boolean>;
      goHome: () => Promise<boolean>;
      getAppInfo: () => Promise<ClickbookDesktopAppInfo>;
      onWindowState: (callback: (state: ClickbookDesktopWindowState) => void) => () => void;
    };
  }
}
