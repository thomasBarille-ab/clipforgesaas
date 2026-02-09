import { BackButton } from '@/components/BackButton'

export default function DashboardLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-purple-950/50 to-slate-950">
      <main className="mx-auto max-w-4xl px-4 py-8 md:px-8">
        <BackButton />
        {children}
      </main>
    </div>
  )
}
