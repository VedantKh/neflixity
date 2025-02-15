import { useEffect, useState } from "react";

interface ExamplePromptsProps {
  prompts: string[];
  onComplete?: () => void;
}

export default function ExamplePrompts({
  prompts,
  onComplete,
}: ExamplePromptsProps) {
  const [text, setText] = useState("");
  const [isDeleting, setIsDeleting] = useState(false);
  const [promptIndex, setPromptIndex] = useState(0);
  const [isTypingPaused, setIsTypingPaused] = useState(false);

  useEffect(() => {
    let timeout: NodeJS.Timeout;

    const currentPrompt = prompts[promptIndex];
    const shouldType = !isDeleting && text.length < currentPrompt.length;
    const shouldDelete = isDeleting && text.length > 0;

    if (shouldType && !isTypingPaused) {
      timeout = setTimeout(() => {
        setText(currentPrompt.slice(0, text.length + 1));
        if (text.length + 1 === currentPrompt.length) {
          setIsTypingPaused(true);
          setTimeout(() => {
            setIsTypingPaused(false);
            setIsDeleting(true);
          }, 1500); // Pause at the end of typing
        }
      }, 30); // Typing speed
    } else if (shouldDelete) {
      timeout = setTimeout(() => {
        setText(text.slice(0, -1));
        if (text.length === 1) {
          setIsDeleting(false);
          setPromptIndex((prev) => (prev + 1) % prompts.length);
        }
      }, 30); // Deleting speed
    }

    return () => clearTimeout(timeout);
  }, [text, isDeleting, promptIndex, prompts, isTypingPaused]);

  return (
    <div className="text-white/70 text-lg min-h-[2em] font-light">
      {text}
      <span className="inline-block w-[2px] h-[0.75em] bg-white/70 ml-1 animate-pulse" />
    </div>
  );
}
