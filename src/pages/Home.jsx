import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { db } from '../database.js'

function formatDatum(dateStr) {
  if (!dateStr) return ''
  const [year, month, day] = dateStr.split('-')
  const maanden = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec']
  return `${parseInt(day)} ${maanden[parseInt(month)-1]} ${year}`
}

export default function Home() {
  const [sessies, setSessies] = useState([])
  const [zoekterm, setZoekterm] = useState('')
  const navigate = useNavigate()

  useEffect(() => { laadSessies() }, [])

  async function laadSessies() {
    const rows = await db.workouts.orderBy('date').reverse().toArray()
    const map = {}
    rows.forEach(r => {
      const key = `${r.date}_${r.exercise}`
      if (!map[key]) map[key] = { date: r.date, exercise: r.exercise, muscle_group: r.muscle_group, werksets: 0 }
      if (r.set_type === 'Werkset') map[key].werksets++
    })
    setSessies(Object.values(map))
  }

  const gefilterd = sessies.filter(s =>
    s.exercise.toLowerCase().includes(zoekterm.toLowerCase()) ||
    s.muscle_group.toLowerCase().includes(zoekterm.toLowerCase())
  )

  const perDatum = {}
  gefilterd.forEach(s => {
    if (!perDatum[s.date]) perDatum[s.date] = []
    perDatum[s.date].push(s)
  })

  return (
    <div className="home">
      <h1 className="page-title">💪 Workouts</h1>
      <input
        type="text"
        placeholder="🔍 Zoek oefening of spiergroep..."
        value={zoekterm}
        onChange={e => setZoekterm(e.target.value)}
        className="zoekbalk"
      />
      {Object.keys(perDatum).length === 0 ? (
        <div className="leeg">
          <p>Nog geen workouts geregistreerd.</p>
          <button className="btn-primary" onClick={() => navigate('/toevoegen')}>+ Workout toevoegen</button>
        </div>
      ) : (
        Object.entries(perDatum).map(([datum, oefeningen]) => (
          <div key={datum} className="dag-groep">
            <div className="dag-header" onClick={() => navigate(`/dag/${datum}`)}>
              <span className="dag-datum">{formatDatum(datum)}</span>
              <span className="dag-pijl">›</span>
            </div>
            {oefeningen.map(s => (
              <div key={s.exercise} className="sessie-kaart" onClick={() => navigate(`/aanpassen/${datum}/${encodeURIComponent(s.exercise)}`)}>
                <div className="sessie-info">
                  <span className="sessie-naam">{s.exercise}</span>
                  <span className="sessie-spiergroep">{s.muscle_group}</span>
                </div>
                <span className="sessie-sets">{s.werksets} werksets</span>
              </div>
            ))}
          </div>
        ))
      )}
    </div>
  )
}