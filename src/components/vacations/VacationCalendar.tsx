import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Calendar as CalendarIcon, ChevronLeft, ChevronRight } from "lucide-react";
import { Badge } from "@/components/ui/badge";

interface VacationDay {
  date: string;
  status: 'pending' | 'approved' | 'rejected';
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
      const vacDate = v.date.split('T')[0];
      return vacDate === dateStr;
    });
  };

  const getDateColor = (status: string) => {
    switch (status) {
      case 'pending':
        return 'bg-accent/80 hover:bg-accent/90';
      case 'approved':
        return 'bg-success/80 hover:bg-success/90';
      case 'rejected':
        return 'bg-destructive/80 hover:bg-destructive/90';
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

      days.push(
        <div
          key={day}
          className={`aspect-square flex flex-col items-center justify-center text-sm rounded-lg border ${
            hasVacations
              ? `${getDateColor(dayVacations[0].status)} text-white font-semibold cursor-pointer`
              : 'bg-background hover:bg-accent'
          }`}
          title={hasVacations ? dayVacations.map(v => `${v.employeeName} (${v.status})`).join('\n') : ''}
        >
          <span>{day}</span>
          {dayVacations.length > 1 && (
            <span className="text-[10px]">+{dayVacations.length - 1}</span>
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
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <CalendarIcon className="h-5 w-5 text-primary" />
            Calendario de Vacaciones
          </CardTitle>
          <div className="flex items-center gap-2">
            <Button variant="outline" size="icon" onClick={previousMonth}>
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <span className="text-sm font-medium min-w-[150px] text-center">
              {months[currentMonth]} {currentYear}
            </span>
            <Button variant="outline" size="icon" onClick={nextMonth}>
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
        <div className="flex flex-wrap gap-2 mt-4">
          <Badge className="bg-accent text-white">Solicitadas</Badge>
          <Badge className="bg-success text-white">Aprobadas</Badge>
          <Badge className="bg-destructive text-white">Rechazadas</Badge>
        </div>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-7 gap-1 md:gap-2">
          {daysOfWeek.map(day => (
            <div key={day} className="text-center font-semibold text-xs md:text-sm p-2">
              {day}
            </div>
          ))}
          {renderCalendar()}
        </div>
      </CardContent>
    </Card>
  );
}
