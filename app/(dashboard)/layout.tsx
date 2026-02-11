import { Sidebar } from '@/components/Sidebar'

export default function DashboardLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-purple-950/50 to-slate-950">
      <Sidebar />
      <main className="pb-20 md:pl-56 md:pb-0">
        <div className="mx-auto px-4 py-8 md:px-8">
          {children}
        </div>
      </main>
    </div>
  )
}
