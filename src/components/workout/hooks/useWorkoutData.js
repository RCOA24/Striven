import { useState, useEffect, useRef } from 'react';
import toast from 'react-hot-toast';
import { 
  getTodayWorkout, getFavorites, getWorkoutPlans, getActivePlan, getExerciseHistory 
} from '../../../utils/db';
import { fetchExerciseDetails } from '../../../api/exercises';

const FALLBACK_GIF = 'https://via.placeholder.com/400x300/1a1a1a/ffffff?text=No+GIF';

export const useWorkoutData = () => {
  const [todayExercises, setTodayExercises] = useState([]);
  const [fullFavorites, setFullFavorites] = useState([]);
  const [plans, setPlans] = useState([]);
  const [activePlan, setActivePlan] = useState(null);
  const [exerciseHistory, setExerciseHistory] = useState({});
  const lastToastTime = useRef(0);

  const enrichWithGif = async (ex) => {
    if (!ex) return { ...ex, gifUrl: FALLBACK_GIF };
    const id = ex.exerciseId || ex.id;
    if (!id) return { ...ex, gifUrl: FALLBACK_GIF };

    try {
      const full = await fetchExerciseDetails(id);
      const gif = full?.previewImage || full?.images?.[0]?.image || full?.gifUrl || FALLBACK_GIF;
      return { 
        ...ex, 
        ...full, 
        id: full.id || ex.id,
        exerciseId: id,
        gifUrl: gif 
      };
    } catch {
      return { ...ex, id: ex.id || id, exerciseId: id, gifUrl: ex.gifUrl || FALLBACK_GIF };
    }
  };

  const loadAllData = async () => {
    try {
      const [todayRaw = [], favsRaw = [], allPlans = [], active] = await Promise.all([
        getTodayWorkout().catch(() => []),
        getFavorites().catch(() => []),
        getWorkoutPlans().catch(() => []),
        getActivePlan().catch(() => null)
      ]);

      const todayEnriched = await Promise.all(todayRaw.map(enrichWithGif));
      setTodayExercises(todayEnriched);

      const favsEnriched = await Promise.all(favsRaw.map(enrichWithGif));
      setFullFavorites(favsEnriched);

      const plansEnriched = await Promise.all(
        allPlans.map(async (plan) => {
          try {
            const days = await Promise.all(
              (plan.days || []).map(async (day) => ({
                ...day,
                exercises: await Promise.all((day.exercises || []).map(enrichWithGif))
              }))
            );
            return { ...plan, days };
          } catch {
            return plan;
          }
        })
      );
      setPlans(plansEnriched);
      setActivePlan(active);

      const history = {};
      for (const ex of todayEnriched) {
        const exId = ex.exerciseId || ex.id;
        try {
          const hist = await getExerciseHistory(exId);
          const logs = hist?.logs || [];
          const pr = logs.reduce((max, log) => {
            const est1RM = log.weight * (1 + log.reps / 30);
            return Math.max(max, est1RM);
          }, 0);
          history[exId] = { logs, pr: pr.toFixed(1) };
        } catch {
          history[exId] = { logs: [], pr: 0 };
        }
      }
      setExerciseHistory(history);

    } catch (err) {
      const now = Date.now();
      if (now - lastToastTime.current > 10000) {
        toast.error('Syncing...');
        lastToastTime.current = now;
      }
    }
  };

  useEffect(() => {
    loadAllData();
    const handler = () => loadAllData();
    window.addEventListener('striven:data-changed', handler);
    return () => window.removeEventListener('striven:data-changed', handler);
  }, []);

  return {
    todayExercises, setTodayExercises,
    fullFavorites,
    plans, setPlans,
    activePlan, setActivePlan,
    exerciseHistory, setExerciseHistory,
    loadAllData,
    enrichWithGif
  };
};