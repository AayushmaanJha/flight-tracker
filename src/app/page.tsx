import { ThemeToggle } from "@/components/theme-toggle"
import { FlightTracker } from "@/components/flight-tracker"
import { Plane } from "lucide-react"

export default function Home() {
  return (
    <div className="min-h-screen bg-background">
      <header className="border-b">
        <div className="container mx-auto px-4 py-4 flex justify-between items-center">
          <div className="flex items-center gap-2">
            <Plane className="h-5 w-5" />
            <h1 className="text-2xl font-bold">Flight Tracker</h1>
          </div>
          <ThemeToggle />
        </div>
      </header>

      <main className="container mx-auto px-4 py-8">
        <div className="max-w-5xl mx-auto">
          <FlightTracker />
        </div>
      </main>
    </div>
  )
}
