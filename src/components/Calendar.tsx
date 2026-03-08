"use client";

import { useMemo } from "react";
import { Calendar as BigCalendar, dateFnsLocalizer, Event, View } from "react-big-calendar";
import withDragAndDrop from "react-big-calendar/lib/addons/dragAndDrop";
import { format, parse, startOfWeek, getDay } from "date-fns";
import { ptBR } from "date-fns/locale";
import { Appointment, Doctor } from "@/types/database";

const locales = {
  "pt-BR": ptBR,
};

const localizer = dateFnsLocalizer({
  format,
  parse,
  startOfWeek,
  getDay,
  locales,
});

const DnDCalendar = withDragAndDrop(BigCalendar);

interface CalendarEvent extends Event {
  id: string;
  doctor_id: string;
}

interface CalendarProps {
  appointments: Appointment[];
  doctors: Doctor[];
  onMove: (appointmentId: string, start: Date, end: Date) => Promise<void>;
  onCancel: (appointmentId: string) => Promise<void>;
}

const doctorPalette = ["#2563eb", "#059669", "#d97706", "#dc2626", "#7c3aed", "#0891b2"];

export default function Calendar({ appointments, doctors, onMove, onCancel }: CalendarProps) {
  const doctorColorMap = useMemo(() => {
    const map = new Map<string, string>();
    doctors.forEach((doctor, index) => {
      map.set(doctor.id, doctorPalette[index % doctorPalette.length]);
    });
    return map;
  }, [doctors]);

  const events = useMemo<CalendarEvent[]>(
    () =>
      appointments.map((appointment) => ({
        id: appointment.id,
        title: `${appointment.patient?.name ?? "Paciente"} • Dr. ${appointment.doctor?.name ?? ""}`,
        start: new Date(appointment.start_time),
        end: new Date(appointment.end_time),
        doctor_id: appointment.doctor_id,
      })),
    [appointments],
  );

  return (
    <div className="rounded-lg border border-slate-200 bg-white p-3">
      <DnDCalendar
        culture="pt-BR"
        localizer={localizer}
        events={events}
        defaultView={"week" as View}
        views={["day", "week"]}
        messages={{
          today: "Hoje",
          previous: "Anterior",
          next: "Próximo",
          month: "Mês",
          week: "Semana",
          day: "Dia",
          agenda: "Agenda",
          date: "Data",
          time: "Hora",
          event: "Evento",
          noEventsInRange: "Nenhum evento neste período",
        }}
        style={{ height: 650 }}
        onEventDrop={async ({ event, start, end }) => {
          await onMove((event as CalendarEvent).id, start, end);
        }}
        onEventResize={async ({ event, start, end }) => {
          await onMove((event as CalendarEvent).id, start, end);
        }}
        onSelectEvent={async (event) => {
          if (window.confirm("Cancelar esta consulta?")) {
            await onCancel((event as CalendarEvent).id);
          }
        }}
        selectable
        onSelectSlot={() => undefined}
        eventPropGetter={(event) => ({
          style: {
            backgroundColor: doctorColorMap.get((event as CalendarEvent).doctor_id) ?? "#334155",
            borderRadius: 6,
            border: "none",
          },
        })}
      />
    </div>
  );
}
