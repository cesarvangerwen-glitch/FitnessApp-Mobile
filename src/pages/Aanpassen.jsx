import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { db } from '../database.js'

const SPIERGROEPEN = ['Schouders','Borst','Rug','Biceps','Triceps','Benen','Buik','Volledig lichaam','Niet ingesteld']

export default function Aanpassen() {
  const { datum, oefening } = useParams()
  const oefeningNaam = decodeURIComponent(oefening)
  const navigate = useNavigate()

  const [nieuweNaam, setNieuweNaam] = useState(oefeningNaam)
  const [spiergroep, setSpiergroep] = useState('Niet ingesteld')
  const [sets, setSets] = useState([])
  const [opgeslagen, setOpgeslagen] = useState(false)

  useEffect(() => { laadSets() }, [])

  async function laadSets() {
    const rows = await db.workouts
      .where('date').equals(datum)
      .and(r => r.exercise === oefeningNaam)
      .toArray()
    setSets(rows.map(r => ({ ...r, reps: String(r.reps), kg: String(r.weight_kg) })))
    if (rows.length > 0) setSpiergroep(rows[0].muscle_group)
  }

  function setAanpassen(i, veld, waarde) {
    const nieuw = [...sets]
    nieuw[i][veld] = waarde
    setSets(nieuw)
  }

  function setToevoegen() {
    setSets([...sets, { set_type: 'Werkset', reps: '', kg: '', isNieuw: true }])
  }

  function setVerwijderen(i) {
    setSets(sets.filter((_, j) => j !== i))
  }

  async function opslaan() {
    // Verwijder alle oude sets van deze sessie
    await db.workouts
      .where('date').equals(datum)
      .and(r => r.exercise === oefeningNaam)
      .delete()

    // Sla nieuwe sets op
    for (const set of sets) {
      if (!set.reps || !set.kg) continue
      await db.workouts.add({
        date: datum,
        exercise: nieuweNaam.trim(),
        set_type: set.set_type,
        reps: parseInt(set.reps),
        weight_kg: parseFloat(set.kg),
        muscle_group: spiergroep,
      })
    }

    // Update oefeningen tabel
    if (nieuweNaam.trim() !== oefeningNaam) {
      await db.oefeningen.delete(oefeningNaam)
    }
    await db.oefeningen.put({ exercise: nieuweNaam.trim(), muscle_group: spiergroep })

    setOpgeslagen(true)
    setTimeout(() => navigate('/'), 1000)
  }

  async function verwijderSessie() {
    if (!confirm(`Verwijder hele sessie van ${oefeningNaam}?`)) return
    await db.workouts
      .where('date').equals(datum)
      .and(r => r.exercise === oefeningNaam)
      .delete()
    navigate('/')
  }

  return (
    <div>
      <div className="dag-detail-header">
        <button className="terug-btn" onClick={() => navigate(-1)}>‹ Terug</button>
        <h1 className="page-title" style={{margin: 0}}>Aanpassen</h1>
        <button onClick={verwijderSessie} style={{background:'transparent', border:'none', fontSize:20, cursor:'pointer'}}>🗑</button>
      </div>

      <div className="form-groep">
        <label>Oefening</label>
        <input
          type="text"
          value={nieuweNaam}
          onChange={e => setNieuweNaam(e.target.value)}
          className="input"
        />
      </div>

      <div className="form-groep">
        <label>Spiergroep</label>
        <select value={spiergroep} onChange={e => setSpiergroep(e.target.value)} className="input">
          {SPIERGROEPEN.map(s => <option key={s} value={s}>{s}</option>)}
        </select>
      </div>

      <div className="sets-sectie">
        <p className="sets-titel">Sets</p>
        {sets.map((set, i) => (
          <div key={i} className="set-rij">
            <select
              value={set.set_type}
              onChange={e => setAanpassen(i, 'set_type', e.target.value)}
              className="set-type-select"
            >
              <option value="Werkset">Werkset</option>
              <option value="Warmup">Warmup</option>
            </select>
            <input
              type="number"
              placeholder="Reps"
              value={set.reps}
              onChange={e => setAanpassen(i, 'reps', e.target.value)}
              className="set-input"
            />
            <input
              type="number"
              placeholder="KG"
              value={set.kg}
              onChange={e => setAanpassen(i, 'kg', e.target.value)}
              className="set-input"
            />
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