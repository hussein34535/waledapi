"use client"

import { useEffect, useState } from "react"
import { ref, onValue } from "firebase/database"
import type { VpsAccount } from "@/lib/types"
import type { SniConfig } from "@/lib/types" // Assuming you'll add this type
import VpsAccountsList from "@/components/vps-accounts-list"
import { AddVpsAccountDialog } from "@/components/add-vps-account-dialog"
import { AddSniDialog } from "@/components/add-sni-dialog" // Assuming you'll create this
import SniList from "@/components/sni-list" // Assuming you'll create this
import { Button } from "@/components/ui/button"
import { PlusCircle } from "lucide-react"
import { useAuth } from "@/components/auth-provider"
import Link from "next/link"
import { database } from "@/lib/firebase"

export default function Dashboard() {
  const { user, loading } = useAuth();
  const [accounts, setAccounts] = useState<VpsAccount[]>([]);
  const [sniList, setSniList] = useState<SniConfig[]>([]);
  const [isVlessLoading, setIsVlessLoading] = useState(true);
  const [isSniLoading, setIsSniLoading] = useState(true);
  const [isAddVlessDialogOpen, setIsAddVlessDialogOpen] = useState(false);
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
    // Fetch VLESS accounts
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
      setIsVlessLoading(false);
    }, (error) => {
      console.error("Database error (vpsAccounts):", error);
      setError(`Database error: ${error.message}`);
      setIsVlessLoading(false);
    });

    fetchSniList();

    // The original onValue listener for Realtime Database is removed
    // to avoid permission issues. The API now handles data fetching.

  }, []);

  return (
    <div className="min-h-screen bg-background">
      <main className="container mx-auto px-4 py-4 sm:py-8">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
          <h1 className="text-2xl sm:text-3xl font-bold">Dashboard</h1>
          <div className="flex flex-col sm:flex-row gap-2">
            <Button onClick={() => setIsAddVlessDialogOpen(true)} className="w-full sm:w-auto">
              <PlusCircle className="mr-2 h-4 w-4" />
              Add VLESS
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
            <div className="mb-12">
              <h2 className="text-xl sm:text-2xl font-semibold mb-4">VLESS Accounts</h2>
              <VpsAccountsList accounts={accounts} isLoading={isVlessLoading} newAccountId={newAccountId} />
            </div>
            <div>
              <h2 className="text-xl sm:text-2xl font-semibold mb-4">SNI Configuration</h2>
              <SniList sniList={sniList} isLoading={isSniLoading} onListChange={fetchSniList} />
            </div>
          </>
        )}

        <AddVpsAccountDialog
          open={isAddVlessDialogOpen}
          onOpenChange={setIsAddVlessDialogOpen}
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
