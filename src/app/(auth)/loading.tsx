import { RouteLoading } from "@/components/ui/RouteLoading";

export default function AuthLoading() {
  return (
    <RouteLoading
      title="Carregando autenticacao"
      description="Estamos preparando acesso, recuperacao e confirmacao da conta."
    />
  );
}
