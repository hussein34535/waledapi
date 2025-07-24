"use client"

import type { SniConfig } from "@/lib/types"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardFooter } from "@/components/ui/card"
import { Trash2, Copy } from "lucide-react"
import { toast } from "sonner"
import { ref, remove } from "firebase/database"
import { database } from "@/lib/firebase"

interface SniListProps {
  sniList: SniConfig[]
  isLoading: boolean
}

export default function SniList({ sniList, isLoading }: SniListProps) {

  const copyToClipboard = (text: string, label: string) => {
    navigator.clipboard.writeText(text)
    toast.success(`${label} copied to clipboard`)
  }

  const handleDelete = async (id: string) => {
    if (!window.confirm("Are you sure you want to delete this SNI?")) {
      return
    }
    try {
      const sniRef = ref(database, `sni/${id}`);
      await remove(sniRef);
      toast.success("SNI deleted successfully")
    } catch (error) {
      console.error("Error deleting SNI:", error)
      toast.error("Failed to delete SNI")
    }
  }

  if (isLoading) {
    return <div>Loading SNI list...</div>
  }

  if (sniList.length === 0) {
    return (
      <div className="text-center py-8 sm:py-12">
        <p className="mt-2 text-muted-foreground">No SNI configurations found. Add one to get started.</p>
      </div>
    )
  }

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
      {sniList.map((sni) => (
        <Card key={sni.id}>
          <CardContent className="p-4 sm:p-6 space-y-2">
            <div className="flex justify-between items-start">
              <h3 className="font-semibold">{sni.name}</h3>
              <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => copyToClipboard(sni.name, "Name")}>
                <Copy className="h-4 w-4" />
              </Button>
            </div>
            <div className="flex justify-between items-start">
              <p className="text-muted-foreground break-all">{sni.host}</p>
              <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => copyToClipboard(sni.host, "Host")}>
                <Copy className="h-4 w-4" />
              </Button>
            </div>
          </CardContent>
          <CardFooter className="bg-muted/50 px-4 sm:px-6 py-2">
            <Button
              variant="ghost"
              size="sm"
              className="w-full justify-center text-destructive hover:text-destructive"
              onClick={() => handleDelete(sni.id)}
            >
              <Trash2 className="mr-2 h-4 w-4" />
              Delete
            </Button>
          </CardFooter>
        </Card>
      ))}
    </div>
  )
}
