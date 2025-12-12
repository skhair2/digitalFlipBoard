import React from 'react';
import { useModeStore } from '../store/modeStore';
import ModeSelector from './ModeSelector';

/**
 * ModeLayout - Wraps the app and shows either Display, Controller, or Mode Selection
 * This is the main router between the two modes
 */
export default function ModeLayout({ displayComponent, controllerComponent }) {
  const mode = useModeStore((state) => state.mode);

  // Show mode selector if no mode selected
  if (!mode) {
    return <ModeSelector />;
  }

  // Show Display mode
  if (mode === 'display') {
    return displayComponent;
  }

  // Show Controller mode
  if (mode === 'controller') {
    return controllerComponent;
  }

  return null;
}
