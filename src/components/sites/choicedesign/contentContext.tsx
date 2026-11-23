"use client";

import { createContext, useContext, type ReactNode } from "react";
import siteDefaults from "./siteContent.json";

export type SiteContent = typeof siteDefaults;

// 默认值用打包内的 JSON：即使没有 Provider（例如客户端单独渲染）也不会报错
const SiteContentContext = createContext<SiteContent>(siteDefaults);

export function SiteContentProvider({
  value,
  children,
}: {
  value: SiteContent;
  children: ReactNode;
}) {
  return (
    <SiteContentContext.Provider value={value}>
      {children}
    </SiteContentContext.Provider>
  );
}

export function useSiteContent(): SiteContent {
  return useContext(SiteContentContext);
}
