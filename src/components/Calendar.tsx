"use client";

import { useMemo, useState } from "react";
import { Calendar as BigCalendar, dateFnsLocalizer, Event, View } from "react-big-calendar";
import withDragAndDrop from "react-big-calendar/lib/addons/dragAndDrop";
import { format, parse, startOfWeek, getDay } from "date-fns";
import { ptBR } from "date-fns/locale";
import { Appointment, AppointmentStatus, Doctor } from "@/types/database";

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
  status: AppointmentStatus;
  notes: string | null;
}

interface CalendarProps {
  appointments: Appointment[];
  doctors: Doctor[];
  onMove: (appointmentId: string, start: Date, end: Date) => Promise<void>;
  onStatusChange: (appointmentId: string, status: AppointmentStatus) => Promise<void>;
  onError?: (message: string) => void;
}

const doctorPalette = ["#2563eb", "#059669", "#d97706", "#dc2626", "#7c3aed", "#0891b2"];
const statusPalette: Record<AppointmentStatus, { background: string; border: string; color: string }> = {
  scheduled: { background: "", border: "", color: "#ffffff" },
  confirmed: { background: "#065f46", border: "#065f46", color: "#ffffff" },
  completed: { background: "#312e81", border: "#312e81", color: "#ffffff" },
  canceled: { background: "#e2e8f0", border: "#94a3b8", color: "#334155" },
};
const statusLabel: Record<AppointmentStatus, string> = {
  scheduled: "Agendada",
  confirmed: "Confirmada",
  completed: "Concluida",
  canceled: "Cancelada",
};

interface ToolbarProps {
  label: string;
  onNavigate: (action: "PREV" | "NEXT" | "TODAY") => void;
  onView: (view: View) => void;
  view: View;
}

const availableViews: View[] = ["day", "week", "month"];

function CalendarToolbar({ label, onNavigate, onView, view }: ToolbarProps) {
  return (
    <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
      <div className="flex items-center gap-2">
        <button type="button" onClick={() => onNavigate("PREV")} className="rounded-md border border-slate-300 px-3 py-1.5 text-sm text-slate-700 hover:bg-slate-50">
          Anterior
        </button>
        <button type="button" onClick={() => onNavigate("TODAY")} className="rounded-md border border-slate-300 px-3 py-1.5 text-sm text-slate-700 hover:bg-slate-50">
          Hoje
        </button>
        <button type="button" onClick={() => onNavigate("NEXT")} className="rounded-md border border-slate-300 px-3 py-1.5 text-sm text-slate-700 hover:bg-slate-50">
          Proximo
        </button>
      </div>

      <p className="text-sm font-semibold text-slate-900">{label}</p>

      <div className="flex items-center gap-2">
        <button
          type="button"
          onClick={() => onView("month")}
          className={`rounded-md px-3 py-1.5 text-sm ${view === "month" ? "bg-slate-900 text-white" : "border border-slate-300 text-slate-700 hover:bg-slate-50"}`}
        >
          Mes
        </button>
        <button
          type="button"
          onClick={() => onView("day")}
          className={`rounded-md px-3 py-1.5 text-sm ${view === "day" ? "bg-slate-900 text-white" : "border border-slate-300 text-slate-700 hover:bg-slate-50"}`}
        >
          Dia
        </button>
        <button
          type="button"
          onClick={() => onView("week")}
          className={`rounded-md px-3 py-1.5 text-sm ${view === "week" ? "bg-slate-900 text-white" : "border border-slate-300 text-slate-700 hover:bg-slate-50"}`}
        >
          Semana
        </button>
      </div>
    </div>
  );
}

export default function Calendar({ appointments, doctors, onMove, onStatusChange, onError }: CalendarProps) {
  const [selectedEvent, setSelectedEvent] = useState<CalendarEvent | null>(null);
  const [actionLoading, setActionLoading] = useState(false);
  const [currentView, setCurrentView] = useState<View>("week");
  const [currentDate, setCurrentDate] = useState(new Date());

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
        status: appointment.status,
        notes: appointment.notes,
      })),
    [appointments],
  );

  const selectedDoctor = selectedEvent ? doctors.find((doctor) => doctor.id === selectedEvent.doctor_id) : null;

  const runAction = async (fn: () => Promise<void>) => {
    setActionLoading(true);
    try {
      await fn();
      setSelectedEvent(null);
    } catch (error) {
      const message = error instanceof Error ? error.message : "Falha ao executar acao da consulta.";
      if (onError) onError(message);
    } finally {
      setActionLoading(false);
    }
  };

  return (
    <div className="rounded-lg border border-slate-200 bg-white p-3">
      <div className="mb-3 rounded-md border border-slate-200 bg-slate-50 px-3 py-2 text-xs text-slate-700">
        Clique em uma consulta para abrir as acoes. Arraste para mover horario e arraste a borda para ajustar duracao.
      </div>

      <DnDCalendar
        culture="pt-BR"
        localizer={localizer}
        events={events}
        date={currentDate}
        view={currentView}
        components={{
          toolbar: CalendarToolbar,
        }}
        views={availableViews}
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
        style={{ height: currentView === "month" ? 760 : 650 }}
        popup
        onView={(nextView) => setCurrentView(nextView)}
        onNavigate={(nextDate) => setCurrentDate(nextDate)}
        onEventDrop={async ({ event, start, end }) => {
          await runAction(async () => {
            await onMove((event as CalendarEvent).id, start, end);
          });
        }}
        onEventResize={async ({ event, start, end }) => {
          await runAction(async () => {
            await onMove((event as CalendarEvent).id, start, end);
          });
        }}
        onSelectEvent={(event) => {
          setSelectedEvent(event as CalendarEvent);
        }}
        selectable
        onSelectSlot={() => undefined}
        eventPropGetter={(event) => ({
          style: (() => {
            const calendarEvent = event as CalendarEvent;
            if (calendarEvent.status === "canceled") {
              return {
                backgroundColor: statusPalette.canceled.background,
                borderRadius: 6,
                border: `1px dashed ${statusPalette.canceled.border}`,
                color: statusPalette.canceled.color,
                opacity: 0.95,
              };
            }

            if (calendarEvent.status === "completed" || calendarEvent.status === "confirmed") {
              const palette = statusPalette[calendarEvent.status];
              return {
                backgroundColor: palette.background,
                borderRadius: 6,
                border: `1px solid ${palette.border}`,
                color: palette.color,
              };
            }

            return {
              backgroundColor: doctorColorMap.get(calendarEvent.doctor_id) ?? "#334155",
              borderRadius: 6,
              border: "none",
              color: statusPalette.scheduled.color,
            };
          })(),
        })}
      />

      {selectedEvent ? (
        <div className="mt-3 grid gap-2 rounded-md border border-slate-200 bg-slate-50 p-3">
          <p className="text-sm font-semibold text-slate-900">{selectedEvent.title}</p>
          <p className="text-xs text-slate-700">Status: {statusLabel[selectedEvent.status]}</p>
          <p className="text-xs text-slate-700">
            Horario: {format(selectedEvent.start, "dd/MM/yyyy HH:mm")} - {format(selectedEvent.end, "HH:mm")}
          </p>
          {selectedDoctor ? <p className="text-xs text-slate-700">Especialidade: {selectedDoctor.specialty}</p> : null}
          {selectedEvent.notes ? <p className="text-xs text-slate-700">Observacoes: {selectedEvent.notes}</p> : null}

          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              disabled={actionLoading || selectedEvent.status === "confirmed"}
              onClick={() =>
                runAction(async () => {
                  await onStatusChange(selectedEvent.id, "confirmed");
                })
              }
              className="rounded-md bg-emerald-600 px-3 py-1.5 text-sm font-medium text-white disabled:opacity-60"
            >
              Confirmar
            </button>
            <button
              type="button"
              disabled={actionLoading || selectedEvent.status === "canceled"}
              onClick={() =>
                runAction(async () => {
                  await onStatusChange(selectedEvent.id, "canceled");
                })
              }
              className="rounded-md bg-rose-600 px-3 py-1.5 text-sm font-medium text-white disabled:opacity-60"
            >
              Cancelar
            </button>
            <button
              type="button"
              disabled={actionLoading || selectedEvent.status === "completed"}
              onClick={() =>
                runAction(async () => {
                  await onStatusChange(selectedEvent.id, "completed");
                })
              }
              className="rounded-md bg-indigo-600 px-3 py-1.5 text-sm font-medium text-white disabled:opacity-60"
            >
              Concluir
            </button>
            <button
              type="button"
              disabled={actionLoading || selectedEvent.status === "scheduled"}
              onClick={() =>
                runAction(async () => {
                  await onStatusChange(selectedEvent.id, "scheduled");
                })
              }
              className="rounded-md border border-slate-300 bg-white px-3 py-1.5 text-sm text-slate-700 disabled:opacity-60"
            >
              Reativar
            </button>
            <button
              type="button"
              disabled={actionLoading}
              onClick={() => setSelectedEvent(null)}
              className="rounded-md border border-slate-300 bg-white px-3 py-1.5 text-sm text-slate-700 disabled:opacity-60"
            >
              Fechar
            </button>
          </div>
        </div>
      ) : null}
    </div>
  );
}
