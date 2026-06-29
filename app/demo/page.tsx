import { redirect } from 'next/navigation';

export default function DemoIndexPage() {
  redirect('/dashboard?demo=1');
}
