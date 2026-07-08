"use client"

import { useState } from "react"
import { ref, remove } from "firebase/database"
import { database } from "@/lib/firebase"
import type { VpsAccount } from "@/lib/types"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { useToast } from "@/components/ui/use-toast"

interface DeleteVpsAccountDialogProps {
  account: VpsAccount
  open: boolean
  onOpenChange: (open: boolean) => void
}

export default function DeleteVpsAccountDialog({ account, open, onOpenChange }: DeleteVpsAccountDialogProps) {
  const [isDeleting, setIsDeleting] = useState(false)
  const { toast } = useToast()

  const handleDelete = async () => {
    if (!account.id) return

    setIsDeleting(true)

    try {
      const accountRef = ref(database, `vpsAccounts/${account.id}`)
      await remove(accountRef)

      toast({
        title: "Account deleted",
        description: "VPS account has been deleted successfully.",
      })

      onOpenChange(false)
    } catch (error) {
      console.error("Error deleting account:", error)
      toast({
        title: "Error",
        description: "Failed to delete VPS account. Please try again.",
        variant: "destructive",
      })
    } finally {
      setIsDeleting(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Delete VPS Account</DialogTitle>
          <DialogDescription>
            Are you sure you want to delete this VPS account? This action cannot be undone.
          </DialogDescription>
        </DialogHeader>

        <div className="bg-muted/50 p-4 rounded-md">
          <div className="grid grid-cols-2 gap-2 text-sm">
            <div className="text-muted-foreground">Type:</div>
            <div>{account.type}</div>

            <div className="text-muted-foreground">Server Name:</div>
            <div>{account.server_name}</div>

            <div className="text-muted-foreground">IP Address:</div>
            <div>{account.ip_address}</div>

            <div className="text-muted-foreground">Username:</div>
            <div>{account.username}</div>
          </div>
        </div>

        <DialogFooter>
          <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button type="button" variant="destructive" onClick={handleDelete} disabled={isDeleting}>
            {isDeleting ? "Deleting..." : "Delete Account"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

