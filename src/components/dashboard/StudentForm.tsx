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

type StudentFormValues = {
  id?: string;
  name: string;
  email: string;
  phone: string;
  registrationNumber: string;
  status: string;
  primaryModalityId: string;
  responsibleTeacherId: string;
  birthDate: string;
  cpf: string;
  city: string;
  state: string;
  joinedAt: string;
  beltLevel: string;
  weightKg: string;
  heightCm: string;
  goals: string;
  notes: string;
};

type StudentFormProps = {
  mode: "create" | "edit";
  endpoint: string;
  initialValues: StudentFormValues;
  options: {
    modalities: Array<{ id: string; name: string }>;
    teachers: Array<{ id: string; name: string }>;
  };
};

export function StudentForm({
  mode,
  endpoint,
  initialValues,
  options,
}: StudentFormProps) {
  const router = useRouter();
  const { submit, isPending, error, message } = useApiMutation<
    Record<string, unknown>
  >({
    endpoint,
    method: mode === "create" ? "POST" : "PATCH",
    successMessage:
      mode === "create" ? "Aluno criado com sucesso." : "Aluno atualizado com sucesso.",
    onSuccess(data) {
      if (mode === "create" && typeof data.studentId === "string") {
        router.push(`/dashboard/alunos/${data.studentId}`);
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
      status: String(formData.get("status") ?? "ACTIVE"),
      primaryModalityId: String(formData.get("primaryModalityId") ?? ""),
      responsibleTeacherId: String(formData.get("responsibleTeacherId") ?? ""),
      birthDate: String(formData.get("birthDate") ?? ""),
      cpf: String(formData.get("cpf") ?? ""),
      city: String(formData.get("city") ?? ""),
      state: String(formData.get("state") ?? ""),
      joinedAt: String(formData.get("joinedAt") ?? ""),
      beltLevel: String(formData.get("beltLevel") ?? ""),
      weightKg: String(formData.get("weightKg") ?? ""),
      heightCm: String(formData.get("heightCm") ?? ""),
      goals: String(formData.get("goals") ?? ""),
      notes: String(formData.get("notes") ?? ""),
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
            Matricula
          </label>
          <input
            id="registrationNumber"
            name="registrationNumber"
            defaultValue={initialValues.registrationNumber}
            placeholder="ALU-00000001"
            className={inputClassName}
          />
          <p className={helperTextClassName}>
            Se ficar em branco, o sistema gera a matricula automaticamente.
          </p>
        </div>
        <div className="space-y-1.5">
          <label htmlFor="status" className={labelClassName}>
            Status
          </label>
          <select id="status" name="status" defaultValue={initialValues.status} className={selectClassName}>
            <option value="ACTIVE">Ativo</option>
            <option value="SUSPENDED">Inadimplente</option>
            <option value="INACTIVE">Inativo</option>
            <option value="TRIAL">Experimental</option>
            <option value="PENDING">Pendente</option>
          </select>
        </div>
        <div className="space-y-1.5">
          <label htmlFor="primaryModalityId" className={labelClassName}>
            Modalidade principal
          </label>
          <select
            id="primaryModalityId"
            name="primaryModalityId"
            defaultValue={initialValues.primaryModalityId}
            className={selectClassName}
          >
            <option value="">Sem modalidade principal</option>
            {options.modalities.map((modality) => (
              <option key={modality.id} value={modality.id}>
                {modality.name}
              </option>
            ))}
          </select>
        </div>
        <div className="space-y-1.5">
          <label htmlFor="responsibleTeacherId" className={labelClassName}>
            Professor responsavel
          </label>
          <select
            id="responsibleTeacherId"
            name="responsibleTeacherId"
            defaultValue={initialValues.responsibleTeacherId}
            className={selectClassName}
          >
            <option value="">Sem professor responsavel</option>
            {options.teachers.map((teacher) => (
              <option key={teacher.id} value={teacher.id}>
                {teacher.name}
              </option>
            ))}
          </select>
        </div>
        <div className="space-y-1.5">
          <label htmlFor="birthDate" className={labelClassName}>
            Data de nascimento
          </label>
          <input id="birthDate" name="birthDate" type="date" defaultValue={initialValues.birthDate} className={inputClassName} />
        </div>
        <div className="space-y-1.5">
          <label htmlFor="cpf" className={labelClassName}>
            CPF
          </label>
          <input id="cpf" name="cpf" defaultValue={initialValues.cpf} className={inputClassName} />
        </div>
        <div className="space-y-1.5">
          <label htmlFor="city" className={labelClassName}>
            Cidade
          </label>
          <input id="city" name="city" defaultValue={initialValues.city} className={inputClassName} />
        </div>
        <div className="space-y-1.5">
          <label htmlFor="state" className={labelClassName}>
            UF
          </label>
          <input id="state" name="state" maxLength={2} defaultValue={initialValues.state} className={inputClassName} />
        </div>
        <div className="space-y-1.5">
          <label htmlFor="joinedAt" className={labelClassName}>
            Inicio
          </label>
          <input id="joinedAt" name="joinedAt" type="date" defaultValue={initialValues.joinedAt} className={inputClassName} />
        </div>
        <div className="space-y-1.5">
          <label htmlFor="beltLevel" className={labelClassName}>
            Graduacao
          </label>
          <input id="beltLevel" name="beltLevel" defaultValue={initialValues.beltLevel} className={inputClassName} />
        </div>
        <div className="space-y-1.5">
          <label htmlFor="weightKg" className={labelClassName}>
            Peso (kg)
          </label>
          <input id="weightKg" name="weightKg" type="number" step="0.1" defaultValue={initialValues.weightKg} className={inputClassName} />
        </div>
        <div className="space-y-1.5">
          <label htmlFor="heightCm" className={labelClassName}>
            Altura (cm)
          </label>
          <input id="heightCm" name="heightCm" type="number" step="1" defaultValue={initialValues.heightCm} className={inputClassName} />
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
        <label htmlFor="goals" className={labelClassName}>
          Objetivos
        </label>
        <textarea id="goals" name="goals" defaultValue={initialValues.goals} className={textareaClassName} />
      </div>

      <div className="space-y-1.5">
        <label htmlFor="notes" className={labelClassName}>
          Observacoes
        </label>
        <textarea id="notes" name="notes" defaultValue={initialValues.notes} className={textareaClassName} />
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
          {mode === "create" ? "Criar aluno" : "Salvar alteracoes"}
        </Button>
      </div>
    </form>
  );
}
