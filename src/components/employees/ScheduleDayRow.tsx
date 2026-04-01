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
  1: { is_working_day: true, check_in_time: '09:00', check_out_time: '17:00', check_in_time_2: '', check_out_time_2: '' },
  2: { is_working_day: true, check_in_time: '09:00', check_out_time: '17:00', check_in_time_2: '', check_out_time_2: '' },
  3: { is_working_day: true, check_in_time: '09:00', check_out_time: '17:00', check_in_time_2: '', check_out_time_2: '' },
  4: { is_working_day: true, check_in_time: '09:00', check_out_time: '17:00', check_in_time_2: '', check_out_time_2: '' },
  5: { is_working_day: true, check_in_time: '09:00', check_out_time: '17:00', check_in_time_2: '', check_out_time_2: '' },
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
    onUpdate(dayValue, 'check_in_time_2', '16:00');
    onUpdate(dayValue, 'check_out_time_2', '20:00');
  };

  const removeAfternoon = () => {
    onUpdate(dayValue, 'check_in_time_2', '');
    onUpdate(dayValue, 'check_out_time_2', '');
  };

  return (
    <div className="rounded-lg border border-border bg-card p-2.5 text-foreground space-y-2">
      <div className="flex items-center gap-3">
        <div className="w-28 shrink-0 font-semibold text-sm text-foreground">{dayLabel}</div>
        <Switch
          checked={schedule.is_working_day}
          onCheckedChange={(checked) => onUpdate(dayValue, 'is_working_day', checked)}
        />
        <span className={`w-14 text-xs font-semibold ${schedule.is_working_day ? 'text-foreground' : 'text-muted-foreground'}`}>
          {schedule.is_working_day ? 'Laboral' : 'Libre'}
        </span>
        {schedule.is_working_day && (
          <>
            <Input
              type="time"
              value={schedule.check_in_time}
              onChange={(e) => onUpdate(dayValue, 'check_in_time', e.target.value)}
              className="w-28 h-8 text-sm"
            />
            <span className="text-foreground text-sm">—</span>
            <Input
              type="time"
              value={schedule.check_out_time}
              onChange={(e) => onUpdate(dayValue, 'check_out_time', e.target.value)}
              className="w-28 h-8 text-sm"
            />
            {!hasAfternoon && (
              <Button type="button" variant="ghost" size="sm" className="h-7 px-2 text-xs text-primary" onClick={addAfternoon}>
                <Plus className="h-3 w-3 mr-1" /> Tarde
              </Button>
            )}
          </>
        )}
      </div>
      {schedule.is_working_day && hasAfternoon && (
        <div className="flex items-center gap-3 pl-[calc(7rem+12px+3.5rem+24px)] text-foreground">
          <span className="w-12 text-xs font-semibold text-foreground">Tarde:</span>
          <Input
            type="time"
            value={schedule.check_in_time_2}
            onChange={(e) => onUpdate(dayValue, 'check_in_time_2', e.target.value)}
            className="w-28 h-8 text-sm"
          />
          <span className="text-foreground text-sm">—</span>
          <Input
            type="time"
            value={schedule.check_out_time_2}
            onChange={(e) => onUpdate(dayValue, 'check_out_time_2', e.target.value)}
            className="w-28 h-8 text-sm"
          />
          <Button type="button" variant="ghost" size="sm" className="h-7 px-2 text-destructive" onClick={removeAfternoon}>
            <X className="h-3 w-3" />
          </Button>
        </div>
      )}
    </div>
  );
}
