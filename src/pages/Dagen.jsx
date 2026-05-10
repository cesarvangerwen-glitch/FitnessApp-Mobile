import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { db } from '../database.js'

function formatDatum(dateStr) {
  if (!dateStr) return ''
  const [year, month, day] = dateStr.split('-')
  const maanden = ['Januari','Februari','Maart','April','Mei','Juni','Juli','Augustus','September','Oktober','November','December']
  return `${parseInt(day)} ${maanden[parseInt(month)-1]} ${year}`
}

export default function Dagen() {
  const [dagen, setDagen] = useState([])
  const navigate = useNavigate()

  useEffect(() => { laadDagen() }, [])

  async function laadDagen() {
    const rows = await db.workouts.toArray()
    const map = {}
    rows.forEach(r => {
      if (!map[r.date]) map[r.date] = { oefeningen: new Set(), werksets: 0 }
      map[r.date].oefeningen.add(r.exercise)
      if (r.set_type === 'Werkset') map[r.date].werksets++
    })
    const lijst = Object.entries(map)
      .sort((a, b) => b[0].localeCompare(a[0]))
      .map(([date, v]) => ({ date, oefeningen: v.oefeningen.size, werksets: v.werksets }))
    setDagen(lijst)
  }

  return (
    <div>
      <h1 className="page-title">📅 Trainingsdagen</h1>
      {dagen.length === 0 ? (
        <p style={{color: '#555', textAlign: 'center', marginTop: 40}}>Nog geen trainingsdagen.</p>
      ) : (
        dagen.map(d => (
          <div key={d.date} className="dag-kaart" onClick={() => navigate(`/dag/${d.date}`)}>
            <div>
              <p className="dag-kaart-datum">{formatDatum(d.date)}</p>
              <p className="dag-kaart-info">{d.oefeningen} oefeningen · {d.werksets} werksets</p>
            </div>
            <span style={{color: '#555', fontSize: 20}}>›</span>
          </div>
        ))
      )}
    </div>
  )
}