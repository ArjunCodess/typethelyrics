import { memo } from "react";
import { Timer as TimerIcon } from "lucide-react";

interface TimerProps {
  elapsedTime: number;
}

const Timer = memo(({ elapsedTime }: TimerProps) => {
  const formatTime = (seconds: number) => {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
  };

  return (
    <div className="flex items-center gap-2 text-primary">
      <TimerIcon className="w-4 h-4" />
      <span className="font-mono text-lg">{formatTime(elapsedTime)}</span>
    </div>
  );
});

Timer.displayName = 'Timer';

export default Timer; 