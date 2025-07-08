import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useAuth } from "@/hooks/useAuth";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { Trash2, Plus, Settings as SettingsIcon } from "lucide-react";

interface EmailRule {
  id?: string;
  email?: string;
  pattern?: string;
  category: "FYI" | "Draft" | "Forward";
  confidence: number;
  type: "sender" | "subject";
}

interface UserSettings {
  emailRules: {
    senderRules: { email: string; category: string; confidence: number }[];
    subjectRules: { pattern: string; category: string; confidence: number }[];
    generalPreferences: {
      prioritizePersonal: boolean;
      autoForwardCustomerService: boolean;
      treatNewslettersAsFYI: boolean;
    };
  };
}

export default function Settings() {
  const { isAuthenticated, isLoading } = useAuth();
  const { toast } = useToast();
  const [newRule, setNewRule] = useState<Partial<EmailRule>>({
    type: "sender",
    category: "FYI",
    confidence: 95,
  });

  // Fetch user settings
  const { data: settings, isLoading: settingsLoading } = useQuery<UserSettings>({
    queryKey: ["/api/settings"],
    enabled: isAuthenticated,
  });

  // Update settings mutation
  const updateSettingsMutation = useMutation({
    mutationFn: async (updatedSettings: UserSettings) => {
      const response = await apiRequest("PUT", "/api/settings", updatedSettings);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/settings"] });
      toast({
        title: "Settings updated",
        description: "Your email categorization rules have been saved.",
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to update settings. Please try again.",
        variant: "destructive",
      });
    },
  });

  const addRule = () => {
    if (!settings || !newRule.category) return;

    const updatedSettings = { ...settings };
    
    if (newRule.type === "sender" && newRule.email) {
      updatedSettings.emailRules.senderRules.push({
        email: newRule.email,
        category: newRule.category,
        confidence: newRule.confidence || 95,
      });
    } else if (newRule.type === "subject" && newRule.pattern) {
      updatedSettings.emailRules.subjectRules.push({
        pattern: newRule.pattern,
        category: newRule.category,
        confidence: newRule.confidence || 95,
      });
    }

    updateSettingsMutation.mutate(updatedSettings);
    setNewRule({ type: "sender", category: "FYI", confidence: 95 });
  };

  const removeRule = (type: "sender" | "subject", index: number) => {
    if (!settings) return;

    const updatedSettings = { ...settings };
    if (type === "sender") {
      updatedSettings.emailRules.senderRules.splice(index, 1);
    } else {
      updatedSettings.emailRules.subjectRules.splice(index, 1);
    }

    updateSettingsMutation.mutate(updatedSettings);
  };

  const updateGeneralPreference = (key: string, value: boolean) => {
    if (!settings) return;

    const updatedSettings = {
      ...settings,
      emailRules: {
        ...settings.emailRules,
        generalPreferences: {
          ...settings.emailRules.generalPreferences,
          [key]: value,
        },
      },
    };

    updateSettingsMutation.mutate(updatedSettings);
  };

  if (isLoading || settingsLoading) {
    return <div className="p-6">Loading settings...</div>;
  }

  if (!isAuthenticated) {
    return <div className="p-6">Please log in to access settings.</div>;
  }

  const getCategoryColor = (category: string) => {
    switch (category) {
      case "FYI": return "blue";
      case "Draft": return "amber";
      case "Forward": return "emerald";
      default: return "gray";
    }
  };

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex items-center gap-2 mb-6">
        <SettingsIcon className="h-6 w-6" />
        <h1 className="text-2xl font-bold">Email Categorization Settings</h1>
      </div>

      {/* General Preferences */}
      <Card>
        <CardHeader>
          <CardTitle>General Preferences</CardTitle>
          <CardDescription>
            Configure how Baron should categorize your emails
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label>Prioritize Personal Emails</Label>
              <p className="text-sm text-muted-foreground">
                Mark emails from contacts as Draft for immediate attention
              </p>
            </div>
            <Switch
              checked={settings?.emailRules.generalPreferences.prioritizePersonal || false}
              onCheckedChange={(checked) => updateGeneralPreference("prioritizePersonal", checked)}
            />
          </div>

          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label>Auto-Forward Customer Service</Label>
              <p className="text-sm text-muted-foreground">
                Automatically categorize customer inquiries as Forward
              </p>
            </div>
            <Switch
              checked={settings?.emailRules.generalPreferences.autoForwardCustomerService || false}
              onCheckedChange={(checked) => updateGeneralPreference("autoForwardCustomerService", checked)}
            />
          </div>

          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label>Treat Newsletters as FYI</Label>
              <p className="text-sm text-muted-foreground">
                Automatically categorize newsletters and promotions as FYI
              </p>
            </div>
            <Switch
              checked={settings?.emailRules.generalPreferences.treatNewslettersAsFYI || false}
              onCheckedChange={(checked) => updateGeneralPreference("treatNewslettersAsFYI", checked)}
            />
          </div>
        </CardContent>
      </Card>

      {/* Email Rules */}
      <Card>
        <CardHeader>
          <CardTitle>Custom Email Rules</CardTitle>
          <CardDescription>
            Create specific rules for email addresses and subject patterns
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Add New Rule */}
          <div className="border rounded-lg p-4 space-y-4">
            <h3 className="font-semibold">Add New Rule</h3>
            <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
              <Select
                value={newRule.type}
                onValueChange={(value: "sender" | "subject") =>
                  setNewRule({ ...newRule, type: value })
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="sender">Sender Email</SelectItem>
                  <SelectItem value="subject">Subject Pattern</SelectItem>
                </SelectContent>
              </Select>

              <Input
                placeholder={newRule.type === "sender" ? "email@example.com" : "Subject contains..."}
                value={newRule.type === "sender" ? newRule.email || "" : newRule.pattern || ""}
                onChange={(e) =>
                  setNewRule({
                    ...newRule,
                    [newRule.type === "sender" ? "email" : "pattern"]: e.target.value,
                  })
                }
              />

              <Select
                value={newRule.category}
                onValueChange={(value: "FYI" | "Draft" | "Forward") =>
                  setNewRule({ ...newRule, category: value })
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="FYI">FYI</SelectItem>
                  <SelectItem value="Draft">Draft</SelectItem>
                  <SelectItem value="Forward">Forward</SelectItem>
                </SelectContent>
              </Select>

              <Input
                type="number"
                min="50"
                max="100"
                placeholder="95"
                value={newRule.confidence}
                onChange={(e) =>
                  setNewRule({ ...newRule, confidence: parseInt(e.target.value) })
                }
              />

              <Button onClick={addRule} disabled={updateSettingsMutation.isPending}>
                <Plus className="h-4 w-4 mr-2" />
                Add Rule
              </Button>
            </div>
          </div>

          {/* Existing Rules */}
          <div className="space-y-4">
            <h3 className="font-semibold">Current Rules</h3>
            
            {/* Sender Rules */}
            {settings?.emailRules.senderRules.map((rule, index) => (
              <div key={`sender-${index}`} className="flex items-center justify-between p-3 border rounded-lg">
                <div className="flex items-center gap-3">
                  <Badge variant="outline">Sender</Badge>
                  <span className="font-mono text-sm">{rule.email}</span>
                  <Badge className={getCategoryColor(rule.category)}>{rule.category}</Badge>
                  <span className="text-sm text-muted-foreground">{rule.confidence}% confidence</span>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => removeRule("sender", index)}
                  disabled={updateSettingsMutation.isPending}
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            ))}

            {/* Subject Rules */}
            {settings?.emailRules.subjectRules.map((rule, index) => (
              <div key={`subject-${index}`} className="flex items-center justify-between p-3 border rounded-lg">
                <div className="flex items-center gap-3">
                  <Badge variant="outline">Subject</Badge>
                  <span className="font-mono text-sm">"{rule.pattern}"</span>
                  <Badge className={getCategoryColor(rule.category)}>{rule.category}</Badge>
                  <span className="text-sm text-muted-foreground">{rule.confidence}% confidence</span>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => removeRule("subject", index)}
                  disabled={updateSettingsMutation.isPending}
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            ))}

            {(!settings?.emailRules.senderRules.length && !settings?.emailRules.subjectRules.length) && (
              <p className="text-muted-foreground text-center py-8">
                No custom rules configured. Add rules above to customize email categorization.
              </p>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}