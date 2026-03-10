import BookingConfirmation from "@/components/public-booking/BookingConfirmation";

interface PageProps {
  searchParams: {
    clinic?: string;
    appointment?: string;
    message?: string;
  };
}

export default function ConfirmationPage({ searchParams }: PageProps) {
  const clinicName = searchParams.clinic ?? "Clinica";
  const appointmentId = searchParams.appointment ?? "-";
  const message = searchParams.message;

  return <BookingConfirmation clinicName={clinicName} appointmentId={appointmentId} message={message} />;
}
