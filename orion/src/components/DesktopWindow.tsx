/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { createPortal } from 'react-dom';
import { X, Minimize2, Maximize2 } from 'lucide-react';

interface DesktopWindowProps {
  id: string;
  title: string;
  onClose?: () => void;
  onMinimize?: () => void;
  isMinimized?: boolean;
  isActive?: boolean;
  onFocus?: () => void;
  defaultPosition?: { x: number; y: number };
  defaultSize?: { width: number; height: number };
  children: React.ReactNode;
  motionStyle?: React.CSSProperties;
}

export default function DesktopWindow({
  id,
  title,
  onClose,
  onMinimize,
  isMinimized = false,
  isActive = false,
  onFocus,
  defaultPosition = { x: 50, y: 50 },
  defaultSize = { width: 500, height: 400 },
  children,
  motionStyle,
}: DesktopWindowProps) {
  const [position, setPosition] = useState(defaultPosition);
  const [size, setSize] = useState(defaultSize);
  const [isMaximized, setIsMaximized] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });

  if (isMinimized) return null;

  const handlePointerDown = (e: React.PointerEvent<HTMLDivElement>) => {
    if (isMaximized) return;
    onFocus?.();
    
    // Check if the click happened on the header title or handle, not a button
    const target = e.target as HTMLElement;
    if (target.closest('.window-control-btn') || motionStyle) return;

    setIsDragging(true);
    setDragOffset({
      x: e.clientX - position.x,
      y: e.clientY - position.y,
    });
    
    // Set pointer capture to receive events even if the pointer moves outside the window
    e.currentTarget.setPointerCapture(e.pointerId);
  };

  const handlePointerMove = (e: React.PointerEvent<HTMLDivElement>) => {
    if (!isDragging || motionStyle) return;
    
    // Clamp coordinates to prevent dragging completely out of screen bounds
    const newX = Math.max(0, Math.min(window.innerWidth - 150, e.clientX - dragOffset.x));
    const newY = Math.max(0, Math.min(window.innerHeight - 100, e.clientY - dragOffset.y));
    
    setPosition({ x: newX, y: newY });
  };

  const handlePointerUp = (e: React.PointerEvent<HTMLDivElement>) => {
    if (isDragging) {
      setIsDragging(false);
      e.currentTarget.releasePointerCapture(e.pointerId);
    }
  };

  const windowContent = (
    <div
      id={`desktop-window-${id}`}
      onPointerDown={() => onFocus?.()}
      className={`absolute flex flex-col rounded-xl border backdrop-blur-md shadow-xl transition-all duration-200 ${
        isActive 
          ? 'bg-[#FFFFFF]/95 dark:bg-[#1C211E]/95 border-[#A88B62] dark:border-[#C4A57B]/70 shadow-[0_8px_30px_rgba(37,41,35,0.12)] z-30' 
          : 'bg-[#FFFFFF]/85 dark:bg-[#1C211E]/80 border-[#E5E5DD] dark:border-[#2B332E] shadow-[0_4px_20px_rgba(37,41,35,0.06)] z-20 hover:border-[#D3D3C9] dark:hover:border-[#3B463F]'
      } ${motionStyle ? '' : 'transition-all'} pointer-events-auto`}
      style={{
        width: isMaximized ? '100%' : `${size.width}px`,
        height: isMaximized ? '100%' : `${size.height}px`,
        ...(isMaximized ? {
          left: 0,
          top: 0,
          transform: 'none',
          position: 'absolute',
          zIndex: 9999,
          filter: 'none',
          opacity: 1
        } : {
          left: motionStyle ? undefined : `${position.x}px`,
          top: motionStyle ? undefined : `${position.y}px`,
          ...motionStyle,
        })
      }}
    >
      {/* Window Header */}
      <div
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
        className={`flex h-11 select-none items-center justify-between rounded-t-xl px-4 font-display text-[11px] font-semibold tracking-wider cursor-move border-b transition-colors duration-150 ${
          isActive 
            ? 'bg-[#F6F5F0] dark:bg-[#232A26] text-[#252923] dark:text-[#E5E9E4] border-[#E5E5DD] dark:border-[#2B332E]' 
            : 'bg-[#FAFAF7] dark:bg-[#1E2320] text-[#777B70] dark:text-[#8F998E] border-[#E5E5DD] dark:border-[#2B332E]'
        }`}
      >
        <div className="flex items-center gap-2 select-none">
          <span 
            className={`w-2 h-2 rounded-full transition-colors ${
              isActive 
                ? 'bg-[#A88B62] shadow-[0_0_6px_rgba(168,139,98,0.5)]' 
                : 'bg-[#D3D3C9] dark:bg-[#3B463F]'
            }`} 
          />
          <span className="uppercase tracking-[0.12em] font-medium">{title}</span>
        </div>

        {/* Control Buttons */}
        <div className="flex items-center gap-1">
          {onMinimize && (
            <button
              onClick={(e) => { e.stopPropagation(); onMinimize(); }}
              className="window-control-btn rounded p-1 text-[#777B70] hover:text-[#252923] dark:hover:text-white hover:bg-[#E5E5DD]/60 dark:hover:bg-[#2E3731] transition-colors"
              title="Minimize to Dock"
              aria-label="Minimize"
            >
              <Minimize2 className="h-3.5 w-3.5" />
            </button>
          )}
          <button
            onClick={(e) => { e.stopPropagation(); setIsMaximized(!isMaximized); }}
            className="window-control-btn rounded p-1 text-[#777B70] hover:text-[#252923] dark:hover:text-white hover:bg-[#E5E5DD]/60 dark:hover:bg-[#2E3731] transition-colors"
            title={isMaximized ? "Restore Window" : "Maximize Window"}
            aria-label={isMaximized ? "Restore" : "Maximize"}
          >
            <Maximize2 className="h-3.5 w-3.5" />
          </button>
          {onClose && (
            <button
              onClick={(e) => { e.stopPropagation(); onClose(); }}
              className="window-control-btn rounded p-1 text-[#777B70] hover:text-[#B94A48] hover:bg-[#B94A48]/10 transition-colors"
              title="Close Panel"
              aria-label="Close"
            >
              <X className="h-3.5 w-3.5" />
            </button>
          )}
        </div>
      </div>

      {/* Window Body */}
      <div className="flex-1 overflow-auto p-4 select-text text-[#252923] dark:text-[#E5E9E4]">
        {children}
      </div>
    </div>
  );

  if (isMaximized) {
    const portalElement = document.getElementById('maximized-window-portal');
    if (portalElement) {
      return createPortal(windowContent, portalElement);
    }
  }

  return windowContent;
}
