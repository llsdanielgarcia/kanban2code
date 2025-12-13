import type { SidebarProvider } from './SidebarProvider';

let sidebarProvider: SidebarProvider | null = null;

export function setSidebarProvider(provider: SidebarProvider | null) {
  sidebarProvider = provider;
}

export function getSidebarProvider(): SidebarProvider | null {
  return sidebarProvider;
}

