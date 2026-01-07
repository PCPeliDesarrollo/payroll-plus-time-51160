import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Calendar as CalendarIcon, ChevronLeft, ChevronRight } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { isHoliday, isNationalHoliday, isRegionalHoliday, getHolidayName } from "@/lib/holidays";

interface VacationDay {
  date: string;
  status: 'pending' | 'approved' | 'rejected' | 'compensatory';
  employeeName: string;
  reason?: string;
}

interface VacationCalendarProps {
  vacations: VacationDay[];
}

export function VacationCalendar({ vacations }: VacationCalendarProps) {
  const [currentYear, setCurrentYear] = useState(new Date().getFullYear());
  const [currentMonth, setCurrentMonth] = useState(new Date().getMonth());

  const months = [
    'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
    'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'
  ];

  const daysOfWeek = ['L', 'M', 'X', 'J', 'V', 'S', 'D'];

  const getDaysInMonth = (month: number, year: number) => {
    return new Date(year, month + 1, 0).getDate();
  };

  const getFirstDayOfMonth = (month: number, year: number) => {
    const day = new Date(year, month, 1).getDay();
    return day === 0 ? 6 : day - 1; // Convert Sunday from 0 to 6
  };

  const getVacationForDate = (day: number) => {
    const dateStr = `${currentYear}-${String(currentMonth + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
    return vacations.filter(v => {
      const vacDate = v.date.includes('T') ? v.date.split('T')[0] : v.date;
      return vacDate === dateStr;
    });
  };

  const getDateColor = (status: string) => {
    switch (status) {
      case 'pending':
        return 'bg-amber-500/80 hover:bg-amber-500/90';
      case 'approved':
        return 'bg-success/80 hover:bg-success/90';
      case 'rejected':
        return 'bg-destructive/80 hover:bg-destructive/90';
      case 'compensatory':
        return 'bg-blue-500/80 hover:bg-blue-500/90';
      default:
        return 'bg-secondary';
    }
  };

  const renderCalendar = () => {
    const daysInMonth = getDaysInMonth(currentMonth, currentYear);
    const firstDay = getFirstDayOfMonth(currentMonth, currentYear);
    const days = [];

    // Empty cells before first day
    for (let i = 0; i < firstDay; i++) {
      days.push(<div key={`empty-${i}`} className="aspect-square" />);
    }

    // Days of month
    for (let day = 1; day <= daysInMonth; day++) {
      const dayVacations = getVacationForDate(day);
      const hasVacations = dayVacations.length > 0;
      const dateStr = `${currentYear}-${String(currentMonth + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
      const holidayName = getHolidayName(dateStr);
      const isNational = isNationalHoliday(dateStr);
      const isRegional = isRegionalHoliday(dateStr);
      const isHolidayDay = isNational || isRegional;

      let bgClass = 'bg-background hover:bg-accent';
      let textClass = '';
      let title = '';

      if (hasVacations) {
        bgClass = `${getDateColor(dayVacations[0].status)} text-white font-semibold cursor-pointer`;
        title = dayVacations.map(v => `${v.employeeName} (${v.status})`).join('\n');
      } else if (isHolidayDay) {
        bgClass = isNational 
          ? 'bg-red-500/80 hover:bg-red-500/90 text-white font-semibold' 
          : 'bg-orange-400/80 hover:bg-orange-400/90 text-white font-semibold';
        title = holidayName || '';
      }

      days.push(
        <div
          key={day}
          className={`aspect-square flex flex-col items-center justify-center text-[10px] sm:text-xs md:text-sm rounded border sm:rounded-lg ${bgClass} ${textClass}`}
          title={title}
        >
          <span>{day}</span>
          {dayVacations.length > 1 && (
            <span className="text-[8px] sm:text-[10px]">+{dayVacations.length - 1}</span>
          )}
          {isHolidayDay && !hasVacations && (
            <span className="text-[6px] sm:text-[8px] leading-tight text-center px-0.5">
              {isNational ? '🇪🇸' : '🏛️'}
            </span>
          )}
        </div>
      );
    }

    return days;
  };

  const previousMonth = () => {
    if (currentMonth === 0) {
      setCurrentMonth(11);
      setCurrentYear(currentYear - 1);
    } else {
      setCurrentMonth(currentMonth - 1);
    }
  };

  const nextMonth = () => {
    if (currentMonth === 11) {
      setCurrentMonth(0);
      setCurrentYear(currentYear + 1);
    } else {
      setCurrentMonth(currentMonth + 1);
    }
  };

  return (
    <Card className="overflow-hidden">
      <CardHeader className="space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <CardTitle className="flex items-center gap-2 text-base sm:text-lg">
            <CalendarIcon className="h-5 w-5 text-primary shrink-0" />
            <span>Calendario de Vacaciones</span>
          </CardTitle>
          <div className="flex items-center justify-center gap-2">
            <Button variant="outline" size="icon" className="h-8 w-8 shrink-0" onClick={previousMonth}>
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <span className="text-sm font-medium w-28 sm:w-36 text-center truncate">
              {months[currentMonth]} {currentYear}
            </span>
            <Button variant="outline" size="icon" className="h-8 w-8 shrink-0" onClick={nextMonth}>
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
        <div className="flex flex-wrap gap-1.5 sm:gap-2">
          <Badge className="bg-amber-500 text-white text-xs">Solicitadas</Badge>
          <Badge className="bg-success text-white text-xs">Aprobadas</Badge>
          <Badge className="bg-destructive text-white text-xs">Rechazadas</Badge>
          <Badge className="bg-blue-500 text-white text-xs">Días Libres</Badge>
          <Badge className="bg-red-500 text-white text-xs">🇪🇸 Festivo Nacional</Badge>
          <Badge className="bg-orange-400 text-white text-xs">🏛️ Festivo Extremadura</Badge>
        </div>
      </CardHeader>
      <CardContent className="p-2 sm:p-6">
        <div className="grid grid-cols-7 gap-0.5 sm:gap-1 md:gap-2">
          {daysOfWeek.map(day => (
            <div key={day} className="text-center font-semibold text-[10px] sm:text-xs md:text-sm p-1 sm:p-2">
              {day}
            </div>
          ))}
          {renderCalendar()}
        </div>
      </CardContent>
    </Card>
  );
}
