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

    // API exercise id (or fallback to whatever we have)
    const apiExerciseId = ex.exerciseId || ex.id;

    try {
      const full = await fetchExerciseDetails(apiExerciseId);
      const gif = full?.previewImage || full?.images?.[0]?.image || full?.gifUrl || FALLBACK_GIF;

      // IMPORTANT: never overwrite db primary key id. Strip id from full.
      const { id: _apiId, ...fullRest } = full || {};

      return {
        // keep original object first to preserve db id if present
        ...ex,
        // merge fetched details without 'id' to avoid clobbering db id
        ...fullRest,
        exerciseId: apiExerciseId,     // API exercise id
        gifUrl: gif,
        // ensure id remains the db row id when it exists (from todayWorkout),
        // otherwise for pure API objects it's already the API id which is fine for adds.
        id: ex.id
      };
    } catch {
      return { 
        ...ex, 
        exerciseId: apiExerciseId, 
        gifUrl: ex.gifUrl || FALLBACK_GIF,
        id: ex.id
      };
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