import { SettingsNav } from './settings-nav'

export default function SettingsLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="max-w-3xl space-y-8">
      <h1 className="font-serif text-3xl font-light">Settings</h1>
      <SettingsNav />
      <div>{children}</div>
    </div>
  )
}
