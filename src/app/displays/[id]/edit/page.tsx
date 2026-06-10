import EditDisplayForm from "@/components/EditDisplayForm";

interface EditPageProps {
  params: Promise<{ id: string }>;
}

export default async function EditDisplayPage({ params }: EditPageProps) {
  const { id } = await params;
  return <EditDisplayForm id={id} />;
}
