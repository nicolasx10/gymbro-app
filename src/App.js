import React, { useState, useEffect } from 'react';
import { initializeApp } from 'firebase/app';
import { getAuth, signInAnonymously, onAuthStateChanged } from 'firebase/auth';
import { getFirestore, doc, getDoc, setDoc, onSnapshot, updateDoc, collection, query, getDocs } from 'firebase/firestore';
import { Dumbbell, Flame, TrendingUp, BookOpen, Weight, ArrowLeft, CheckCircle, BarChart2, UtensilsCrossed, Home, Edit, ChevronDown, PlusCircle, Timer, User } from 'lucide-react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';

// --- DATOS DEL PLAN (ENTRENAMIENTO Y NUTRICIÓN) ---
const planData = {
  fases: [
    { id: 1, nombre: "Fase 1: Reactivación y Maestría Técnica", duracionSemanas: 4, descripcion: "Reaclimatar de forma segura todo su sistema musculoesquelético y cardiovascular. El objetivo es cero lesiones y una forma perfecta.", horario: { Lunes: "Entrenamiento A", Martes: "Recuperación Activa", Miércoles: "Entrenamiento B", Jueves: "Recuperación Activa", Viernes: "Entrenamiento A", Sábado: "Recuperación Activa o Descanso", Domingo: "Descanso Completo" } },
    { id: 2, nombre: "Fase 2: Construcción de Fuerza e Impulso", duracionSemanas: 8, descripcion: "Introducir la sobrecarga progresiva de manera más agresiva con una división Superior/Inferior.", horario: { Lunes: "Superior A", Martes: "Inferior A", Miércoles: "Recuperación Activa", Jueves: "Superior B", Viernes: "Inferior B", Sábado: "Recuperación Activa", Domingo: "Descanso Completo" } },
    { id: 3, nombre: "Fase 3: Forjando Agilidad y Potencia", duracionSemanas: Infinity, descripcion: "Traducir su 'fuerza de gimnasio' en un movimiento atlético y funcional.", horario: { Lunes: "Superior A (Modificado)", Martes: "Inferior A (Modificado)", Miércoles: "Recuperación Activa", Jueves: "Superior B (Modificado)", Viernes: "Inferior B (Modificado)", Sábado: "Recuperación Activa", Domingo: "Descanso Completo" } }
  ],
  nutricion: {
    entrenamientoBase: {
        titulo: "Día de Acondicionamiento",
        objetivo: "Maximizar la Pérdida de Grasa y Construir Hábitos. Crear un déficit calórico consistente y sostenible para iniciar la pérdida de grasa, mientras se consume suficiente proteína para preservar la masa muscular.",
        macros: { calorias: 2650, proteina: 180, grasas: 75, carbohidratos: 315 },
        timing: "El objetivo aquí es la simplicidad y la gestión del hambre. Distribuir la proteína a lo largo del día es clave. La comida pre-entrenamiento debe ser ligera y la post-entrenamiento, rica en proteína y carbohidratos para la recuperación.",
        ejemploComidas: [
          { momento: "Desayuno", comida: "4 huevos revueltos con espinacas, 1/2 aguacate, 1 rebanada de pan integral.", proposito: "Proteína y grasas saludables para la saciedad matutina." },
          { momento: "Almuerzo", comida: "Ensalada grande con 180g de pechuga de pollo a la plancha, vegetales mixtos, y un aderezo a base de aceite de oliva.", proposito: "Comida rica en nutrientes y fibra, baja en calorías." },
          { momento: "Pre-Entrenamiento", comida: "1 yogur griego natural (170g) con 1 plátano en rodajas.", proposito: "Energía rápida y proteína de fácil digestión." },
          { momento: "Cena (Post-Entrenamiento)", comida: "200g de salmón al horno, 1 taza (cocida) de quinoa, brócoli al vapor.", proposito: "Repone glucógeno y maximiza la reparación muscular." },
        ]
    },
    entrenamientoFuerza: {
        titulo: "Día de Entrenamiento de Fuerza",
        objetivo: "Potenciar la Ganancia de Fuerza. Aumentar ligeramente la ingesta calórica, especialmente de carbohidratos, para proporcionar el combustible necesario para levantar pesos más pesados.",
        macros: { calorias: 3050, proteina: 180, grasas: 75, carbohidratos: 415 },
        timing: "El 'timing' se vuelve más importante. Agruparemos los carbohidratos alrededor de sus entrenamientos. La comida post-entrenamiento es la más importante del día.",
        ejemploComidas: [
            { momento: "Desayuno", comida: "1 taza de avena cocida con 1 scoop de proteína en polvo, frutos rojos y un puñado de almendras.", proposito: "Carbohidratos complejos y proteína para empezar el día." },
            { momento: "Almuerzo (Pre-Entrenamiento)", comida: "180g de carne magra (lomo), 1.5 tazas de arroz integral, ensalada de hojas verdes.", proposito: "Energía sostenida para un entrenamiento intenso." },
            { momento: "Cena (Post-Entrenamiento)", comida: "200g de pechuga de pollo, 2 batatas medianas asadas, espárragos.", proposito: "Comida anabólica completa para la reconstrucción." },
            { momento: "Snack Nocturno", comida: "1 taza de queso cottage o yogur griego.", proposito: "Proteína de digestión lenta para la recuperación nocturna." },
        ]
    },
    recuperacionActiva: {
        titulo: "Día de Recuperación Activa",
        objetivo: "Promover la reparación muscular y reponer las reservas de energía sin un exceso calórico. El enfoque está en los micronutrientes y la hidratación.",
        macros: { calorias: 2500, proteina: 180, grasas: 80, carbohidratos: 265 },
        timing: "Las comidas se distribuyen uniformemente a lo largo del día para mantener un suministro constante de nutrientes. Se reducen los carbohidratos ya que la demanda de energía es menor.",
        ejemploComidas: [
            { momento: "Desayuno", comida: "Tortilla de 4 huevos con vegetales variados (pimientos, cebolla, champiñones) y 1/2 aguacate.", proposito: "Alto en proteína y grasas saludables para la recuperación." },
            { momento: "Almuerzo", comida: "Gran ensalada con 200g de atún o salmón, lentejas, y una variedad de hojas verdes y vegetales coloridos.", proposito: "Anti-inflamatorio y rico en nutrientes." },
            { momento: "Snack", comida: "Un puñado de nueces y una manzana.", proposito: "Fibra, grasas saludables y energía de liberación lenta." },
            { momento: "Cena", comida: "180g de pechuga de pavo a la plancha con una gran porción de vegetales asados (brócoli, coliflor, zanahorias).", proposito: "Proteína magra y fibra para la saciedad nocturna." },
        ]
    },
    descansoCompleto: {
        titulo: "Día de Descanso Completo",
        objetivo: "Maximizar la recuperación y la reparación de tejidos. Las calorías son las más bajas de la semana, pero la proteína se mantiene alta.",
        macros: { calorias: 2300, proteina: 180, grasas: 70, carbohidratos: 237 },
        timing: "Comidas enfocadas en la densidad de nutrientes. Es un buen día para priorizar grasas saludables como el pescado, los frutos secos y el aguacate.",
        ejemploComidas: [
            { momento: "Desayuno", comida: "Yogur griego alto en proteínas (200g) con frutos rojos y semillas de chía.", proposito: "Proteína de digestión lenta y fibra." },
            { momento: "Almuerzo", comida: "Sopa de lentejas con verduras y una porción de 150g de pollo desmenuzado.", proposito: "Hidratante, saciante y rico en nutrientes." },
            { momento: "Snack", comida: "2 huevos duros y un puñado de almendras.", proposito: "Proteína y grasas para mantener la energía estable." },
            { momento: "Cena", comida: "200g de filete de ternera magra a la plancha con espárragos y champiñones salteados.", proposito: "Hierro, zinc y proteína para una recuperación óptima." },
        ]
    }
  },
  entrenamientos: {
    "Entrenamiento A": [{ id: "e1", nombre: "Prensa de Piernas", series: 3, reps: "12-15", musculos: "Cuádriceps, Glúteos", img: "https://placehold.co/600x400/1e293b/94a3b8?text=Prensa+de+Piernas" }, { id: "e2", nombre: "Curl de Isquiotibiales Sentado", series: 3, reps: "12-15", musculos: "Isquiotibiales", img: "https://placehold.co/600x400/1e293b/94a3b8?text=Curl+de+Isquios" }, { id: "e3", nombre: "Press de Pecho en Máquina", series: 3, reps: "12-15", musculos: "Pectorales, Hombros", img: "https://placehold.co/600x400/1e293b/94a3b8?text=Press+Pecho" }, { id: "e4", nombre: "Jalón al Pecho (Agarre Ancho)", series: 3, reps: "12-15", musculos: "Dorsales, Espalda", img: "https://placehold.co/600x400/1e293b/94a3b8?text=Jalón+al+Pecho" }, { id: "e5", nombre: "Plancha Frontal", series: 3, reps: "30-45s", musculos: "Core, Abdomen", img: "https://placehold.co/600x400/1e293b/94a3b8?text=Plancha" }],
    "Entrenamiento B": [{ id: "e6", nombre: "Sentadilla de Copa (Goblet Squat)", series: 3, reps: "12-15", musculos: "Cuádriceps, Glúteos, Core", img: "https://placehold.co/600x400/1e293b/94a3b8?text=Goblet+Squat" }, { id: "e7", nombre: "Remo Sentado en Polea", series: 3, reps: "12-15", musculos: "Espalda, Dorsales", img: "https://placehold.co/600x400/1e293b/94a3b8?text=Remo+Sentado" }, { id: "e8", nombre: "Press de Banca con Mancuernas", series: 3, reps: "12-15", musculos: "Pectorales, Hombros", img: "https://placehold.co/600x400/1e293b/94a3b8?text=Press+Mancuernas" }, { id: "e9", nombre: "Face Pulls (Jalón a la Cara)", series: 3, reps: "15-20", musculos: "Hombro Posterior, Espalda Alta", img: "https://placehold.co/600x400/1e293b/94a3b8?text=Face+Pulls" }, { id: "e10", nombre: "Plancha Lateral", series: 3, reps: "20-30s/lado", musculos: "Core, Oblicuos", img: "https://placehold.co/600x400/1e293b/94a3b8?text=Plancha+Lateral" }],
    "Superior A": [{ id: "e8", nombre: "Press de Banca con Mancuernas", series: 4, reps: "8-10", musculos: "Pectorales, Hombros", img: "https://placehold.co/600x400/1e293b/94a3b8?text=Press+Mancuernas" }, { id: "e11", nombre: "Remo con Barra", series: 4, reps: "8-10", musculos: "Espalda, Dorsales", img: "https://placehold.co/600x400/1e293b/94a3b8?text=Remo+con+Barra" }, { id: "e12", nombre: "Press de Hombros Sentado (Mancuernas)", series: 3, reps: "8-12", musculos: "Hombros, Deltoides", img: "https://placehold.co/600x400/1e293b/94a3b8?text=Press+Hombro" }, { id: "e4", nombre: "Jalón al Pecho (Agarre Neutro)", series: 3, reps: "10-12", musculos: "Dorsales, Espalda", img: "https://placehold.co/600x400/1e293b/94a3b8?text=Jalón+Neutro" }],
    "Inferior A": [{ id: "e6", nombre: "Sentadilla de Copa (Pesada)", series: 4, reps: "8-10", musculos: "Piernas, Glúteos", img: "https://placehold.co/600x400/1e293b/94a3b8?text=Goblet+Squat" }, { id: "e13", nombre: "Peso Muerto Rumano (Mancuernas)", series: 4, reps: "8-12", musculos: "Isquiotibiales, Glúteos", img: "https://placehold.co/600x400/1e293b/94a3b8?text=RDL" }, { id: "e1", nombre: "Prensa de Piernas", series: 3, reps: "10-12", musculos: "Cuádriceps, Glúteos", img: "https://placehold.co/600x400/1e293b/94a3b8?text=Prensa+de+Piernas" }],
    "Superior B": [{ id: "e14", nombre: "Press Inclinado con Mancuernas", series: 3, reps: "10-12", musculos: "Pectoral Superior, Hombros", img: "https://placehold.co/600x400/1e293b/94a3b8?text=Press+Inclinado" }, { id: "e7", nombre: "Remo Sentado en Polea (Agarre Ancho)", series: 3, reps: "10-12", musculos: "Espalda Alta, Romboides", img: "https://placehold.co/600x400/1e293b/94a3b8?text=Remo+Ancho" }, { id: "e15", nombre: "Elevaciones Laterales con Mancuernas", series: 3, reps: "12-15", musculos: "Hombro Lateral", img: "https://placehold.co/600x400/1e293b/94a3b8?text=Elevaciones+Laterales" }, { id: "e9", nombre: "Face Pulls", series: 3, reps: "15-20", musculos: "Hombro Posterior, Espalda Alta", img: "https://placehold.co/600x400/1e293b/94a3b8?text=Face+Pulls" }],
    "Inferior B": [{ id: "e16", nombre: "Zancadas Caminando con Mancuernas", series: 3, reps: "10-12/pierna", musculos: "Piernas, Glúteos", img: "https://placehold.co/600x400/1e293b/94a3b8?text=Zancadas" }, { id: "e17", nombre: "Extensiones de Cuádriceps", series: 3, reps: "12-15", musculos: "Cuádriceps", img: "https://placehold.co/600x400/1e293b/94a3b8?text=Extensiones+Quads" }, { id: "e2", nombre: "Curl de Isquiotibiales Tumbado", series: 3, reps: "12-15", musculos: "Isquiotibiales", img: "https://placehold.co/600x400/1e293b/94a3b8?text=Curl+Tumbado" }],
  }
};

// --- CONFIGURACIÓN PARA DESPLIEGUE ---
const firebaseConfig = {
    apiKey: process.env.REACT_APP_API_KEY,
    authDomain: process.env.REACT_APP_AUTH_DOMAIN,
    projectId: process.env.REACT_APP_PROJECT_ID,
    storageBucket: process.env.REACT_APP_STORAGE_BUCKET,
    messagingSenderId: process.env.REACT_APP_MESSAGING_SENDER_ID,
    appId: process.env.REACT_APP_APP_ID
};
const appId = 'gymbro-app-prod';

const LoadingSpinner = () => <div className="flex justify-center items-center h-full w-full"><div className="animate-spin rounded-full h-16 w-16 border-t-2 border-b-2 border-indigo-500"></div></div>;

const ExerciseDetailModal = ({ exercise, onClose }) => {
  if (!exercise) return null;
  return (<div className="fixed inset-0 bg-black bg-opacity-75 flex justify-center items-center z-50 p-4"><div className="bg-slate-800 rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto"><div className="p-6"><div className="flex justify-between items-start"><h2 className="text-2xl font-bold text-white mb-2">{exercise.nombre}</h2><button onClick={onClose} className="text-slate-400 hover:text-white text-3xl">&times;</button></div><p className="text-indigo-400 font-semibold mb-4">{exercise.musculos}</p><img src={exercise.img} alt={`Ilustración de ${exercise.nombre}`} className="w-full h-auto object-cover rounded-lg mb-4" /><p className="text-slate-300 whitespace-pre-wrap">{exercise.desc}</p></div></div></div>);
};

const RestTimer = ({ setIndex, onTimerComplete }) => {
    const REST_DURATION = 90;
    const [timeLeft, setTimeLeft] = useState(REST_DURATION);

    useEffect(() => {
        if (timeLeft === 0) {
            onTimerComplete(setIndex);
            return;
        }
        const intervalId = setInterval(() => {
            setTimeLeft(timeLeft - 1);
        }, 1000);
        return () => clearInterval(intervalId);
    }, [timeLeft, onTimerComplete, setIndex]);
    
    const progress = (timeLeft / REST_DURATION) * 100;

    return (
        <div className="col-span-4 flex items-center gap-2 bg-indigo-500/20 p-2 rounded-md">
            <Timer className="text-indigo-400" size={20} />
            <div className="w-full bg-slate-600 rounded-full h-2.5">
                <div className="bg-indigo-500 h-2.5 rounded-full" style={{ width: `${progress}%` }}></div>
            </div>
            <span className="font-bold text-lg text-white">{timeLeft}s</span>
        </div>
    );
};

const ExerciseCard = ({ exercise, onLogChange, log, onOpenDetail }) => {
  const [sets, setSets] = useState(log || Array(exercise.series).fill({ reps: '', weight: '' }));
  const [restingSet, setRestingSet] = useState(null);

  const handleSetChange = (index, field, value) => { 
    const newSets = [...sets]; 
    newSets[index] = { ...newSets[index], [field]: value }; 
    setSets(newSets); 
    onLogChange(exercise.id, newSets); 
  };
  
  const handleStartRest = (index) => {
      setRestingSet(index);
  }

  return (<div className="bg-slate-800 p-4 rounded-lg shadow-md transition-all hover:shadow-indigo-500/20"><div className="flex justify-between items-center mb-3"><h3 className="text-lg font-semibold text-white">{exercise.nombre}</h3><button onClick={() => onOpenDetail(exercise)} className="text-indigo-400 hover:text-indigo-300"><BookOpen size={20} /></button></div><p className="text-sm text-slate-400 mb-4">{exercise.series} series x {exercise.reps} reps</p><div className="space-y-3">{Array.from({ length: exercise.series }).map((_, i) => (
      <div key={i}>
          { restingSet === i ? (
              <RestTimer setIndex={i} onTimerComplete={() => setRestingSet(null)} />
          ) : (
            <div className="grid grid-cols-4 gap-2 items-center">
                <span className="text-slate-300 font-medium">Serie {i + 1}</span>
                <input type="number" placeholder="Reps" value={sets[i]?.reps || ''} onChange={(e) => handleSetChange(i, 'reps', e.target.value)} className="w-full bg-slate-700 text-white placeholder-slate-500 border border-slate-600 rounded-md px-2 py-1 text-center" />
                <input type="number" placeholder="Peso (kg)" value={sets[i]?.weight || ''} onChange={(e) => handleSetChange(i, 'weight', e.target.value)} className="w-full bg-slate-700 text-white placeholder-slate-500 border border-slate-600 rounded-md px-2 py-1 text-center" />
                <button onClick={() => handleStartRest(i)} disabled={!sets[i]?.reps || !sets[i]?.weight} className="p-2 bg-slate-700 rounded-md disabled:opacity-50 disabled:cursor-not-allowed"><Timer size={18} className="mx-auto text-indigo-400"/></button>
            </div>
          )}
      </div>
  ))}</div></div>);
};

const WorkoutView = ({ workoutName, onBack, db, userId }) => {
  const today = new Date().toISOString().split('T')[0];
  let workout = planData.entrenamientos[workoutName] || [];
  const [logs, setLogs] = useState({});
  const [isSaving, setIsSaving] = useState(false);
  const [selectedExercise, setSelectedExercise] = useState(null);
  const [workoutCompleted, setWorkoutCompleted] = useState(false);

  useEffect(() => {
    const fetchLogs = async () => {
      if (!db || !userId) return;
      const docRef = doc(db, `artifacts/${appId}/users/${userId}/workoutLogs`, today);
      const docSnap = await getDoc(docRef);
      if (docSnap.exists() && docSnap.data().workoutName === workoutName) {
        const data = docSnap.data(); setLogs(data.exercises || {}); setWorkoutCompleted(data.completed || false);
      }
    };
    fetchLogs();
  }, [db, userId, today, workoutName]);

  const handleLogChange = (exerciseId, sets) => { setLogs(prev => ({ ...prev, [exerciseId]: sets })); };

  const handleSaveWorkout = async () => {
    if (!db || !userId) return; setIsSaving(true); 
    
    // PR Logic
    for (const exerciseId in logs) {
        const exerciseLog = logs[exerciseId];
        const prRef = doc(db, `artifacts/${appId}/users/${userId}/personalRecords`, exerciseId);
        const prSnap = await getDoc(prRef);
        let currentBestWeight = 0;
        if(prSnap.exists()) {
            currentBestWeight = prSnap.data().bestWeight || 0;
        }

        let newBestWeight = currentBestWeight;
        let newBestSet = prSnap.exists() ? prSnap.data().bestSet : {};

        exerciseLog.forEach(set => {
            const weight = parseFloat(set.weight);
            if (weight > newBestWeight) {
                newBestWeight = weight;
                newBestSet = { weight: weight, reps: parseInt(set.reps) };
            }
        });

        if (newBestWeight > currentBestWeight) {
            const exerciseName = (Object.values(planData.entrenamientos).flat().find(ex => ex.id === exerciseId) || {}).nombre;
            await setDoc(prRef, { bestWeight: newBestWeight, bestSet: newBestSet, date: today, exerciseName: exerciseName }, { merge: true });
        }
    }

    const docRef = doc(db, `artifacts/${appId}/users/${userId}/workoutLogs`, today);
    try { await setDoc(docRef, { workoutName: workoutName, exercises: logs, completed: true, date: today }, { merge: true }); setWorkoutCompleted(true); } catch (error) { console.error("Error al guardar el entrenamiento: ", error); } finally { setIsSaving(false); }
  };

  if (!workout.length) {
    const modifiedName = workoutName.replace(" (Modificado)", "");
    const baseWorkout = planData.entrenamientos[modifiedName] || [];
    if (baseWorkout.length) { workout = baseWorkout; } else { return (<div className="p-4 text-white"><button onClick={onBack} className="flex items-center gap-2 bg-slate-700 text-white py-2 px-4 rounded-lg hover:bg-slate-600 mb-4"><ArrowLeft size={20} /> Volver</button><h2 className="text-2xl font-bold">Entrenamiento no encontrado</h2><p>La rutina para "{workoutName}" aún no ha sido detallada.</p></div>); }
  }

  return (<div className="p-4 md:p-6"><button onClick={onBack} className="flex items-center gap-2 bg-slate-700 text-white py-2 px-4 rounded-lg hover:bg-slate-600 mb-4"><ArrowLeft size={20} /> Volver</button><h2 className="text-3xl font-bold text-white mb-2">{workoutName}</h2><p className="text-slate-400 mb-6">Registra tus series y pesos para cada ejercicio.</p><div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">{workout.map(ex => <ExerciseCard key={ex.id} exercise={ex} onLogChange={handleLogChange} log={logs[ex.id]} onOpenDetail={setSelectedExercise} />)}</div><div className="mt-8 text-center">{workoutCompleted ? (<div className="inline-flex items-center gap-2 bg-green-500/20 text-green-400 py-3 px-6 rounded-lg"><CheckCircle size={24} /><span>Entrenamiento completado y guardado. ¡Gran trabajo!</span></div>) : (<button onClick={handleSaveWorkout} disabled={isSaving} className="bg-indigo-600 text-white font-bold py-3 px-8 rounded-lg hover:bg-indigo-700 disabled:bg-indigo-400 transition-all text-lg">{isSaving ? 'Guardando...' : 'Completar y Guardar Entrenamiento'}</button>)}</div><ExerciseDetailModal exercise={selectedExercise} onClose={() => setSelectedExercise(null)} /></div>);
};

const Dashboard = ({ userProfile, onStartWorkout, db, userId }) => {
  const [newWeight, setNewWeight] = useState('');
  const [showWeightModal, setShowWeightModal] = useState(false);
  
  if (!userProfile) return <LoadingSpinner />;

  const startDate = new Date(userProfile.startDate);
  const today = new Date();
  const weeksElapsed = Math.floor((today - startDate) / (1000 * 60 * 60 * 24 * 7));
  let currentPhase = planData.fases[weeksElapsed < 4 ? 0 : weeksElapsed < 12 ? 1 : 2];
  const dayOfWeek = today.toLocaleString('es-ES', { weekday: 'long' }).charAt(0).toUpperCase() + today.toLocaleString('es-ES', { weekday: 'long' }).slice(1);
  const todayActivity = currentPhase.horario[dayOfWeek] || "Descanso";
  const tmb = Math.round((10 * userProfile.weight) + (6.25 * userProfile.height) - (5 * userProfile.age) + 5);
  const tdee = Math.round(tmb * 1.375);
  const calorieTarget = Math.round(tdee * 0.80);
  const proteinTarget = 180;

  const handleWeightLog = async () => {
    if (!db || !userId || !newWeight || isNaN(parseFloat(newWeight))) return;
    const dateStr = new Date().toISOString().split('T')[0];
    const weightData = { date: dateStr, weight: parseFloat(newWeight) };
    try {
      await setDoc(doc(db, `artifacts/${appId}/users/${userId}/weightHistory`, dateStr), weightData);
      await setDoc(doc(db, `artifacts/${appId}/users/${userId}/profile`, 'data'), { weight: parseFloat(newWeight) }, { merge: true });
      setShowWeightModal(false); setNewWeight('');
    } catch (error) { console.error("Error al registrar el peso: ", error); }
  };

  return (<div className="p-4 md:p-6 text-white"><h1 className="text-3xl md:text-4xl font-bold mb-2">Gymbro</h1><p className="text-slate-400 mb-8">Hoy es {dayOfWeek}. Aquí está tu plan.</p><div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8"><div className="bg-slate-800 p-4 rounded-lg flex items-center gap-4"><Weight className="text-indigo-400" size={32}/><div><p className="text-slate-400 text-sm">Peso Actual</p><div className="flex items-baseline gap-2"><p className="text-xl font-bold">{userProfile.weight} kg</p><button onClick={() => setShowWeightModal(true)} className="text-indigo-400 hover:text-indigo-300"><Edit size={16}/></button></div></div></div><div className="bg-slate-800 p-4 rounded-lg flex items-center gap-4"><Flame className="text-red-400" size={32}/><div><p className="text-slate-400 text-sm">Calorías Objetivo</p><p className="text-xl font-bold">~{calorieTarget} kcal</p></div></div><div className="bg-slate-800 p-4 rounded-lg flex items-center gap-4"><Dumbbell className="text-green-400" size={32}/><div><p className="text-slate-400 text-sm">Proteína Objetivo</p><p className="text-xl font-bold">{proteinTarget} g</p></div></div><div className="bg-slate-800 p-4 rounded-lg flex items-center gap-4"><TrendingUp className="text-yellow-400" size={32}/><div><p className="text-slate-400 text-sm">Fase Actual</p><p className="text-xl font-bold">{currentPhase.id}</p></div></div></div><div className="bg-slate-800 p-6 rounded-lg mb-8"><h2 className="text-2xl font-bold mb-4">Actividad de Hoy: {todayActivity}</h2>{todayActivity.startsWith("Entrenamiento") || todayActivity.startsWith("Superior") || todayActivity.startsWith("Inferior") ? (<><p className="text-slate-300 mb-4">Es día de entrenamiento. Concéntrate en la técnica y la intensidad. ¡Vamos!</p><button onClick={() => onStartWorkout(todayActivity)} className="bg-indigo-600 text-white font-bold py-2 px-6 rounded-lg hover:bg-indigo-700 transition-all">Comenzar Entrenamiento</button></>) : todayActivity.startsWith("Recuperación") ? (<p className="text-slate-300">Hoy toca recuperación activa. 30-45 minutos de cardio de bajo impacto ayudarán a tu cuerpo a repararse y volver más fuerte.</p>) : (<p className="text-slate-300">Día de descanso. El crecimiento ocurre cuando descansas. Asegúrate de dormir bien y nutrir tu cuerpo.</p>)}</div>{showWeightModal && (<div className="fixed inset-0 bg-black bg-opacity-75 flex justify-center items-center z-50 p-4"><div className="bg-slate-800 rounded-lg p-6 w-full max-w-sm"><h3 className="text-xl font-bold text-white mb-4">Registrar Peso de Hoy</h3><input type="number" value={newWeight} onChange={e => setNewWeight(e.target.value)} placeholder="Introduce tu peso en kg" className="w-full bg-slate-700 text-white placeholder-slate-500 border border-slate-600 rounded-md px-3 py-2 mb-4"/><div className="flex justify-end gap-4"><button onClick={() => setShowWeightModal(false)} className="bg-slate-600 text-white py-2 px-4 rounded-lg hover:bg-slate-500">Cancelar</button><button onClick={handleWeightLog} className="bg-indigo-600 text-white py-2 px-4 rounded-lg hover:bg-indigo-700">Guardar</button></div></div></div>)}</div>);
};

const commonFoods = { 'Pechuga de Pollo a la Plancha (150g)': { calories: 248, protein: 46 }, 'Bife de Chorizo (150g)': { calories: 380, protein: 32 }, 'Salmón a la Plancha (150g)': { calories: 312, protein: 30 }, 'Lentejas Cocidas (1 taza)': { calories: 230, protein: 18 }, 'Arroz Blanco Cocido (1 taza)': { calories: 205, protein: 4 }, 'Batata Asada (1 mediana)': { calories: 180, protein: 4 }, 'Huevo Duro (1 grande)': { calories: 78, protein: 6 }, 'Yogur Griego Natural (170g)': { calories: 100, protein: 17 }, 'Avena con Agua (1/2 taza seca)': { calories: 150, protein: 5 }, 'Ensalada Mixta (plato grande)': { calories: 100, protein: 3 } };

const NutritionLogView = ({ db, userId, userProfile, onBack }) => {
    const [meals, setMeals] = useState([]);
    const [mealName, setMealName] = useState('');
    const [calories, setCalories] = useState('');
    const [protein, setProtein] = useState('');
    const today = new Date().toISOString().split('T')[0];

    useEffect(() => {
        if (!db || !userId) return;
        const nutritionLogRef = doc(db, `artifacts/${appId}/users/${userId}/nutritionLogs`, today);
        const unsubscribe = onSnapshot(nutritionLogRef, (docSnap) => { if (docSnap.exists()) { setMeals(docSnap.data().meals || []); } else { setMeals([]); } });
        return () => unsubscribe();
    }, [db, userId, today]);

    const handleFoodSelection = (e) => {
        const selectedFoodName = e.target.value;
        if (selectedFoodName && commonFoods[selectedFoodName]) {
            const food = commonFoods[selectedFoodName]; setMealName(selectedFoodName); setCalories(food.calories); setProtein(food.protein);
        }
    };

    const handleAddMeal = async (e) => {
        e.preventDefault();
        if (!db || !userId || !mealName || !calories) return;
        const newMeal = { name: mealName, calories: parseInt(calories), protein: parseInt(protein) || 0 };
        const docRef = doc(db, `artifacts/${appId}/users/${userId}/nutritionLogs`, today);
        try {
            const docSnap = await getDoc(docRef);
            if (docSnap.exists()) { await updateDoc(docRef, { meals: [...docSnap.data().meals, newMeal] }); } else { await setDoc(docRef, { meals: [newMeal], date: today }); }
            setMealName(''); setCalories(''); setProtein('');
        } catch (error) { console.error("Error al añadir comida: ", error); }
    };

    const totalCalories = meals.reduce((sum, meal) => sum + meal.calories, 0);
    const totalProtein = meals.reduce((sum, meal) => sum + meal.protein, 0);
    const tmb = Math.round((10 * userProfile.weight) + (6.25 * userProfile.height) - (5 * userProfile.age) + 5);
    const calorieTarget = Math.round(tmb * 1.375 * 0.80);
    const proteinTarget = 180;

    return (
        <div className="p-4 md:p-6 text-white">
            <button onClick={onBack} className="flex items-center gap-2 bg-slate-700 text-white py-2 px-4 rounded-lg hover:bg-slate-600 mb-6"><ArrowLeft size={20} /> Volver al Plan Nutricional</button>
            <h2 className="text-3xl font-bold text-white mb-6">Registro Nutricional de Hoy</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
                <div className="bg-slate-800 p-6 rounded-lg"><h3 className="text-xl font-bold mb-4">Calorías</h3><div className="text-4xl font-bold text-red-400">{totalCalories} <span className="text-2xl text-slate-400">/ ~{calorieTarget} kcal</span></div><div className="w-full bg-slate-700 rounded-full h-2.5 mt-4"><div className="bg-red-500 h-2.5 rounded-full" style={{ width: `${Math.min(100, (totalCalories / calorieTarget) * 100)}%` }}></div></div></div>
                <div className="bg-slate-800 p-6 rounded-lg"><h3 className="text-xl font-bold mb-4">Proteína</h3><div className="text-4xl font-bold text-green-400">{totalProtein} <span className="text-2xl text-slate-400">/ {proteinTarget} g</span></div><div className="w-full bg-slate-700 rounded-full h-2.5 mt-4"><div className="bg-green-500 h-2.5 rounded-full" style={{ width: `${Math.min(100, (totalProtein / proteinTarget) * 100)}%` }}></div></div></div>
            </div>
            <div className="bg-slate-800 p-6 rounded-lg mb-8"><h3 className="text-xl font-bold mb-4">Añadir Comida</h3><form onSubmit={handleAddMeal} className="space-y-4"><div className="relative"><select onChange={handleFoodSelection} defaultValue="" className="w-full bg-slate-700 text-white placeholder-slate-500 border border-slate-600 rounded-md px-3 py-2 appearance-none cursor-pointer"><option value="" disabled>O selecciona una comida rápida...</option>{Object.keys(commonFoods).map(foodName => (<option key={foodName} value={foodName}>{foodName}</option>))}</select><ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" /></div><div className="grid grid-cols-1 md:grid-cols-3 gap-4"><input type="text" value={mealName} onChange={e => setMealName(e.target.value)} placeholder="Nombre de la comida (o edita)" className="w-full bg-slate-700 text-white placeholder-slate-500 border border-slate-600 rounded-md px-3 py-2"/><input type="number" value={calories} onChange={e => setCalories(e.target.value)} placeholder="Calorías (kcal)" className="w-full bg-slate-700 text-white placeholder-slate-500 border border-slate-600 rounded-md px-3 py-2"/><input type="number" value={protein} onChange={e => setProtein(e.target.value)} placeholder="Proteína (g)" className="w-full bg-slate-700 text-white placeholder-slate-500 border border-slate-600 rounded-md px-3 py-2"/></div><button type="submit" className="w-full bg-indigo-600 text-white font-bold py-2 px-6 rounded-lg hover:bg-indigo-700 transition-all">Añadir Comida al Registro</button></form></div>
            <div><h3 className="text-xl font-bold mb-4">Comidas Registradas Hoy</h3><div className="space-y-3">{meals.length > 0 ? meals.map((meal, index) => (<div key={index} className="bg-slate-800 p-4 rounded-lg flex justify-between items-center"><p className="font-semibold text-white">{meal.name}</p><div className="text-right"><p className="text-red-400">{meal.calories} kcal</p><p className="text-green-400 text-sm">{meal.protein} g Prot.</p></div></div>)) : <p className="text-slate-400">Aún no has registrado ninguna comida hoy.</p>}</div></div>
        </div>
    );
};

const NutritionPlanView = ({ userProfile, onStartLogging }) => {
    const startDate = new Date(userProfile.startDate);
    const today = new Date();
    const weeksElapsed = Math.floor((today - startDate) / (1000 * 60 * 60 * 24 * 7));
    const currentPhase = planData.fases[weeksElapsed < 4 ? 0 : weeksElapsed < 12 ? 1 : 2];
    const dayOfWeek = today.toLocaleString('es-ES', { weekday: 'long' }).charAt(0).toUpperCase() + today.toLocaleString('es-ES', { weekday: 'long' }).slice(1);
    const todayActivity = currentPhase.horario[dayOfWeek] || "Descanso";
    
    let nutritionPlan;
    if (todayActivity.includes("Entrenamiento") || todayActivity.includes("Superior") || todayActivity.includes("Inferior")) {
        if (currentPhase.id === 1) {
            nutritionPlan = planData.nutricion.entrenamientoBase;
        } else {
            nutritionPlan = planData.nutricion.entrenamientoFuerza;
        }
    } else if (todayActivity.includes("Recuperación")) {
        nutritionPlan = planData.nutricion.recuperacionActiva;
    } else {
        nutritionPlan = planData.nutricion.descansoCompleto;
    }

    return (
        <div className="p-4 md:p-6 text-white">
            <h2 className="text-3xl font-bold text-white mb-2">Tu Plan Nutricional para Hoy</h2>
            <p className="text-indigo-400 font-semibold mb-6">Hoy es {dayOfWeek}, día de: {todayActivity}</p>
            
            <div className="mb-6">
                <button onClick={onStartLogging} className="w-full flex items-center justify-center gap-2 bg-indigo-600 text-white font-bold py-3 px-6 rounded-lg hover:bg-indigo-700 transition-all text-lg">
                    <PlusCircle size={22} />
                    Registrar Comidas de Hoy
                </button>
            </div>

            <div className="bg-slate-800 p-6 rounded-lg">
                <h3 className="text-2xl font-bold text-white mb-3">{nutritionPlan.titulo}</h3>
                <div className="mb-4">
                    <h4 className="font-semibold text-indigo-400 mb-1">Objetivo Primario:</h4>
                    <p className="text-slate-300">{nutritionPlan.objetivo}</p>
                </div>
                <div className="mb-4">
                    <h4 className="font-semibold text-indigo-400 mb-1">Timing de Nutrientes:</h4>
                    <p className="text-slate-300">{nutritionPlan.timing}</p>
                </div>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6 text-center">
                    <div className="bg-slate-700 p-3 rounded-md"><p className="text-sm text-slate-400">Calorías</p><p className="font-bold text-white text-lg">~{nutritionPlan.macros.calorias}</p></div>
                    <div className="bg-slate-700 p-3 rounded-md"><p className="text-sm text-slate-400">Proteínas</p><p className="font-bold text-white text-lg">{nutritionPlan.macros.proteina}g</p></div>
                    <div className="bg-slate-700 p-3 rounded-md"><p className="text-sm text-slate-400">Grasas</p><p className="font-bold text-white text-lg">{nutritionPlan.macros.grasas}g</p></div>
                    <div className="bg-slate-700 p-3 rounded-md"><p className="text-sm text-slate-400">Carbs</p><p className="font-bold text-white text-lg">{nutritionPlan.macros.carbohidratos}g</p></div>
                </div>
                <div>
                    <h4 className="font-semibold text-indigo-400 mb-2">Ejemplo de Comidas para Hoy</h4>
                    <div className="overflow-x-auto">
                        <table className="w-full text-left">
                            <thead><tr className="border-b border-slate-700"><th className="p-2">Momento</th><th className="p-2">Comida Ideal</th><th className="p-2 hidden md:table-cell">Propósito</th></tr></thead>
                            <tbody>
                                {nutritionPlan.ejemploComidas.map((item, index) => (
                                    <tr key={index} className="border-b border-slate-700"><td className="p-2 font-semibold">{item.momento}</td><td className="p-2">{item.comida}</td><td className="p-2 text-slate-400 hidden md:table-cell">{item.proposito}</td></tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>
        </div>
    );
};

const ProgressView = ({ db, userId }) => {
    const [weightData, setWeightData] = useState([]);
    const [personalRecords, setPersonalRecords] = useState([]);
    const [view, setView] = useState('graphs'); // 'graphs' or 'prs'

    useEffect(() => {
        if (!db || !userId) return;
        const fetchWeightData = async () => {
            const weightQuery = query(collection(db, `artifacts/${appId}/users/${userId}/weightHistory`));
            const weightSnapshot = await getDocs(weightQuery);
            const weights = weightSnapshot.docs.map(d => d.data()).sort((a, b) => new Date(a.date) - new Date(b.date));
            setWeightData(weights);
        };

        const prsRef = collection(db, `artifacts/${appId}/users/${userId}/personalRecords`);
        const unsubscribe = onSnapshot(prsRef, (snapshot) => {
            const records = snapshot.docs.map(d => ({ id: d.id, ...d.data() }));
            setPersonalRecords(records);
        });
        
        fetchWeightData();
        return () => unsubscribe();
    }, [db, userId]);

    return (
        <div className="p-4 md:p-6 text-white">
            <h2 className="text-3xl font-bold text-white mb-4">Tu Progreso</h2>
            <div className="flex border-b border-slate-700 mb-6">
                <button onClick={() => setView('graphs')} className={`py-2 px-4 font-semibold ${view === 'graphs' ? 'text-indigo-400 border-b-2 border-indigo-400' : 'text-slate-400'}`}>Gráficos</button>
                <button onClick={() => setView('prs')} className={`py-2 px-4 font-semibold ${view === 'prs' ? 'text-indigo-400 border-b-2 border-indigo-400' : 'text-slate-400'}`}>Récords Personales</button>
            </div>

            {view === 'graphs' && (
                <div className="space-y-8">
                    <div className="bg-slate-800 p-6 rounded-lg"><h3 className="text-xl font-bold mb-4">Evolución del Peso Corporal</h3>{weightData.length > 1 ? (<ResponsiveContainer width="100%" height={300}><LineChart data={weightData}><CartesianGrid strokeDasharray="3 3" stroke="#374151" /><XAxis dataKey="date" stroke="#9ca3af" /><YAxis stroke="#9ca3af" domain={['dataMin - 5', 'dataMax + 5']} /><Tooltip contentStyle={{ backgroundColor: '#1f2937', border: 'none' }} /><Legend /><Line type="monotone" dataKey="weight" stroke="#818cf8" strokeWidth={2} name="Peso (kg)" /></LineChart></ResponsiveContainer>) : <p className="text-slate-400">Necesitas registrar tu peso en al menos dos días diferentes para ver un gráfico.</p>}</div>
                </div>
            )}
            {view === 'prs' && (
                <div className="bg-slate-800 p-6 rounded-lg">
                    <h3 className="text-xl font-bold mb-4">Mejores Levantamientos</h3>
                    {personalRecords.length > 0 ? (
                        <div className="space-y-4">
                            {personalRecords.map(pr => (
                                <div key={pr.id} className="bg-slate-700 p-4 rounded-lg flex justify-between items-center">
                                    <div>
                                        <p className="font-bold text-white">{pr.exerciseName}</p>
                                        <p className="text-sm text-slate-400">Fecha: {pr.date}</p>
                                    </div>
                                    <div className="text-right">
                                        <p className="text-2xl font-bold text-indigo-400">{pr.bestWeight} kg</p>
                                        <p className="text-sm text-white">{pr.bestSet.reps} reps</p>
                                    </div>
                                </div>
                            ))}
                        </div>
                    ) : (
                        <p className="text-slate-400">Aún no has establecido ningún récord. ¡Completa un entrenamiento para empezar a registrar tus mejores marcas!</p>
                    )}
                </div>
            )}
        </div>
    );
};

const ProfileView = ({ userProfile, db, userId }) => {
    const [profileData, setProfileData] = useState(userProfile);
    const [isSaving, setIsSaving] = useState(false);

    useEffect(() => {
        setProfileData(userProfile);
    }, [userProfile]);

    const handleChange = (e) => {
        const { name, value } = e.target;
        setProfileData(prev => ({ ...prev, [name]: value }));
    };

    const handleSave = async () => {
        if (!db || !userId) return;
        setIsSaving(true);
        const profileRef = doc(db, `artifacts/${appId}/users/${userId}/profile`, 'data');
        try {
            await setDoc(profileRef, {
                ...profileData,
                age: parseInt(profileData.age),
                height: parseInt(profileData.height),
                weight: parseFloat(profileData.weight)
            }, { merge: true });
        } catch (error) {
            console.error("Error al actualizar el perfil:", error);
        } finally {
            setIsSaving(false);
        }
    };

    return (
        <div className="p-4 md:p-6 text-white">
            <h2 className="text-3xl font-bold text-white mb-8">Tu Perfil</h2>
            <div className="bg-slate-800 p-6 rounded-lg max-w-md mx-auto">
                <div className="space-y-4">
                    <div>
                        <label htmlFor="age" className="block text-sm font-medium text-slate-300 mb-1">Edad</label>
                        <input type="number" name="age" id="age" value={profileData.age} onChange={handleChange} className="w-full bg-slate-700 text-white placeholder-slate-500 border border-slate-600 rounded-md px-3 py-2"/>
                    </div>
                    <div>
                        <label htmlFor="height" className="block text-sm font-medium text-slate-300 mb-1">Altura (cm)</label>
                        <input type="number" name="height" id="height" value={profileData.height} onChange={handleChange} className="w-full bg-slate-700 text-white placeholder-slate-500 border border-slate-600 rounded-md px-3 py-2"/>
                    </div>
                    <div>
                        <label htmlFor="weight" className="block text-sm font-medium text-slate-300 mb-1">Peso (kg)</label>
                        <input type="number" step="0.1" name="weight" id="weight" value={profileData.weight} onChange={handleChange} className="w-full bg-slate-700 text-white placeholder-slate-500 border border-slate-600 rounded-md px-3 py-2"/>
                    </div>
                    <button onClick={handleSave} disabled={isSaving} className="w-full bg-indigo-600 text-white font-bold py-2 px-6 rounded-lg hover:bg-indigo-700 disabled:bg-indigo-400 transition-all">
                        {isSaving ? 'Guardando...' : 'Guardar Cambios'}
                    </button>
                </div>
            </div>
        </div>
    );
};

const PhaseDetailView = ({ phase, onStartWorkout, onBack }) => {
    return (
        <div className="p-4 md:p-6 text-white">
            <button onClick={onBack} className="flex items-center gap-2 bg-slate-700 text-white py-2 px-4 rounded-lg hover:bg-slate-600 mb-6"><ArrowLeft size={20} /> Volver a Fases</button>
            <h2 className="text-3xl font-bold text-white mb-2">{phase.nombre}</h2>
            <p className="text-slate-400 mb-6">{phase.descripcion}</p>
            <div className="space-y-3">
                {Object.entries(phase.horario).map(([dia, actividad]) => (
                    <div key={dia} className="bg-slate-800 p-4 rounded-lg flex justify-between items-center">
                        <div>
                            <p className="font-bold text-white">{dia}</p>
                            <p className="text-indigo-400">{actividad}</p>
                        </div>
                        {(actividad.startsWith("Entrenamiento") || actividad.startsWith("Superior") || actividad.startsWith("Inferior")) && (
                            <button onClick={() => onStartWorkout(actividad)} className="bg-indigo-600 text-white font-bold py-2 px-4 rounded-lg hover:bg-indigo-700 transition-all">
                                Empezar
                            </button>
                        )}
                    </div>
                ))}
            </div>
        </div>
    );
};

const TrainingPlanView = ({ onStartWorkout }) => {
    const [selectedPhase, setSelectedPhase] = useState(null);

    if (selectedPhase) {
        return <PhaseDetailView phase={selectedPhase} onStartWorkout={onStartWorkout} onBack={() => setSelectedPhase(null)} />
    }

    return (
        <div className="p-4 md:p-6 text-white">
            <h2 className="text-3xl font-bold text-white mb-8">Tu Plan de Entrenamiento</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {planData.fases.map(phase => (
                    <div key={phase.id} onClick={() => setSelectedPhase(phase)} className="bg-slate-800 rounded-lg p-6 flex flex-col justify-between cursor-pointer hover:bg-slate-700/50 transition-all border border-slate-700 hover:border-indigo-500">
                        <div>
                            <p className="text-indigo-400 font-semibold">Fase {phase.id}</p>
                            <h3 className="text-2xl font-bold text-white mt-1 mb-2">{phase.nombre}</h3>
                            <p className="text-slate-400 text-sm">{phase.descripcion}</p>
                        </div>
                        <div className="mt-4 text-right">
                            <span className="text-indigo-400 font-semibold">Ver Semana &rarr;</span>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
};

export default function App() {
  const [db, setDb] = useState(null);
  const [auth, setAuth] = useState(null);
  const [userId, setUserId] = useState(null);
  const [userProfile, setUserProfile] = useState(null);
  const [isAuthReady, setIsAuthReady] = useState(false);
  const [error, setError] = useState(null);
  const [currentView, setCurrentView] = useState('gymbro');
  const [selectedWorkout, setSelectedWorkout] = useState('');

  useEffect(() => {
    try {
      if (Object.keys(firebaseConfig).length > 0 && firebaseConfig.apiKey) {
        const app = initializeApp(firebaseConfig);
        const firestore = getFirestore(app);
        const authInstance = getAuth(app);
        setDb(firestore); setAuth(authInstance);
      } else {
        setError("La configuración de Firebase no está disponible.");
      }
    } catch (e) { console.error("Error al inicializar Firebase:", e); setError("Error al inicializar Firebase."); }
  }, []);

  useEffect(() => {
    if (!auth) return;
    const authCheck = async () => {
      try {
        await signInAnonymously(auth); 
      } catch (e) { console.error("Error en la autenticación:", e); setError("Fallo en la autenticación."); }
    };
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      if (user) { setUserId(user.uid); } else { setUserId(null); }
      setIsAuthReady(true);
    });
    authCheck();
    return () => unsubscribe();
  }, [auth]);

  useEffect(() => {
    if (!db || !userId) return;
    const profileRef = doc(db, `artifacts/${appId}/users/${userId}/profile`, 'data');
    const unsubscribe = onSnapshot(profileRef, (docSnap) => {
      if (docSnap.exists()) {
        setUserProfile(docSnap.data());
      } else {
        const initialProfile = { age: 40, height: 187, weight: 143, startDate: new Date().toISOString().split('T')[0], userId: userId };
        setDoc(profileRef, initialProfile).then(() => setUserProfile(initialProfile)).catch(e => { console.error("Error al crear perfil:", e); setError("No se pudo crear el perfil."); });
      }
    }, (error) => { console.error("Error en snapshot de perfil:", error); setError("No se pudo cargar el perfil."); });
    return () => unsubscribe();
  }, [db, userId]);

  const handleStartWorkout = (workoutName) => { setSelectedWorkout(workoutName); setCurrentView('workout'); };

  const renderView = () => {
    switch (currentView) {
      case 'workout': return <WorkoutView workoutName={selectedWorkout} onBack={() => setCurrentView('training')} db={db} userId={userId} />;
      case 'training': return <TrainingPlanView onStartWorkout={handleStartWorkout} />;
      case 'nutrition': return <NutritionPlanView userProfile={userProfile} onStartLogging={() => setCurrentView('nutritionLog')} />;
      case 'nutritionLog': return <NutritionLogView db={db} userId={userId} userProfile={userProfile} onBack={() => setCurrentView('nutrition')} />;
      case 'progress': return <ProgressView db={db} userId={userId} />;
      case 'profile': return <ProfileView userProfile={userProfile} db={db} userId={userId} />;
      case 'gymbro': default: return <Dashboard userProfile={userProfile} onStartWorkout={handleStartWorkout} db={db} userId={userId} />;
    }
  };

  if (error) return <div className="bg-slate-900 min-h-screen flex items-center justify-center text-red-400 p-4">{error}</div>;
  if (!isAuthReady || !userProfile) return <div className="bg-slate-900 min-h-screen flex flex-col justify-center items-center text-white"><LoadingSpinner /><p className="mt-4">Cargando tu plan de transformación...</p></div>;

  return (
    <div className="bg-slate-900 min-h-screen font-sans">
      <main className="max-w-7xl mx-auto pb-20">{renderView()}</main>
      <nav className="fixed bottom-0 left-0 right-0 bg-slate-800 border-t border-slate-700">
        <div className="max-w-7xl mx-auto flex justify-around">
          <button onClick={() => setCurrentView('gymbro')} className={`flex flex-col items-center p-3 w-1/5 ${currentView === 'gymbro' ? 'text-indigo-400' : 'text-slate-400'} hover:text-indigo-300`}><Home size={24} /><span className="text-xs mt-1">Gymbro</span></button>
          <button onClick={() => setCurrentView('training')} className={`flex flex-col items-center p-3 w-1/5 ${currentView === 'training' ? 'text-indigo-400' : 'text-slate-400'} hover:text-indigo-300`}><Dumbbell size={24} /><span className="text-xs mt-1">Entrenamiento</span></button>
          <button onClick={() => setCurrentView('nutrition')} className={`flex flex-col items-center p-3 w-1/5 ${currentView.startsWith('nutrition') ? 'text-indigo-400' : 'text-slate-400'} hover:text-indigo-300`}><UtensilsCrossed size={24} /><span className="text-xs mt-1">Nutrición</span></button>
          <button onClick={() => setCurrentView('progress')} className={`flex flex-col items-center p-3 w-1/5 ${currentView === 'progress' ? 'text-indigo-400' : 'text-slate-400'} hover:text-indigo-300`}><BarChart2 size={24} /><span className="text-xs mt-1">Progreso</span></button>
          <button onClick={() => setCurrentView('profile')} className={`flex flex-col items-center p-3 w-1/5 ${currentView === 'profile' ? 'text-indigo-400' : 'text-slate-400'} hover:text-indigo-300`}><User size={24} /><span className="text-xs mt-1">Perfil</span></button>
        </div>
      </nav>
    </div>
  );
}
