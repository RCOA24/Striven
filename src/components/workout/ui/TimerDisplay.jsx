export const TimerDisplay = ({ seconds, isResting, formatTime }) => {
  if (seconds <= 0) return null;
  return (
    <div className="bg-white/10 backdrop-blur-xl rounded-3xl p-8 text-center mb-8">
      <div className="text-8xl font-bold">{formatTime(seconds)}</div>
      <p className="text-3xl">{isResting ? 'Rest' : 'Work'}</p>
    </div>
  );
};