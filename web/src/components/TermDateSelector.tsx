"use client";

import { useState } from "react";
import { format } from "date-fns";
import { CalendarIcon } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import LiquidGlass from "@/components/LiquidGlass";

interface TermDateSelectorProps {
  date: Date | undefined;
  onDateChange: (date: Date | undefined) => void;
}

const TermDateSelector = ({ date, onDateChange }: TermDateSelectorProps) => {
  const [open, setOpen] = useState(false);

  return (
    <div className="space-y-3">
      <h3 className="text-sm font-medium text-muted-foreground uppercase tracking-wider px-1">
        Term End Date
      </h3>
      <LiquidGlass intensity="sm" className="liquid-glass-interactive">
        <Popover open={open} onOpenChange={setOpen}>
          <PopoverTrigger asChild>
            <Button
              variant="ghost"
              className={cn(
                "w-full justify-start text-left font-normal rounded-[1.5rem] h-12 border-none bg-transparent hover:bg-transparent transition-all",
                !date && "text-muted-foreground"
              )}
            >
              <CalendarIcon className="mr-3 h-4 w-4 text-primary" />
              {date ? format(date, "EEEE, MMMM d, yyyy") : "Select the last day of the term"}
            </Button>
          </PopoverTrigger>
          <PopoverContent
            className="w-auto p-0 glass-panel rounded-2xl border-border/30"
            align="start"
          >
            <Calendar
              mode="single"
              selected={date}
              onSelect={(d) => {
                onDateChange(d);
                setOpen(false);
              }}
              initialFocus
              className={cn("p-3 pointer-events-auto")}
            />
          </PopoverContent>
        </Popover>
      </LiquidGlass>
    </div>
  );
};

export default TermDateSelector;
