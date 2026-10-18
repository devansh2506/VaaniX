import { redirect } from 'next/navigation';

// Sign-in has been removed; anyone landing here goes to the home page.
export default function LoginPage() {
  redirect('/');
}
