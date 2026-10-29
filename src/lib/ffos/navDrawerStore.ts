import { create } from "zustand";

interface NavDrawerState {
  isOpen: boolean;
  openDrawer: () => void;
  closeDrawer: () => void;
  toggleDrawer: () => void;
}

// Global state for opening and closing the hamburger navigation drawer across all views
let drawerListener: ((open: boolean) => void) | null = null;
let currentOpenState = false;

export function setNavDrawerListener(listener: ((open: boolean) => void) | null) {
  drawerListener = listener;
}

export function openNavDrawer() {
  currentOpenState = true;
  if (drawerListener) {
    drawerListener(true);
  }
}

export function closeNavDrawer() {
  currentOpenState = false;
  if (drawerListener) {
    drawerListener(false);
  }
}

export function toggleNavDrawer() {
  currentOpenState = !currentOpenState;
  if (drawerListener) {
    drawerListener(currentOpenState);
  }
}

export function isNavDrawerOpen() {
  return currentOpenState;
}
