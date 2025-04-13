"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast"; // Assuming you have a useToast hook

export default function FCMNotificationsPage() {
  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast(); // Initialize toast

  const sendNotification = async () => {
    if (!title || !body) {
      toast({
        title: "Error",
        description: "Please enter both title and body.",
        variant: "destructive",
      });
      return;
    }

    setIsLoading(true);
    try {
      const response = await fetch("/api/fcm", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          title,
          body,
        }),
      });

      if (response.ok) {
        toast({
          title: "Success",
          description: "Notification sent successfully to all devices!",
        });
        setTitle(""); // Clear fields on success
        setBody("");
      } else {
        const errorData = await response.json();
        toast({
          title: "Error",
          description: `Failed to send notification: ${errorData.error || response.statusText}`,
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error("Error sending notification:", error);
      toast({
        title: "Error",
        description: "An unexpected error occurred while sending the notification.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <Card className="max-w-lg mx-auto">
        <CardHeader>
          <CardTitle>Send Notification to All Devices</CardTitle>
          <CardDescription>
            Compose and send a push notification to all subscribed devices via FCM.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="title">Title</Label>
            <Input
              id="title"
              placeholder="Enter notification title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              disabled={isLoading}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="body">Body</Label>
            <Textarea
              id="body"
              placeholder="Enter notification body"
              value={body}
              onChange={(e) => setBody(e.target.value)}
              rows={4}
              disabled={isLoading}
            />
          </div>
        </CardContent>
        <CardFooter>
          <Button onClick={sendNotification} disabled={isLoading} className="w-full">
            {isLoading ? "Sending..." : "Send Notification"}
          </Button>
        </CardFooter>
      </Card>
    </div>
  );
}