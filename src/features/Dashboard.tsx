import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "react-day-picker";

export default function Dashboard() {
  return (
    <div className="container py-10 space-y-6">
      <Card className="bg-card/60 border border-border p-6">
        <h1 className="text-2xl font-bold text-primary">Cne Expense Tracker</h1>
        <p className="text-muted-foreground">Track all expenses securely</p>
      </Card>

      <div className="flex gap-4">
        <Input className="bg-input border-border" placeholder="Expense name" />
        <Button className="bg-primary hover:bg-primary/90 text-primary-foreground">
          Add
        </Button>
        <Button className="bg-accent hover:bg-accent/90 text-accent-foreground">
          Highlight
        </Button>
      </div>
    </div>
  )
}
