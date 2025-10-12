import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Mic, Volume2, Square } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface VoiceControlsProps {
  onTranscript: (text: string) => void;
  responseText?: string;
}

export function VoiceControls({ onTranscript, responseText }: VoiceControlsProps) {
  const [isRecording, setIsRecording] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const { toast } = useToast();
  const [recognition, setRecognition] = useState<any>(null);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
      if (SpeechRecognition) {
        const recognitionInstance = new SpeechRecognition();
        recognitionInstance.continuous = false;
        recognitionInstance.interimResults = false;
        recognitionInstance.lang = 'en-US';

        recognitionInstance.onresult = (event: any) => {
          const transcript = event.results[0][0].transcript;
          onTranscript(transcript);
          setIsRecording(false);
        };

        recognitionInstance.onerror = (event: any) => {
          console.error('Speech recognition error:', event.error);
          toast({
            title: "Voice Error",
            description: "Could not recognize speech. Please try again.",
            variant: "destructive"
          });
          setIsRecording(false);
        };

        recognitionInstance.onend = () => {
          setIsRecording(false);
        };

        setRecognition(recognitionInstance);
      }
    }
  }, [onTranscript, toast]);

  const startRecording = () => {
    if (!recognition) {
      toast({
        title: "Not Supported",
        description: "Voice recognition is not supported in this browser.",
        variant: "destructive"
      });
      return;
    }

    try {
      recognition.start();
      setIsRecording(true);
    } catch (error) {
      console.error('Error starting recognition:', error);
    }
  };

  const stopRecording = () => {
    if (recognition && isRecording) {
      recognition.stop();
      setIsRecording(false);
    }
  };

  const speakResponse = () => {
    if (!responseText) return;

    if ('speechSynthesis' in window) {
      window.speechSynthesis.cancel();
      
      const utterance = new SpeechSynthesisUtterance(responseText);
      utterance.rate = 0.9;
      utterance.pitch = 1.0;
      utterance.volume = 1.0;

      utterance.onstart = () => setIsSpeaking(true);
      utterance.onend = () => setIsSpeaking(false);
      utterance.onerror = () => {
        setIsSpeaking(false);
        toast({
          title: "Speech Error",
          description: "Could not speak response.",
          variant: "destructive"
        });
      };

      window.speechSynthesis.speak(utterance);
    } else {
      toast({
        title: "Not Supported",
        description: "Speech synthesis is not supported in this browser.",
        variant: "destructive"
      });
    }
  };

  const stopSpeaking = () => {
    if ('speechSynthesis' in window) {
      window.speechSynthesis.cancel();
      setIsSpeaking(false);
    }
  };

  return (
    <div className="flex gap-2" data-testid="voice-controls">
      <Button
        variant="outline"
        size="sm"
        onClick={isRecording ? stopRecording : startRecording}
        disabled={isSpeaking}
        data-testid={isRecording ? "button-stop-recording" : "button-record-voice"}
        className={isRecording ? "bg-red-500/10 border-red-500 text-red-600" : ""}
      >
        {isRecording ? (
          <>
            <Square className="w-4 h-4 mr-2" />
            Stop Recording
          </>
        ) : (
          <>
            <Mic className="w-4 h-4 mr-2" />
            Record Voice
          </>
        )}
      </Button>

      {responseText && (
        <Button
          variant="outline"
          size="sm"
          onClick={isSpeaking ? stopSpeaking : speakResponse}
          disabled={isRecording}
          data-testid={isSpeaking ? "button-stop-speaking" : "button-speak-response"}
          className={isSpeaking ? "bg-blue-500/10 border-blue-500 text-blue-600" : ""}
        >
          {isSpeaking ? (
            <>
              <Square className="w-4 h-4 mr-2" />
              Stop Speaking
            </>
          ) : (
            <>
              <Volume2 className="w-4 h-4 mr-2" />
              Speak Response
            </>
          )}
        </Button>
      )}
    </div>
  );
}
