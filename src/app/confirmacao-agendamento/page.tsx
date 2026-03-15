import BookingConfirmation from "@/components/public-booking/BookingConfirmation";

interface PageProps {
  searchParams: {
    clinic?: string;
    clinicSlug?: string;
    appointment?: string;
    message?: string;
  };
}

export default function ConfirmationPage({ searchParams }: PageProps) {
  const clinicName = searchParams.clinic ?? "Clinica";
  const clinicSlug = searchParams.clinicSlug ?? "";
  const appointmentId = searchParams.appointment ?? "-";
  const message = searchParams.message;

  return <BookingConfirmation clinicName={clinicName} clinicSlug={clinicSlug} appointmentId={appointmentId} message={message} />;
}
