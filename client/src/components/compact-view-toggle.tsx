import React from 'react';
import { LayoutDashboard, LayoutGrid } from 'lucide-react';
import { Button } from "@/components/ui/button";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { Switch } from "@/components/ui/switch";

interface CompactViewToggleProps {
  isCompact: boolean;
  onToggle: (isCompact: boolean) => void;
}

export default function CompactViewToggle({ isCompact, onToggle }: CompactViewToggleProps) {
  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <div className="flex items-center gap-2">
            <Switch 
              checked={isCompact}
              onCheckedChange={onToggle} 
              id="compact-view"
            />
            <label 
              htmlFor="compact-view" 
              className="text-sm cursor-pointer hidden sm:inline"
            >
              Visualização Compacta
            </label>
            <span className="inline sm:hidden">
              {isCompact ? (
                <LayoutGrid size={18} />
              ) : (
                <LayoutDashboard size={18} />
              )}
            </span>
          </div>
        </TooltipTrigger>
        <TooltipContent>
          <p>Alternar entre visualização normal e compacta</p>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}