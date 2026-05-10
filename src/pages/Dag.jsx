import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { db } from '../database.js'

function formatDatum(dateStr) {
  if (!dateStr) return ''
  const [year, month, day] = dateStr.split('-')
  const maanden = ['Januari','Februari','Maart','April','Mei','Juni','Juli','Augustus','September','Oktober','November','December']
  return `${parseInt(day)} ${maanden[parseInt(month)-1]} ${year}`
}

export default function Dag() {
  const { datum } = useParams()
  const navigate = useNavigate()
  const [sessies, setSessies] = useState({})

  useEffect(() => { laadDag() }, [datum])

  async function laadDag() {
    const rows = await db.workouts.where('date').equals(datum).toArray()
    const map = {}
    rows.forEach(r => {
      if (!map[r.exercise]) map[r.exercise] = []
      map[r.exercise].push(r)
    })
    setSessies(map)
  }

  async function verwijderSessie(oefening) {
    if (!confirm(`Verwijder alle sets van ${oefening}?`)) return
    await db.workouts.where('date').equals(datum).and(r => r.exercise === oefening).delete()
    laadDag()
  }

  return (
    <div>
      <div className="dag-detail-header">
        <button className="terug-btn" onClick={() => navigate('/')}>‹ Terug</button>
        <h1 className="page-title" style={{margin: 0}}>{formatDatum(datum)}</h1>
      </div>
      {Object.keys(sessies).length === 0 ? (
        <p style={{color: '#555', textAlign: 'center', marginTop: 40}}>Geen data voor deze dag.</p>
      ) : (
        Object.entries(sessies).map(([oefening, sets]) => {
          const werksets = sets.filter(s => s.set_type === 'Werkset')
          const maxKg = werksets.length > 0 ? Math.max(...werksets.map(s => s.weight_kg)) : 0
          return (
            <div key={oefening} className="dag-sessie-kaart">
              <div className="dag-sessie-header">
                <div>
                  <p className="dag-sessie-naam">{oefening}</p>
                  <p className="dag-sessie-spier">{sets[0].muscle_group}</p>
                </div>
                <button className="verwijder-sessie-btn" onClick={() => verwijderSessie(oefening)}>🗑</button>
              </div>
              <div className="sets-lijst">
                {sets.map((s, i) => (
                  <div key={i} className="set-item">
                    <span className={`set-badge ${s.set_type === 'Warmup' ? 'warmup' : 'werkset'}`}>{s.set_type}</span>
                    <span>{s.reps} reps</span>
                    <span>{s.weight_kg} kg</span>
                    {s.weight_kg === maxKg && s.set_type === 'Werkset' && werksets.length > 0 && (
                      <span className="pr-badge">PR</span>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )
        })
      )}
    </div>
  )
}