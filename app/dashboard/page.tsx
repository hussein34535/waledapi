"use client"

import { useEffect, useState } from "react"
import { ref, onValue } from "firebase/database"
import type { VpsAccount } from "@/lib/types"
import type { SniConfig } from "@/lib/types"
import VpsAccountsList from "@/components/vps-accounts-list"
import { AddVpsAccountDialog } from "@/components/add-vps-account-dialog"
import { AddSniDialog } from "@/components/add-sni-dialog"
import SniList from "@/components/sni-list"
import { Button } from "@/components/ui/button"
import { PlusCircle, Server, Wifi, Terminal, Shield } from "lucide-react"
import { useAuth } from "@/components/auth-provider"
import { database } from "@/lib/firebase"

type AccountType = "SSH" | "VMESS" | "VLESS" | "TROJAN" | "SOCKS" | "SHADOWSOCKS" | "MS";

const SECTION_TYPES: { type: AccountType; label: string; icon: React.ReactNode }[] = [
  { type: "SSH", label: "SSH Accounts", icon: <Terminal className="h-5 w-5" /> },
  { type: "VMESS", label: "VMess Accounts", icon: <Wifi className="h-5 w-5" /> },
  { type: "VLESS", label: "VLESS Accounts", icon: <Wifi className="h-5 w-5" /> },
  { type: "TROJAN", label: "Trojan Accounts", icon: <Shield className="h-5 w-5" /> },
  { type: "SOCKS", label: "SOCKS Accounts", icon: <Server className="h-5 w-5" /> },
  { type: "SHADOWSOCKS", label: "Shadowsocks Accounts", icon: <Shield className="h-5 w-5" /> },
  { type: "MS", label: "MS Accounts", icon: <Server className="h-5 w-5" /> },
];

export default function Dashboard() {
  const { user } = useAuth();
  const [accounts, setAccounts] = useState<VpsAccount[]>([]);
  const [sniList, setSniList] = useState<SniConfig[]>([]);
  const [isAccountsLoading, setIsAccountsLoading] = useState(true);
  const [isSniLoading, setIsSniLoading] = useState(true);
  const [isAddAccountDialogOpen, setIsAddAccountDialogOpen] = useState(false);
  const [isAddSniDialogOpen, setIsAddSniDialogOpen] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [newAccountId, setNewAccountId] = useState<string | null>(null);

  const handleAccountAdded = (accountId: string) => {
    setNewAccountId(accountId);
    setTimeout(() => setNewAccountId(null), 5000);
  };

  const fetchSniList = async () => {
    setIsSniLoading(true);
    try {
      const response = await fetch('/api/sni');
      if (!response.ok) {
        throw new Error('Failed to fetch SNI list');
      }
      const data = await response.json();
      setSniList(data);
    } catch (error) {
      console.error("API error (sni):", error);
    } finally {
      setIsSniLoading(false);
    }
  };

  useEffect(() => {
    const accountsRef = ref(database, "vpsAccounts");
    const unsubscribeAccounts = onValue(accountsRef, (snapshot) => {
      const accountsData: VpsAccount[] = [];
      if (snapshot.exists()) {
        snapshot.forEach((childSnapshot) => {
          accountsData.push({ id: childSnapshot.key, ...childSnapshot.val() });
        });
        accountsData.sort((a, b) => (b.createdAt || 0) - (a.createdAt || 0));
      }
      setAccounts(accountsData);
      setIsAccountsLoading(false);
    }, (error) => {
      console.error("Database error (vpsAccounts):", error);
      setError(`Database error: ${error.message}`);
      setIsAccountsLoading(false);
    });

    fetchSniList();

    return () => unsubscribeAccounts();
  }, []);

  const getAccountsByType = (type: AccountType) =>
    accounts.filter((a) => a.type === type);

  const hasAccounts = accounts.length > 0;

  return (
    <div className="min-h-screen bg-background">
      <main className="container mx-auto px-4 py-4 sm:py-8">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
          <h1 className="text-2xl sm:text-3xl font-bold">Dashboard</h1>
          <div className="flex flex-col sm:flex-row gap-2">
            <Button onClick={() => setIsAddAccountDialogOpen(true)} className="w-full sm:w-auto">
              <PlusCircle className="mr-2 h-4 w-4" />
              إضافة حساب
            </Button>
            <Button onClick={() => setIsAddSniDialogOpen(true)} className="w-full sm:w-auto" variant="outline">
              <PlusCircle className="mr-2 h-4 w-4" />
              Add SNI
            </Button>
          </div>
        </div>

        {error ? (
          <div className="bg-destructive/10 text-destructive p-4 rounded-md mb-6">
            <p>{error}</p>
            <Button variant="outline" className="mt-2" onClick={() => window.location.reload()}>
              Retry Connection
            </Button>
          </div>
        ) : (
          <>
            {SECTION_TYPES.map(({ type, label, icon }) => {
              const typeAccounts = getAccountsByType(type);
              return (
                <div key={type} className="mb-10">
                  <h2 className="text-xl sm:text-2xl font-semibold mb-4 flex items-center gap-2">
                    {icon}
                    {label}
                    <span className="text-sm font-normal text-muted-foreground ml-2">
                      ({typeAccounts.length})
                    </span>
                  </h2>
                  <VpsAccountsList
                    accounts={typeAccounts}
                    isLoading={isAccountsLoading}
                    newAccountId={newAccountId}
                  />
                </div>
              );
            })}

            {!isAccountsLoading && !hasAccounts && (
              <div className="text-center py-12">
                <Server className="mx-auto h-12 w-12 text-muted-foreground" />
                <h3 className="mt-4 text-lg font-medium">لا توجد حسابات</h3>
                <p className="mt-2 text-muted-foreground">أضف حساب SSH أو VMess أو VLESS للبدء</p>
                <Button onClick={() => setIsAddAccountDialogOpen(true)} className="mt-4">
                  <PlusCircle className="mr-2 h-4 w-4" />
                  إضافة حساب
                </Button>
              </div>
            )}

            <div className="mt-12">
              <h2 className="text-xl sm:text-2xl font-semibold mb-4">SNI Configuration</h2>
              <SniList sniList={sniList} isLoading={isSniLoading} onListChange={fetchSniList} />
            </div>
          </>
        )}

        <AddVpsAccountDialog
          open={isAddAccountDialogOpen}
          onOpenChange={setIsAddAccountDialogOpen}
          userId={user?.uid}
          onAccountAdded={handleAccountAdded}
        />
        <AddSniDialog
          open={isAddSniDialogOpen}
          onOpenChange={setIsAddSniDialogOpen}
          onSniAdded={fetchSniList}
        />
      </main>
    </div>
  );
}
