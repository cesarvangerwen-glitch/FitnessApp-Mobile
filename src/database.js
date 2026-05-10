import Dexie from 'dexie'

export const db = new Dexie('fitnessdb')

db.version(1).stores({
  workouts: '++id, date, exercise, set_type, reps, weight_kg, muscle_group',
  oefeningen: 'exercise, muscle_group'
})

export function getDb() {
  return db
}

export async function initDatabase() {
  // Dexie opent automatisch, niets extra nodig
  return db
}