"use client";

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

type TeacherFormValues = {
  id?: string;
  name: string;
  email: string;
  phone: string;
  registrationNumber: string;
  cpf: string;
  specialties: string;
  experienceYears: string;
  hireDate: string;
  beltLevel: string;
  notes: string;
  modalityIds: string[];
  isActive: boolean;
};

type TeacherFormProps = {
  mode: "create" | "edit";
  endpoint: string;
  initialValues: TeacherFormValues;
  options: {
    modalities: Array<{ id: string; name: string }>;
  };
};

export function TeacherForm({
  mode,
  endpoint,
  initialValues,
  options,
}: TeacherFormProps) {
  const router = useRouter();
  const { submit, isPending, error, message } = useApiMutation<
    Record<string, unknown>
  >({
    endpoint,
    method: mode === "create" ? "POST" : "PATCH",
    successMessage:
      mode === "create"
        ? "Professor criado com sucesso."
        : "Professor atualizado com sucesso.",
    onSuccess(data) {
      if (mode === "create" && typeof data.teacherId === "string") {
        router.push(`/dashboard/professores/${data.teacherId}`);
      }
    },
  });

  function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);

    submit({
      id: initialValues.id,
      name: String(formData.get("name") ?? ""),
      email: String(formData.get("email") ?? ""),
      phone: String(formData.get("phone") ?? ""),
      registrationNumber: String(formData.get("registrationNumber") ?? ""),
      cpf: String(formData.get("cpf") ?? ""),
      specialties: String(formData.get("specialties") ?? ""),
      experienceYears: String(formData.get("experienceYears") ?? ""),
      hireDate: String(formData.get("hireDate") ?? ""),
      beltLevel: String(formData.get("beltLevel") ?? ""),
      notes: String(formData.get("notes") ?? ""),
      modalityIds: formData.getAll("modalityIds").map(String),
      isActive: Boolean(formData.get("isActive")),
      ...(mode === "create"
        ? {
            password: String(formData.get("password") ?? ""),
            confirmPassword: String(formData.get("confirmPassword") ?? ""),
          }
        : {}),
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
          <label htmlFor="email" className={labelClassName}>
            E-mail
          </label>
          <input id="email" name="email" type="email" defaultValue={initialValues.email} className={inputClassName} />
        </div>
        <div className="space-y-1.5">
          <label htmlFor="phone" className={labelClassName}>
            Telefone
          </label>
          <input id="phone" name="phone" defaultValue={initialValues.phone} className={inputClassName} />
        </div>
        <div className="space-y-1.5">
          <label htmlFor="registrationNumber" className={labelClassName}>
            Registro
          </label>
          <input
            id="registrationNumber"
            name="registrationNumber"
            defaultValue={initialValues.registrationNumber}
            placeholder="PROF-00000001"
            className={inputClassName}
          />
          <p className={helperTextClassName}>
            Se ficar em branco, o sistema gera o registro automaticamente.
          </p>
        </div>
        <div className="space-y-1.5">
          <label htmlFor="cpf" className={labelClassName}>
            CPF
          </label>
          <input id="cpf" name="cpf" defaultValue={initialValues.cpf} className={inputClassName} />
        </div>
        <div className="space-y-1.5">
          <label htmlFor="experienceYears" className={labelClassName}>
            Anos de experiencia
          </label>
          <input id="experienceYears" name="experienceYears" type="number" step="1" defaultValue={initialValues.experienceYears} className={inputClassName} />
        </div>
        <div className="space-y-1.5">
          <label htmlFor="hireDate" className={labelClassName}>
            Data de admissao
          </label>
          <input id="hireDate" name="hireDate" type="date" defaultValue={initialValues.hireDate} className={inputClassName} />
        </div>
        <div className="space-y-1.5">
          <label htmlFor="beltLevel" className={labelClassName}>
            Graduacao
          </label>
          <input id="beltLevel" name="beltLevel" defaultValue={initialValues.beltLevel} className={inputClassName} />
        </div>
        {mode === "create" ? (
          <>
            <div className="space-y-1.5">
              <label htmlFor="password" className={labelClassName}>
                Senha inicial
              </label>
              <input id="password" name="password" type="password" className={inputClassName} />
            </div>
            <div className="space-y-1.5">
              <label htmlFor="confirmPassword" className={labelClassName}>
                Confirmar senha
              </label>
              <input id="confirmPassword" name="confirmPassword" type="password" className={inputClassName} />
            </div>
          </>
        ) : null}
      </div>

      <div className="space-y-1.5">
        <label htmlFor="specialties" className={labelClassName}>
          Modalidades e especialidades
        </label>
        <textarea id="specialties" name="specialties" defaultValue={initialValues.specialties} className={textareaClassName} />
      </div>

      <div className="space-y-1.5">
        <label htmlFor="notes" className={labelClassName}>
          Observacoes
        </label>
        <textarea id="notes" name="notes" defaultValue={initialValues.notes} className={textareaClassName} />
      </div>

      <div className="space-y-1.5">
        <label htmlFor="modalityIds" className={labelClassName}>
          Modalidades que ensina
        </label>
        <select
          id="modalityIds"
          name="modalityIds"
          multiple
          defaultValue={initialValues.modalityIds}
          className={`${selectClassName} min-h-40`}
        >
          {options.modalities.map((modality) => (
            <option key={modality.id} value={modality.id}>
              {modality.name}
            </option>
          ))}
        </select>
        <p className={helperTextClassName}>
          Use Ctrl ou Command para selecionar mais de uma modalidade.
        </p>
      </div>

      <label className="flex items-center gap-3 rounded-2xl border border-brand-gray-mid bg-brand-black/30 px-4 py-3 text-sm text-white">
        <input
          type="checkbox"
          name="isActive"
          defaultChecked={initialValues.isActive}
          className="h-4 w-4 accent-brand-red"
        />
        Perfil ativo para turmas e acessos.
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
          {mode === "create" ? "Criar professor" : "Salvar alteracoes"}
        </Button>
      </div>
    </form>
  );
}
