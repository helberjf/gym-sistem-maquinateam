"use client";

import { UserRole } from "@prisma/client";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/Button";
import { useApiMutation } from "@/components/dashboard/useApiMutation";
import {
  helperTextClassName,
  inputClassName,
  labelClassName,
  selectClassName,
  textareaClassName,
} from "@/components/dashboard/styles";

type AnnouncementFormValues = {
  id?: string;
  title: string;
  slug: string;
  excerpt: string;
  content: string;
  targetRole: string;
  isPinned: boolean;
  isPublished: boolean;
  publishedAt: string;
  expiresAt: string;
};

type AnnouncementFormProps = {
  mode: "create" | "edit";
  endpoint: string;
  initialValues: AnnouncementFormValues;
  viewerRole: UserRole;
};

export function AnnouncementForm({
  mode,
  endpoint,
  initialValues,
  viewerRole,
}: AnnouncementFormProps) {
  const router = useRouter();
  const { submit, isPending, error, message } = useApiMutation<
    Record<string, unknown>
  >({
    endpoint,
    method: mode === "create" ? "POST" : "PATCH",
    successMessage:
      mode === "create" ? "Aviso criado com sucesso." : "Aviso atualizado com sucesso.",
    onSuccess(data) {
      if (typeof data.announcementId === "string") {
        router.push(`/dashboard/avisos/${data.announcementId}`);
      }
    },
  });

  const targetOptions =
    viewerRole === UserRole.PROFESSOR
      ? [{ value: UserRole.ALUNO, label: "Alunos vinculados" }]
      : [
          { value: "", label: "Todos os perfis" },
          { value: UserRole.ALUNO, label: "Alunos" },
          { value: UserRole.PROFESSOR, label: "Professores" },
          { value: UserRole.RECEPCAO, label: "Recepcao" },
          { value: UserRole.ADMIN, label: "Administracao" },
        ];

  function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);

    submit({
      id: initialValues.id,
      title: String(formData.get("title") ?? ""),
      slug: String(formData.get("slug") ?? ""),
      excerpt: String(formData.get("excerpt") ?? ""),
      content: String(formData.get("content") ?? ""),
      targetRole: String(formData.get("targetRole") ?? "") || null,
      isPinned: Boolean(formData.get("isPinned")),
      isPublished: Boolean(formData.get("isPublished")),
      publishedAt: String(formData.get("publishedAt") ?? ""),
      expiresAt: String(formData.get("expiresAt") ?? ""),
    });
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        <div className="space-y-1.5">
          <label htmlFor="title" className={labelClassName}>
            Titulo
          </label>
          <input id="title" name="title" defaultValue={initialValues.title} className={inputClassName} />
        </div>
        <div className="space-y-1.5">
          <label htmlFor="slug" className={labelClassName}>
            Slug
          </label>
          <input id="slug" name="slug" defaultValue={initialValues.slug} className={inputClassName} />
        </div>
        <div className="space-y-1.5">
          <label htmlFor="targetRole" className={labelClassName}>
            Publico
          </label>
          <select
            id="targetRole"
            name="targetRole"
            defaultValue={initialValues.targetRole}
            className={selectClassName}
          >
            {targetOptions.map((option) => (
              <option key={option.value || "all"} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </div>
        <div className="space-y-1.5">
          <label htmlFor="publishedAt" className={labelClassName}>
            Data de publicacao
          </label>
          <input
            id="publishedAt"
            name="publishedAt"
            type="date"
            defaultValue={initialValues.publishedAt}
            className={inputClassName}
          />
        </div>
        <div className="space-y-1.5 md:col-span-2">
          <label htmlFor="excerpt" className={labelClassName}>
            Resumo curto
          </label>
          <textarea
            id="excerpt"
            name="excerpt"
            defaultValue={initialValues.excerpt}
            className={textareaClassName}
          />
        </div>
      </div>

      <div className="space-y-1.5">
        <label htmlFor="content" className={labelClassName}>
          Conteudo completo
        </label>
        <textarea
          id="content"
          name="content"
          defaultValue={initialValues.content}
          className={textareaClassName}
        />
        <p className={helperTextClassName}>
          Use este campo para instrucoes, recados operacionais e comunicados visiveis no dashboard.
        </p>
      </div>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
        <div className="space-y-1.5">
          <label htmlFor="expiresAt" className={labelClassName}>
            Expiracao opcional
          </label>
          <input
            id="expiresAt"
            name="expiresAt"
            type="date"
            defaultValue={initialValues.expiresAt}
            className={inputClassName}
          />
        </div>
        <label className="flex items-center gap-3 rounded-2xl border border-brand-gray-mid bg-brand-black/30 px-4 py-3 text-sm text-white">
          <input
            type="checkbox"
            name="isPinned"
            defaultChecked={initialValues.isPinned}
            className="h-4 w-4 accent-brand-red"
          />
          Fixar no topo do painel
        </label>
        <label className="flex items-center gap-3 rounded-2xl border border-brand-gray-mid bg-brand-black/30 px-4 py-3 text-sm text-white">
          <input
            type="checkbox"
            name="isPublished"
            defaultChecked={initialValues.isPublished}
            className="h-4 w-4 accent-brand-red"
          />
          Publicar agora
        </label>
      </div>

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
          {mode === "create" ? "Publicar aviso" : "Salvar alteracoes"}
        </Button>
      </div>
    </form>
  );
}
