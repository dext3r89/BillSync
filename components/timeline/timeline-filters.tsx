"use client";

import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Calendar } from "@/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { CalendarIcon, Filter, X } from "lucide-react";
import { format } from "date-fns";
import type { Matter } from "@/lib/types";

interface TimelineFiltersProps {
  matters: Matter[];
  selectedDate: Date | undefined;
  onDateChange: (date: Date | undefined) => void;
  selectedMatter: string;
  onMatterChange: (matterId: string) => void;
  selectedActivityType: string;
  onActivityTypeChange: (type: string) => void;
  selectedBillable: string;
  onBillableChange: (billable: string) => void;
  onClearFilters: () => void;
}

export function TimelineFilters({
  matters,
  selectedDate,
  onDateChange,
  selectedMatter,
  onMatterChange,
  selectedActivityType,
  onActivityTypeChange,
  selectedBillable,
  onBillableChange,
  onClearFilters,
}: TimelineFiltersProps) {
  const hasFilters =
    selectedDate ||
    selectedMatter !== "all" ||
    selectedActivityType !== "all" ||
    selectedBillable !== "all";

  return (
    <div className="rounded-xl border border-border bg-card p-4">
      <div className="flex items-center gap-2 mb-4">
        <Filter className="h-4 w-4 text-muted-foreground" />
        <span className="text-sm font-medium text-foreground">Filters</span>
        {hasFilters && (
          <Button
            variant="ghost"
            size="sm"
            className="ml-auto h-7 text-xs text-muted-foreground"
            onClick={onClearFilters}
          >
            <X className="mr-1 h-3 w-3" />
            Clear all
          </Button>
        )}
      </div>

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        {/* Date Filter */}
        <Popover>
          <PopoverTrigger asChild>
            <Button
              variant="outline"
              className="justify-start text-left font-normal"
            >
              <CalendarIcon className="mr-2 h-4 w-4" />
              {selectedDate ? format(selectedDate, "MMM d, yyyy") : "Select date"}
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-auto p-0" align="start">
            <Calendar
              mode="single"
              selected={selectedDate}
              onSelect={onDateChange}
              initialFocus
            />
          </PopoverContent>
        </Popover>

        {/* Matter Filter */}
        <Select value={selectedMatter} onValueChange={onMatterChange}>
          <SelectTrigger>
            <SelectValue placeholder="All Matters" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Matters</SelectItem>
            {matters.map((matter) => (
              <SelectItem key={matter.id} value={matter.id}>
                {matter.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        {/* Activity Type Filter */}
        <Select value={selectedActivityType} onValueChange={onActivityTypeChange}>
          <SelectTrigger>
            <SelectValue placeholder="All Types" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Types</SelectItem>
            <SelectItem value="email">Email</SelectItem>
            <SelectItem value="document">Document</SelectItem>
            <SelectItem value="meeting">Meeting</SelectItem>
            <SelectItem value="call">Phone Call</SelectItem>
            <SelectItem value="research">Research</SelectItem>
            <SelectItem value="court">Court</SelectItem>
            <SelectItem value="other">Other</SelectItem>
          </SelectContent>
        </Select>

        {/* Billable Filter */}
        <Select value={selectedBillable} onValueChange={onBillableChange}>
          <SelectTrigger>
            <SelectValue placeholder="All Entries" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Entries</SelectItem>
            <SelectItem value="true">Billable Only</SelectItem>
            <SelectItem value="false">Non-billable Only</SelectItem>
          </SelectContent>
        </Select>
      </div>
    </div>
  );
}
