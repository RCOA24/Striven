import { setActivePlan } from '../../../utils/db'; // ← Add this if you want direct access

export const PlansTab = ({ plans, activePlan, activatePlan, openEditPlan, deletePlan }) => {
  return (
    <div className="space-y-6">
      <button
        onClick={() => openEditPlan({ id: null, name: '', days: [] })}
        className="w-full bg-gradient-to-r from-emerald-500 to-green-600 rounded-3xl p-8 text-black font-bold text-2xl hover:scale-105 transition-all"
      >
        + Create New Plan
      </button>

      {plans.length === 0 ? (
        <p className="text-center text-white/50 py-20 text-2xl">No plans yet. Create one!</p>
      ) : (
        plans.map(plan => (
          <div key={plan.id} className="bg-white/5 backdrop-blur-xl rounded-3xl p-6 border border-white/10">
            <div className="flex flex-wrap justify-between items-center gap-4 mb-4">
              <h3 className="text-2xl font-bold">{plan.name}</h3>
              <div className="flex flex-wrap gap-2">
                {activePlan?.id === plan.id && <span className="bg-emerald-500 text-black px-4 py-2 rounded-full text-sm font-bold">Active ✅</span>}
                <button onClick={() => activatePlan(plan.id)} className="bg-emerald-500 hover:bg-emerald-400 px-6 py-3 rounded-xl font-bold text-sm">
                  Activate
                </button>
                <button onClick={() => openEditPlan(plan)} className="bg-blue-500 hover:bg-blue-400 px-6 py-3 rounded-xl font-bold text-sm">
                  Edit
                </button>
                <button onClick={() => deletePlan(plan.id)} className="bg-red-600 hover:bg-red-500 px-6 py-3 rounded-xl font-bold text-sm">
                  Delete
                </button>
              </div>
            </div>
            <div className="grid grid-cols-7 gap-2 text-xs">
              {plan.days.map((d, i) => (
                <div key={i} className="bg-white/5 rounded-xl p-2 text-center">
                  <div className="font-bold text-emerald-400">{d.day.slice(0, 3)}</div>
                  <div className="text-white/60">{d.exercises.length}</div>
                </div>
              ))}
            </div>
          </div>
        ))
      )}
    </div>
  );
};