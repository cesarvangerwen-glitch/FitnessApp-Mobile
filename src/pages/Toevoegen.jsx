import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { db } from '../database.js'

const SPIERGROEPEN = ['Schouders','Borst','Rug','Biceps','Triceps','Benen','Buik','Volledig lichaam','Niet ingesteld']

function vandaag() {
  return new Date().toISOString().split('T')[0]
}

export default function Toevoegen() {
  const navigate = useNavigate()
  const [datum, setDatum] = useState(vandaag())
  const [oefening, setOefening] = useState('')
  const [spiergroep, setSpiergroep] = useState('Niet ingesteld')
  const [sets, setSets] = useState([{ type: 'Werkset', reps: '', kg: '' }])
  const [vorigeSessie, setVorigeSessie] = useState([])
  const [oefeningen, setOefeningen] = useState([])
  const [toonSuggesties, setToonSuggesties] = useState(false)
  const [opgeslagen, setOpgeslagen] = useState(false)

  useEffect(() => { laadOefeningen() }, [])
  useEffect(() => { if (oefening.length > 1) laadVorigeSessie() }, [oefening, datum])

  async function laadOefeningen() {
    const lijst = await db.oefeningen.orderBy('exercise').toArray()
    setOefeningen(lijst)
  }

  async function laadVorigeSessie() {
    const alleVorige = await db.workouts
      .where('exercise').equals(oefening)
      .toArray()
    const vorigeDatums = [...new Set(alleVorige.map(r => r.date))].filter(d => d < datum).sort().reverse()
    if (vorigeDatums.length === 0) { setVorigeSessie([]); return }
    const vorigeDatum = vorigeDatums[0]
    const sets = alleVorige.filter(r => r.date === vorigeDatum)
    setVorigeSessie(sets)

    const oefeningInfo = oefeningen.find(o => o.exercise === oefening)
    if (oefeningInfo) setSpiergroep(oefeningInfo.muscle_group)
  }

  function setToevoegen() { setSets([...sets, { type: 'Werkset', reps: '', kg: '' }]) }
  function setVerwijderen(i) { setSets(sets.filter((_, j) => j !== i)) }
  function setAanpassen(i, veld, waarde) {
    const nieuw = [...sets]
    nieuw[i][veld] = waarde
    setSets(nieuw)
  }
  function kopieerSet(set) {
    setSets([...sets, { type: set.set_type, reps: String(set.reps), kg: String(set.weight_kg) }])
  }

  async function opslaan() {
    if (!oefening.trim()) return alert('Vul een oefening in')
    await db.oefeningen.put({ exercise: oefening.trim(), muscle_group: spiergroep })
    for (const set of sets) {
      if (!set.reps || !set.kg) continue
      await db.workouts.add({
        date: datum,
        exercise: oefening.trim(),
        set_type: set.type,
        reps: parseInt(set.reps),
        weight_kg: parseFloat(set.kg),
        muscle_group: spiergroep
      })
    }
    setOpgeslagen(true)
    setTimeout(() => navigate('/'), 1000)
  }

  const gefilterd = oefeningen.filter(o =>
    o.exercise.toLowerCase().includes(oefening.toLowerCase()) && oefening.length > 0
  )

  return (
    <div className="toevoegen">
      <h1 className="page-title">➕ Workout toevoegen</h1>
      <div className="form-groep">
        <label>Datum</label>
        <input type="date" value={datum} onChange={e => setDatum(e.target.value)} className="input" />
      </div>
      <div className="form-groep">
        <label>Oefening</label>
        <input
          type="text"
          value={oefening}
          onChange={e => { setOefening(e.target.value); setToonSuggesties(true) }}
          onBlur={() => setTimeout(() => setToonSuggesties(false), 200)}
          placeholder="bijv. Bankdrukken"
          className="input"
        />
        {toonSuggesties && gefilterd.length > 0 && (
          <div className="suggesties">
            {gefilterd.map(o => (
              <div key={o.exercise} className="suggestie-item"
                onMouseDown={() => { setOefening(o.exercise); setSpiergroep(o.muscle_group); setToonSuggesties(false) }}>
                <span>{o.exercise}</span>
                <span className="suggestie-spier">{o.muscle_group}</span>
              </div>
            ))}
          </div>
        )}
      </div>
      <div className="form-groep">
        <label>Spiergroep</label>
        <select value={spiergroep} onChange={e => setSpiergroep(e.target.value)} className="input">
          {SPIERGROEPEN.map(s => <option key={s} value={s}>{s}</option>)}
        </select>
      </div>
      {vorigeSessie.length > 0 && (
        <div className="vorige-sessie">
          <p className="vorige-titel">📋 Vorige sessie</p>
          {vorigeSessie.map((s, i) => (
            <div key={i} className="vorige-set">
              <span className={`set-badge ${s.set_type === 'Warmup' ? 'warmup' : 'werkset'}`}>{s.set_type}</span>
              <span>{s.reps} reps × {s.weight_kg} kg</span>
              <button className="kopieer-btn" onClick={() => kopieerSet(s)}>＋</button>
            </div>
          ))}
        </div>
      )}
      <div className="sets-sectie">
        <p className="sets-titel">Sets</p>
        {sets.map((set, i) => (
          <div key={i} className="set-rij">
            <select value={set.type} onChange={e => setAanpassen(i, 'type', e.target.value)} className="set-type-select">
              <option value="Werkset">Werkset</option>
              <option value="Warmup">Warmup</option>
            </select>
            <input type="number" placeholder="Reps" value={set.reps} onChange={e => setAanpassen(i, 'reps', e.target.value)} className="set-input" />
            <input type="number" placeholder="KG" value={set.kg} onChange={e => setAanpassen(i, 'kg', e.target.value)} className="set-input" />
            <button className="verwijder-set-btn" onClick={() => setVerwijderen(i)}>✕</button>
          </div>
        ))}
        <button className="set-toevoegen-btn" onClick={setToevoegen}>+ Set toevoegen</button>
      </div>
      <button className="btn-primary btn-full" onClick={opslaan}>
        {opgeslagen ? '✓ Opgeslagen!' : 'Opslaan'}
      </button>
    </div>
  )
}