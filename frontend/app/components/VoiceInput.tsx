import { useState, useEffect, useRef } from "react";
import { Mic, MicOff } from "lucide-react";

interface VoiceInputProps {
  onTranscript: (text: string) => void;
  disabled?: boolean;
  useSpacebar?: boolean;
}

export function VoiceInput({ onTranscript, disabled = false, useSpacebar = true }: Readonly<VoiceInputProps>) {
  const [isListening, setIsListening] = useState(false);
  const [isSupported, setIsSupported] = useState(true);
  const recognitionRef = useRef<any>(null);
  const spacebarHeldRef = useRef(false);

  useEffect(() => {
    // Check if browser supports Speech Recognition
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    
    if (!SpeechRecognition) {
      setIsSupported(false);
      return;
    }

    // Initialize speech recognition
    const recognition = new SpeechRecognition();
    recognition.continuous = false;
    recognition.interimResults = false;
    recognition.lang = "en-US";

    recognition.onresult = (event: SpeechRecognitionEvent) => {
      const transcript = event.results[0][0].transcript;
      onTranscript(transcript);
      setIsListening(false);
    };

    recognition.onerror = (event: SpeechRecognitionErrorEvent) => {
      console.error("Speech recognition error:", event.error);
      setIsListening(false);
    };

    recognition.onend = () => {
      setIsListening(false);
    };

    recognitionRef.current = recognition;

    return () => {
      if (recognitionRef.current) {
        recognitionRef.current.stop();
      }
    };
  }, [onTranscript]);

  // Spacebar hold to record
  useEffect(() => {
    if (!useSpacebar || !recognitionRef.current || disabled) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      // Only trigger if space is pressed and not already held
      if (e.code === 'Space' && !spacebarHeldRef.current && !e.repeat) {
        // Check if focus is not on input/textarea
        const target = e.target as HTMLElement;
        if (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA') {
          return;
        }

        e.preventDefault();
        spacebarHeldRef.current = true;
        
        if (!isListening) {
          try {
            recognitionRef.current?.start();
            setIsListening(true);
          } catch (error) {
            console.error('Error starting recognition:', error);
          }
        }
      }
    };

    const handleKeyUp = (e: KeyboardEvent) => {
      if (e.code === 'Space' && spacebarHeldRef.current) {
        e.preventDefault();
        spacebarHeldRef.current = false;
        
        if (isListening) {
          recognitionRef.current?.stop();
          setIsListening(false);
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
    };
  }, [useSpacebar, disabled, isListening]);

  const toggleListening = () => {
    if (!recognitionRef.current) return;

    if (isListening) {
      recognitionRef.current.stop();
      setIsListening(false);
    } else {
      try {
        recognitionRef.current.start();
        setIsListening(true);
      } catch (error) {
        console.error("Error starting speech recognition:", error);
      }
    }
  };

  if (!isSupported) {
    return null; // Don't show button if not supported
  }

  return (
    <button
      onClick={toggleListening}
      disabled={disabled}
      className={`p-2 rounded-lg transition-all ${
        isListening
          ? "bg-red-500/20 text-red-400 border border-red-500/50 animate-pulse"
          : "glass-card hover:scale-105 text-purple-300 border border-white/10"
      } ${disabled ? "opacity-50 cursor-not-allowed" : ""}`}
      title={isListening ? "Stop recording" : "Start voice input"}
    >
      {isListening ? (
        <div className="relative">
          <Mic className="w-5 h-5" />
          <span className="absolute -top-1 -right-1 w-2 h-2 bg-red-500 rounded-full animate-ping" />
        </div>
      ) : (
        <MicOff className="w-5 h-5" />
      )}
    </button>
  );
}

// Extend Window interface for TypeScript
declare global {
  interface Window {
    SpeechRecognition: any;
    webkitSpeechRecognition: any;
  }
}
