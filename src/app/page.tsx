import { redirect } from 'next/navigation';

// Redireciona a raiz para a área pública
export default function RootPage() {
  redirect('/home');
}
