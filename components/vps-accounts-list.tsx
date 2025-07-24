"use client"

import { useState } from "react"
import type { VpsAccount } from "@/lib/types"
import { formatDistanceToNow } from "date-fns"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardFooter } from "@/components/ui/card"
import { Edit, Trash2, Copy, Server } from "lucide-react"
import { useToast } from "@/components/ui/use-toast"
import EditVpsAccountDialog from "@/components/edit-vps-account-dialog"
import DeleteVpsAccountDialog from "@/components/delete-vps-account-dialog"

interface VpsAccountsListProps {
  accounts: VpsAccount[]
  isLoading: boolean
  newAccountId?: string | null
}

export default function VpsAccountsList({ accounts, isLoading, newAccountId }: VpsAccountsListProps) {
  const { toast } = useToast();
  const [editAccount, setEditAccount] = useState<VpsAccount | null>(null);
  const [deleteAccount, setDeleteAccount] = useState<VpsAccount | null>(null);

  const copyToClipboard = (text: string, label: string) => {
    navigator.clipboard.writeText(text)
    toast({
      title: "Copied to clipboard",
      description: `${label} has been copied to your clipboard.`,
    })
  }

  const getTypeIcon = (type: string) => {
    switch (type) {
      case "SSH":
        return <Server className="h-4 w-4" />
      case "VLESS":
        return <Server className="h-4 w-4" />
      case "TROJAN":
        return <Server className="h-4 w-4" />
      case "SOCKS":
        return <Server className="h-4 w-4" />
      case "SHADOWSOCKS":
        return <Server className="h-4 w-4" />
      case "MS":
        return <Server className="h-4 w-4" />
      default:
        return <Server className="h-4 w-4" />
    }
  }

  if (isLoading) {
    return (
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {[1, 2, 3].map((i) => (
          <Card key={i} className="animate-pulse">
            <CardContent className="p-4 sm:p-6">
              <div className="h-4 bg-muted rounded w-1/3 mb-4"></div>
              <div className="space-y-3">
                <div className="h-3 bg-muted rounded w-full"></div>
                <div className="h-3 bg-muted rounded w-full"></div>
                <div className="h-3 bg-muted rounded w-2/3"></div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    )
  }

  if (accounts.length === 0) {
    return (
      <div className="text-center py-8 sm:py-12">
        <Server className="mx-auto h-12 w-12 text-muted-foreground" />
        <h3 className="mt-4 text-lg font-medium">No VPS accounts found</h3>
        <p className="mt-2 text-muted-foreground">Add your first VPS account to get started.</p>
      </div>
    )
  }

  const renderAccountCard = (account: VpsAccount) => {
    const decryptedAccount = account;
    
    return (
      <Card
        key={account.id}
        className={`overflow-hidden transition-all duration-500 ${
          account.id === newAccountId ? "ring-2 ring-primary shadow-lg" : ""
        }`}
      >
        {account.id === newAccountId && (
          <div className="bg-primary text-primary-foreground text-xs py-1 px-2 text-center">
            Newly Added
          </div>
        )}
        <CardContent className="p-4 sm:p-6">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center space-x-2">
              {getTypeIcon(account.type)}
              <span className="font-medium">{account.type}</span>
            </div>
            <Badge variant={account.status === "active" ? "default" : "secondary"}>{account.status}</Badge>
          </div>

          <div className="space-y-2">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-1">
              <span className="text-sm text-muted-foreground">Server Name</span>
              <div className="flex items-center">
                <span className="text-sm font-medium truncate">{decryptedAccount.server_name}</span>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-6 w-6 ml-1"
                  onClick={() => copyToClipboard(decryptedAccount.server_name, "Server Name")}
                >
                  <Copy className="h-3 w-3" />
                </Button>
              </div>
            </div>

            {account.type === "SSH" && (
              <>
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-1">
                  <span className="text-sm text-muted-foreground">IP Address</span>
                  <div className="flex items-center">
                    <span className="text-sm font-medium truncate">{decryptedAccount.ip_address}</span>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-6 w-6 ml-1"
                      onClick={() => copyToClipboard(decryptedAccount.ip_address, "IP Address")}
                    >
                      <Copy className="h-3 w-3" />
                    </Button>
                  </div>
                </div>

                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-1">
                  <span className="text-sm text-muted-foreground">Username</span>
                  <div className="flex items-center">
                    <span className="text-sm font-medium truncate">{decryptedAccount.username}</span>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-6 w-6 ml-1"
                      onClick={() => copyToClipboard(decryptedAccount.username, "Username")}
                    >
                      <Copy className="h-3 w-3" />
                    </Button>
                  </div>
                </div>

                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-1">
                  <span className="text-sm text-muted-foreground">Password</span>
                  <div className="flex items-center">
                    <span className="text-sm font-medium">••••••••</span>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-6 w-6 ml-1"
                      onClick={() => copyToClipboard(decryptedAccount.password, "Password")}
                    >
                      <Copy className="h-3 w-3" />
                    </Button>
                  </div>
                </div>

                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-1">
                  <span className="text-sm text-muted-foreground">Expiry Date</span>
                  <div className="flex items-center">
                    <span className="text-sm font-medium">{account.expiry_date}</span>
                  </div>
                </div>
              </>
            )}

            {(account.type === "VLESS" || account.type === "TROJAN" || account.type === "SOCKS" || account.type === "SHADOWSOCKS" || account.type === "MS" as any) && (
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-1">
                <span className="text-sm text-muted-foreground">Config</span>
                <div className="flex items-center">
                  <span className="text-sm font-medium break-all">{decryptedAccount.config || ""}</span>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-6 w-6 ml-1"
                    onClick={() => copyToClipboard(decryptedAccount.config || "", "Config")}
                  >
                    <Copy className="h-3 w-3" />
                  </Button>
                </div>
              </div>
            )}
          </div>
        </CardContent>

        <CardFooter className="bg-muted/50 px-4 sm:px-6 py-3">
          <div className="flex items-center justify-between w-full">
            <span className="text-xs text-muted-foreground">
              Added {formatDistanceToNow(account.createdAt, { addSuffix: true })}
            </span>
            <div className="flex items-center space-x-2">
              <Button variant="ghost" size="icon" onClick={() => setEditAccount(account)}>
                <Edit className="h-4 w-4" />
              </Button>
              <Button variant="ghost" size="icon" onClick={() => setDeleteAccount(account)}>
                <Trash2 className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </CardFooter>
      </Card>
    );
  };

  return (
    <>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-2 gap-4">
        {accounts.map(renderAccountCard)}
      </div>

      {editAccount && (
        <EditVpsAccountDialog
          account={editAccount}
          open={true}
          onOpenChange={(open) => !open && setEditAccount(null)}
          onAccountUpdated={() => {}}
        />
      )}

      {deleteAccount && (
        <DeleteVpsAccountDialog
          account={deleteAccount}
          open={true}
          onOpenChange={(open) => !open && setDeleteAccount(null)}
        />
      )}
    </>
  );
}
  
  
