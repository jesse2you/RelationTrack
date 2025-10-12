import { useState, useEffect } from "react";
import { useMutation, useQuery } from "@tanstack/react-query";
import { apiRequest, queryClient } from "@/lib/queryClient";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { Settings, Sparkles, MessageSquare, Info } from "lucide-react";

interface UserSettings {
  id?: string;
  userId?: string;
  preferredModel?: string;
  customRouting?: string;
  themePreference?: string;
  showHelpTips?: string;
}

interface SettingsDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export default function SettingsDialog({ open, onOpenChange }: SettingsDialogProps) {
  const { toast } = useToast();
  const [preferredModel, setPreferredModel] = useState<string>("");
  const [customRouting, setCustomRouting] = useState("");
  const [showHelpTips, setShowHelpTips] = useState(true);

  // Fetch current settings
  const { data: settings } = useQuery<UserSettings>({
    queryKey: ["/api/settings"],
    enabled: open,
  });

  // Load settings when data arrives
  useEffect(() => {
    if (settings) {
      setPreferredModel(settings.preferredModel || "");
      setCustomRouting(settings.customRouting || "");
      setShowHelpTips(settings.showHelpTips === "true");
    }
  }, [settings]);

  // Save settings mutation
  const saveSettingsMutation = useMutation({
    mutationFn: async (data: Partial<UserSettings>) => {
      const res = await apiRequest("POST", "/api/settings", data);
      return await res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/settings"] });
      toast({
        title: "Settings saved!",
        description: "Your preferences have been updated.",
      });
      onOpenChange(false);
    },
  });

  const handleSave = () => {
    saveSettingsMutation.mutate({
      preferredModel: preferredModel || undefined,
      customRouting: customRouting || undefined,
      showHelpTips: showHelpTips ? "true" : "false",
    });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto" data-testid="dialog-settings">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Settings className="w-5 h-5" />
            Customize Your AI Agent Router
          </DialogTitle>
          <DialogDescription>
            Personalize how the AI routing works for your needs
          </DialogDescription>
        </DialogHeader>

        <Tabs defaultValue="models" className="w-full">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="models" data-testid="tab-models">
              <Sparkles className="w-4 h-4 mr-2" />
              Models
            </TabsTrigger>
            <TabsTrigger value="routing" data-testid="tab-routing">
              <MessageSquare className="w-4 h-4 mr-2" />
              Routing Rules
            </TabsTrigger>
            <TabsTrigger value="help" data-testid="tab-help">
              <Info className="w-4 h-4 mr-2" />
              Help & Tips
            </TabsTrigger>
          </TabsList>

          <TabsContent value="models" className="space-y-4 mt-4">
            <div className="space-y-2">
              <Label htmlFor="preferred-model">Preferred AI Model</Label>
              <Select value={preferredModel} onValueChange={setPreferredModel}>
                <SelectTrigger id="preferred-model" data-testid="select-preferred-model">
                  <SelectValue placeholder="Auto-select (recommended)" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">Auto-select based on question</SelectItem>
                  <SelectItem value="gpt-4o">GPT-4o (Best for code)</SelectItem>
                  <SelectItem value="gpt-4o-mini">GPT-4o-mini (Fast & creative)</SelectItem>
                  <SelectItem value="o3-mini">O3-mini (Deep reasoning)</SelectItem>
                </SelectContent>
              </Select>
              <p className="text-sm text-muted-foreground">
                Leave blank for smart auto-selection based on your question
              </p>
            </div>

            <div className="bg-muted p-4 rounded-lg space-y-2">
              <h4 className="font-semibold">Model Guide:</h4>
              <ul className="text-sm space-y-1 text-muted-foreground">
                <li><span className="text-purple-500 font-medium">GPT-4o</span> - Programming, debugging, technical questions</li>
                <li><span className="text-cyan-500 font-medium">GPT-4o-mini</span> - Writing, creativity, general chat</li>
                <li><span className="text-emerald-500 font-medium">O3-mini</span> - Analysis, reasoning, complex explanations</li>
              </ul>
            </div>
          </TabsContent>

          <TabsContent value="routing" className="space-y-4 mt-4">
            <div className="space-y-2">
              <Label htmlFor="custom-routing">Custom Routing Keywords (Advanced)</Label>
              <Textarea
                id="custom-routing"
                data-testid="textarea-custom-routing"
                placeholder={`Add your own routing rules (JSON format):\n{\n  "keywords": {\n    "homework": "gpt-4o",\n    "essay": "gpt-4o-mini"\n  }\n}`}
                value={customRouting}
                onChange={(e) => setCustomRouting(e.target.value)}
                className="font-mono text-sm min-h-[150px]"
              />
              <p className="text-sm text-muted-foreground">
                Define custom keywords to route to specific models. Leave blank to use defaults.
              </p>
            </div>

            <div className="bg-blue-500/10 border border-blue-500/20 p-4 rounded-lg">
              <h4 className="font-semibold text-blue-600 dark:text-blue-400 mb-2">How Routing Works:</h4>
              <ol className="text-sm space-y-1 text-muted-foreground list-decimal list-inside">
                <li>System checks your custom keywords first</li>
                <li>If no match, uses built-in keyword detection</li>
                <li>Falls back to your preferred model if set</li>
                <li>Otherwise auto-selects best model</li>
              </ol>
            </div>
          </TabsContent>

          <TabsContent value="help" className="space-y-4 mt-4">
            <div className="flex items-center justify-between">
              <div className="space-y-1">
                <Label htmlFor="help-tips">Show Help Tips</Label>
                <p className="text-sm text-muted-foreground">
                  Display helpful hints and tutorials while using the app
                </p>
              </div>
              <Switch
                id="help-tips"
                data-testid="switch-help-tips"
                checked={showHelpTips}
                onCheckedChange={setShowHelpTips}
              />
            </div>

            <div className="bg-muted p-4 rounded-lg space-y-3">
              <h4 className="font-semibold">Learning Resources:</h4>
              <ul className="text-sm space-y-2 text-muted-foreground">
                <li>📖 <strong>HOW_IT_WORKS.md</strong> - Complete system explanation</li>
                <li>📊 <strong>TEST_RESULTS_GREAT.md</strong> - App verification report</li>
                <li>💡 <strong>Feedback buttons</strong> - Help improve AI routing</li>
                <li>🎨 <strong>Theme toggle</strong> - Switch light/dark mode</li>
              </ul>
            </div>

            <div className="border-t pt-4">
              <h4 className="font-semibold mb-2">Contribute & Learn:</h4>
              <p className="text-sm text-muted-foreground mb-3">
                Your feedback helps train the router! Use 👍/👎 on messages to suggest better AI selections.
              </p>
            </div>
          </TabsContent>
        </Tabs>

        <div className="flex justify-end gap-2 mt-4">
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            data-testid="button-cancel-settings"
          >
            Cancel
          </Button>
          <Button
            onClick={handleSave}
            disabled={saveSettingsMutation.isPending}
            data-testid="button-save-settings"
          >
            {saveSettingsMutation.isPending ? "Saving..." : "Save Settings"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
