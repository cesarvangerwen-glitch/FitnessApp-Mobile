import { useState, useEffect } from 'react'
import { db } from '../database.js'

function formatDatum(dateStr) {
  if (!dateStr) return ''
  const [year, month, day] = dateStr.split('-')
  const maanden = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec']
  return `${parseInt(day)} ${maanden[parseInt(month)-1]} ${year}`
}

export default function Zoeken() {
  const [zoekterm, setZoekterm] = useState('')
  const [groepen, setGroepen] = useState([])
  const [gezocht, setGezocht] = useState(false)
  const [maxGewicht, setMaxGewicht] = useState(0)
  const [alleOefeningen, setAlleOefeningen] = useState([])
  const [toonSuggesties, setToonSuggesties] = useState(false)

  useEffect(() => { laadOefeningen() }, [])

  async function laadOefeningen() {
    const lijst = await db.oefeningen.orderBy('exercise').toArray()
    setAlleOefeningen(lijst.map(o => o.exercise))
  }

  const suggesties = alleOefeningen.filter(o =>
    o.toLowerCase().includes(zoekterm.toLowerCase()) && zoekterm.length > 0
  )

  async function zoek(term) {
    const zoekWoord = term ?? zoekterm
    setZoekterm(zoekWoord)
    setToonSuggesties(false)
    const rows = await db.workouts.filter(r =>
      r.exercise.toLowerCase().includes(zoekWoord.toLowerCase())
    ).toArray()
    rows.sort((a, b) => b.date.localeCompare(a.date))
    const map = {}
    rows.forEach(r => {
      const key = `${r.date}_${r.exercise}`
      if (!map[key]) map[key] = { date: r.date, exercise: r.exercise, muscle_group: r.muscle_group, sets: [] }
      map[key].sets.push(r)
    })
    const lijst = Object.values(map)
    const max = Math.max(...lijst.flatMap(g =>
      g.sets.filter(s => s.set_type === 'Werkset').map(s => s.weight_kg)
    ), 0)
    setMaxGewicht(max)
    setGroepen(lijst)
    setGezocht(true)
  }

  return (
    <div>
      <h1 className="page-title">🔍 Zoeken</h1>

      <div style={{position: 'relative', marginBottom: 20}}>
        <div className="zoek-rij">
          <input
            type="text"
            placeholder="Oefening zoeken..."
            value={zoekterm}
            onChange={e => { setZoekterm(e.target.value); setToonSuggesties(true) }}
            onKeyDown={e => e.key === 'Enter' && zoek()}
            onBlur={() => setTimeout(() => setToonSuggesties(false), 200)}
            className="input"
            style={{flex: 1}}
          />
          <button className="btn-primary" onClick={() => zoek()} style={{padding: '12px 20px'}}>Zoek</button>
        </div>

        {toonSuggesties && suggesties.length > 0 && (
          <div className="suggesties">
            {suggesties.map(o => (
              <div
                key={o}
                className="suggestie-item"
                onMouseDown={() => zoek(o)}
              >
                <span>{o}</span>
              </div>
            ))}
          </div>
        )}
      </div>

      {gezocht && groepen.length === 0 && (
        <p style={{color: '#555', textAlign: 'center', marginTop: 40}}>Geen resultaten gevonden.</p>
      )}

      {groepen.map((g, i) => {
        const werksets = g.sets.filter(s => s.set_type === 'Werkset')
        const maxKg = werksets.length > 0 ? Math.max(...werksets.map(s => s.weight_kg)) : 0
        const isPR = maxKg === maxGewicht && werksets.length > 0
        return (
          <div key={i} className="dag-sessie-kaart">
            <div className="dag-sessie-header">
              <div>
                <p className="dag-sessie-naam">{g.exercise}</p>
                <p className="dag-sessie-spier">{formatDatum(g.date)} · {g.muscle_group}</p>
              </div>
              {isPR && <span className="pr-badge" style={{fontSize:13, padding:'4px 10px'}}>🏆 PR</span>}
            </div>
            <div className="sets-lijst">
              {g.sets.map((s, j) => (
                <div key={j} className="set-item">
                  <span className={`set-badge ${s.set_type === 'Warmup' ? 'warmup' : 'werkset'}`}>{s.set_type}</span>
                  <span>{s.reps} reps</span>
                  <span>{s.weight_kg} kg</span>
                </div>
              ))}
            </div>
          </div>
        )
      })}
    </div>
  )
}