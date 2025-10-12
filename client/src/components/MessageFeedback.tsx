import { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { ThumbsUp, ThumbsDown, Lightbulb } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface MessageFeedbackProps {
  messageId: string;
  currentModel?: string;
}

export default function MessageFeedback({ messageId, currentModel }: MessageFeedbackProps) {
  const { toast } = useToast();
  const [showSuggestion, setShowSuggestion] = useState(false);
  const [suggestion, setSuggestion] = useState("");
  const [suggestedModel, setSuggestedModel] = useState("");

  const feedbackMutation = useMutation({
    mutationFn: async (data: any) => {
      const res = await apiRequest("POST", "/api/feedback", data);
      return await res.json();
    },
    onSuccess: (_, variables) => {
      // Only close form and show toast for thumbs_up or suggestion submission
      // Keep form open after thumbs_down so user can add details
      if (variables.feedbackType === "thumbs_up" || variables.feedbackType === "suggestion") {
        toast({
          title: "Thanks for your feedback!",
          description: "You're helping improve the AI routing.",
        });
        setShowSuggestion(false);
        setSuggestion("");
        setSuggestedModel("");
      }
      // For thumbs_down, feedback is recorded but form stays open
    },
  });

  const handleThumbsUp = () => {
    feedbackMutation.mutate({
      messageId,
      feedbackType: "thumbs_up",
    });
  };

  const handleThumbsDown = () => {
    // Record thumbs down immediately
    feedbackMutation.mutate({
      messageId,
      feedbackType: "thumbs_down",
    });
    // Then show suggestion form for optional details
    setShowSuggestion(true);
  };

  const handleSubmitSuggestion = () => {
    feedbackMutation.mutate({
      messageId,
      feedbackType: "suggestion",
      content: suggestion,
      suggestedModel: suggestedModel || null,
    });
  };

  if (showSuggestion) {
    return (
      <div className="mt-2 space-y-2 p-3 bg-muted/50 rounded-lg" data-testid={`feedback-suggestion-${messageId}`}>
        <div className="text-sm font-medium">Help us improve:</div>
        <div className="text-xs text-muted-foreground">
          ✓ Feedback recorded. Add more details below (optional):
        </div>
        <Textarea
          placeholder="What could be better? (optional)"
          value={suggestion}
          onChange={(e) => setSuggestion(e.target.value)}
          className="text-sm min-h-[60px]"
          data-testid={`textarea-feedback-${messageId}`}
        />
        <div className="text-xs text-muted-foreground">
          Which model would be better?
        </div>
        <div className="flex gap-2 flex-wrap">
          <Button
            size="sm"
            variant={suggestedModel === "gpt-4o" ? "default" : "outline"}
            onClick={() => setSuggestedModel("gpt-4o")}
            data-testid={`button-suggest-gpt4o-${messageId}`}
          >
            GPT-4o
          </Button>
          <Button
            size="sm"
            variant={suggestedModel === "gpt-4o-mini" ? "default" : "outline"}
            onClick={() => setSuggestedModel("gpt-4o-mini")}
            data-testid={`button-suggest-gpt4o-mini-${messageId}`}
          >
            GPT-4o-mini
          </Button>
          <Button
            size="sm"
            variant={suggestedModel === "o3-mini" ? "default" : "outline"}
            onClick={() => setSuggestedModel("o3-mini")}
            data-testid={`button-suggest-o3-mini-${messageId}`}
          >
            O3-mini
          </Button>
        </div>
        <div className="flex gap-2 justify-end">
          <Button
            size="sm"
            variant="ghost"
            onClick={() => setShowSuggestion(false)}
            data-testid={`button-cancel-feedback-${messageId}`}
          >
            Cancel
          </Button>
          <Button
            size="sm"
            onClick={handleSubmitSuggestion}
            disabled={feedbackMutation.isPending}
            data-testid={`button-submit-feedback-${messageId}`}
          >
            {feedbackMutation.isPending ? "Sending..." : "Submit"}
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex gap-1 mt-2" data-testid={`feedback-buttons-${messageId}`}>
      <Button
        size="sm"
        variant="ghost"
        className="h-7 px-2"
        onClick={handleThumbsUp}
        disabled={feedbackMutation.isPending}
        data-testid={`button-thumbs-up-${messageId}`}
      >
        <ThumbsUp className="w-3 h-3" />
      </Button>
      <Button
        size="sm"
        variant="ghost"
        className="h-7 px-2"
        onClick={handleThumbsDown}
        disabled={feedbackMutation.isPending}
        data-testid={`button-thumbs-down-${messageId}`}
      >
        <ThumbsDown className="w-3 h-3" />
      </Button>
      <div className="text-xs text-muted-foreground flex items-center gap-1 ml-2">
        <Lightbulb className="w-3 h-3" />
        <span>Was this helpful?</span>
      </div>
    </div>
  );
}
