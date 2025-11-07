import { ExerciseCard } from '../ui/ExerciseCard';

export const FavoritesTab = ({ fullFavorites, setSelectedExercise, setIsModalOpen, setCurrentGifIndex, quickAdd }) => {
  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
      {fullFavorites.length === 0 ? (
        <p className="col-span-full text-center text-white/50 py-20 text-xl">
          No favorites yet. Tap ♥ in library!
        </p>
      ) : (
        fullFavorites.map(ex => (
          <ExerciseCard
            key={ex.id || ex.exerciseId}
            exercise={ex}
            onClick={() => {
              setSelectedExercise(ex);
              setCurrentGifIndex(0);
              setIsModalOpen(true);
            }}
            onQuickAdd={quickAdd}
          />
        ))
      )}
    </div>
  );
};