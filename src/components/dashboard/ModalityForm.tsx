"use client";

import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/Button";
import { useApiMutation } from "@/components/dashboard/useApiMutation";
import {
  inputClassName,
  labelClassName,
  textareaClassName,
} from "@/components/dashboard/styles";

type ModalityFormValues = {
  id?: string;
  name: string;
  slug: string;
  description: string;
  colorHex: string;
  sortOrder: string;
  isActive: boolean;
};

type ModalityFormProps = {
  mode: "create" | "edit";
  endpoint: string;
  initialValues: ModalityFormValues;
};

export function ModalityForm({
  mode,
  endpoint,
  initialValues,
}: ModalityFormProps) {
  const router = useRouter();
  const { submit, isPending, error, message } = useApiMutation<
    Record<string, unknown>
  >({
    endpoint,
    method: mode === "create" ? "POST" : "PATCH",
    successMessage:
      mode === "create"
        ? "Modalidade criada com sucesso."
        : "Modalidade atualizada com sucesso.",
    onSuccess(data) {
      if (mode === "create" && typeof data.modalityId === "string") {
        router.push(`/dashboard/modalidades/${data.modalityId}`);
      }
    },
  });

  function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);

    submit({
      id: initialValues.id,
      name: String(formData.get("name") ?? ""),
      slug: String(formData.get("slug") ?? ""),
      description: String(formData.get("description") ?? ""),
      colorHex: String(formData.get("colorHex") ?? ""),
      sortOrder: String(formData.get("sortOrder") ?? "0"),
      isActive: Boolean(formData.get("isActive")),
    });
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        <div className="space-y-1.5">
          <label htmlFor="name" className={labelClassName}>
            Nome
          </label>
          <input id="name" name="name" defaultValue={initialValues.name} className={inputClassName} />
        </div>
        <div className="space-y-1.5">
          <label htmlFor="slug" className={labelClassName}>
            Slug
          </label>
          <input id="slug" name="slug" defaultValue={initialValues.slug} className={inputClassName} />
        </div>
        <div className="space-y-1.5">
          <label htmlFor="colorHex" className={labelClassName}>
            Cor HEX
          </label>
          <input id="colorHex" name="colorHex" defaultValue={initialValues.colorHex} className={inputClassName} />
        </div>
        <div className="space-y-1.5">
          <label htmlFor="sortOrder" className={labelClassName}>
            Ordem
          </label>
          <input id="sortOrder" name="sortOrder" type="number" defaultValue={initialValues.sortOrder} className={inputClassName} />
        </div>
      </div>

      <div className="space-y-1.5">
        <label htmlFor="description" className={labelClassName}>
          Descricao
        </label>
        <textarea id="description" name="description" defaultValue={initialValues.description} className={textareaClassName} />
      </div>

      <label className="flex items-center gap-3 rounded-2xl border border-brand-gray-mid bg-brand-black/30 px-4 py-3 text-sm text-white">
        <input
          type="checkbox"
          name="isActive"
          defaultChecked={initialValues.isActive}
          className="h-4 w-4 accent-brand-red"
        />
        Modalidade ativa no painel e nos vinculos operacionais.
      </label>

      {error ? (
        <div className="rounded-2xl border border-brand-gray-light/20 bg-brand-black/70 px-4 py-3 text-sm text-brand-white">
          {error}
        </div>
      ) : null}

      {message ? (
        <div className="rounded-2xl border border-brand-white/15 bg-brand-white/5 px-4 py-3 text-sm text-brand-white">
          {message}
        </div>
      ) : null}

      <div className="flex justify-end">
        <Button type="submit" size="lg" loading={isPending}>
          {mode === "create" ? "Criar modalidade" : "Salvar alteracoes"}
        </Button>
      </div>
    </form>
  );
}
