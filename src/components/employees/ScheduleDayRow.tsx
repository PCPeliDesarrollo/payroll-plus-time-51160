import { Switch } from "@/components/ui/switch";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Plus, X } from "lucide-react";

export interface DaySchedule {
  is_working_day: boolean;
  check_in_time: string;
  check_out_time: string;
  check_in_time_2: string;
  check_out_time_2: string;
}

export const DAYS_OF_WEEK = [
  { value: 1, label: 'Lunes' },
  { value: 2, label: 'Martes' },
  { value: 3, label: 'Miércoles' },
  { value: 4, label: 'Jueves' },
  { value: 5, label: 'Viernes' },
  { value: 6, label: 'Sábado' },
  { value: 0, label: 'Domingo' },
];

export const DEFAULT_SCHEDULES: Record<number, DaySchedule> = {
  1: { is_working_day: true, check_in_time: '09:00', check_out_time: '14:00', check_in_time_2: '17:00', check_out_time_2: '20:00' },
  2: { is_working_day: true, check_in_time: '09:00', check_out_time: '14:00', check_in_time_2: '17:00', check_out_time_2: '20:00' },
  3: { is_working_day: true, check_in_time: '09:00', check_out_time: '14:00', check_in_time_2: '17:00', check_out_time_2: '20:00' },
  4: { is_working_day: true, check_in_time: '09:00', check_out_time: '14:00', check_in_time_2: '17:00', check_out_time_2: '20:00' },
  5: { is_working_day: true, check_in_time: '09:00', check_out_time: '14:00', check_in_time_2: '17:00', check_out_time_2: '20:00' },
  6: { is_working_day: false, check_in_time: '09:00', check_out_time: '14:00', check_in_time_2: '', check_out_time_2: '' },
  0: { is_working_day: false, check_in_time: '09:00', check_out_time: '14:00', check_in_time_2: '', check_out_time_2: '' },
};

interface ScheduleDayRowProps {
  dayValue: number;
  dayLabel: string;
  schedule: DaySchedule;
  onUpdate: (day: number, field: keyof DaySchedule, value: string | boolean) => void;
}

export function ScheduleDayRow({ dayValue, dayLabel, schedule, onUpdate }: ScheduleDayRowProps) {
  const hasAfternoon = schedule.check_in_time_2 !== '' || schedule.check_out_time_2 !== '';

  const addAfternoon = () => {
    onUpdate(dayValue, 'check_in_time_2', '17:00');
    onUpdate(dayValue, 'check_out_time_2', '20:00');
  };

  const removeAfternoon = () => {
    onUpdate(dayValue, 'check_in_time_2', '');
    onUpdate(dayValue, 'check_out_time_2', '');
  };

  return (
    <div className="rounded-lg border border-border bg-card p-2.5 text-card-foreground space-y-2">
      <div className="flex flex-wrap items-center gap-2">
        <div className="w-24 shrink-0 font-semibold text-sm text-card-foreground">{dayLabel}</div>
        <Switch
          checked={schedule.is_working_day}
          onCheckedChange={(checked) => onUpdate(dayValue, 'is_working_day', checked)}
        />
        <span className={`w-14 text-xs font-semibold ${schedule.is_working_day ? 'text-card-foreground' : 'text-muted-foreground'}`}>
          {schedule.is_working_day ? 'Laboral' : 'Libre'}
        </span>
        {schedule.is_working_day && (
          <>
            <div className="flex w-full min-w-0 items-center gap-2 sm:w-auto">
            <Input
              type="time"
              value={schedule.check_in_time}
              onChange={(e) => onUpdate(dayValue, 'check_in_time', e.target.value)}
              className="min-w-0 w-0 flex-1 sm:w-28 sm:flex-none h-8 text-sm"
            />
            <span className="text-card-foreground text-sm">—</span>
            <Input
              type="time"
              value={schedule.check_out_time}
              onChange={(e) => onUpdate(dayValue, 'check_out_time', e.target.value)}
              className="min-w-0 w-0 flex-1 sm:w-28 sm:flex-none h-8 text-sm"
            />
            </div>
            {!hasAfternoon && (
              <Button type="button" variant="ghost" size="sm" className="h-7 px-2 text-xs text-primary" onClick={addAfternoon}>
                <Plus className="h-3 w-3 mr-1" /> Tarde
              </Button>
            )}
          </>
        )}
      </div>
      {schedule.is_working_day && hasAfternoon && (
        <div className="flex flex-wrap items-center gap-2 text-card-foreground">
          <span className="w-full text-xs font-semibold text-card-foreground">Tarde:</span>
          <div className="flex w-full min-w-0 items-center gap-2">
          <Input
            type="time"
            value={schedule.check_in_time_2}
            onChange={(e) => onUpdate(dayValue, 'check_in_time_2', e.target.value)}
            className="min-w-0 w-0 flex-1 sm:w-28 sm:flex-none h-8 text-sm"
          />
          <span className="text-card-foreground text-sm">—</span>
          <Input
            type="time"
            value={schedule.check_out_time_2}
            onChange={(e) => onUpdate(dayValue, 'check_out_time_2', e.target.value)}
            className="min-w-0 w-0 flex-1 sm:w-28 sm:flex-none h-8 text-sm"
          />
          <Button aria-label="Quitar turno de tarde" type="button" variant="ghost" size="sm" className="h-7 shrink-0 px-2 text-destructive" onClick={removeAfternoon}>
            <X className="h-3 w-3" />
          </Button>
          </div>
        </div>
      )}
    </div>
  );
}
