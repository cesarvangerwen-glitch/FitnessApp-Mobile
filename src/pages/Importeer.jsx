import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { db } from '../database.js'

export default function Importeer() {
  const [status, setStatus] = useState('')
  const [bezig, setBezig] = useState(false)
  const navigate = useNavigate()

  async function importeer(e) {
    const file = e.target.files[0]
    if (!file) return

    setBezig(true)
    setStatus('Bezig met inladen...')

    try {
      const text = await file.text()
      const data = JSON.parse(text)

      // Workouts importeren
      let workoutCount = 0
      for (const w of data.workouts) {
        await db.workouts.add({
          date: w.date,
          exercise: w.exercise,
          set_type: w.set_type,
          reps: w.reps,
          weight_kg: w.weight_kg,
          muscle_group: w.muscle_group || 'Niet ingesteld'
        })
        workoutCount++
      }

      // Oefeningen importeren
      let oefeningCount = 0
      for (const o of data.oefeningen) {
        await db.oefeningen.put({
          exercise: o.exercise,
          muscle_group: o.muscle_group
        })
        oefeningCount++
      }

      setStatus(`✅ Klaar! ${workoutCount} workouts en ${oefeningCount} oefeningen geïmporteerd.`)
      setTimeout(() => navigate('/'), 2000)
    } catch (err) {
      setStatus('❌ Fout bij importeren: ' + err.message)
    }

    setBezig(false)
  }

  return (
    <div>
      <div className="dag-detail-header">
        <button className="terug-btn" onClick={() => navigate('/')}>‹ Terug</button>
        <h1 className="page-title" style={{margin: 0}}>Data importeren</h1>
      </div>

      <div className="dashboard-sectie" style={{textAlign: 'center', padding: 30}}>
        <p style={{fontSize: 40, marginBottom: 16}}>📂</p>
        <p style={{color: '#aaa', marginBottom: 24}}>
          Selecteer je <strong style={{color:'#fff'}}>fitness_export.json</strong> bestand om je oude data te importeren.
        </p>

        <label className="btn-primary" style={{cursor: 'pointer', display: 'inline-block'}}>
          {bezig ? 'Bezig...' : 'Kies JSON bestand'}
          <input
            type="file"
            accept=".json"
            onChange={importeer}
            style={{display: 'none'}}
            disabled={bezig}
          />
        </label>

        {status && (
          <p style={{marginTop: 24, color: status.startsWith('✅') ? '#4ecdc4' : '#e63946'}}>
            {status}
          </p>
        )}
      </div>

      <div className="dashboard-sectie">
        <p className="dashboard-titel">⚠️ Let op</p>
        <p style={{color: '#888', fontSize: 13, lineHeight: 1.6}}>
          Importeren voegt data toe aan je huidige database. Als je al data hebt, kan dit duplicaten veroorzaken. Importeer bij voorkeur op een lege app.
        </p>
      </div>
    </div>
  )
}