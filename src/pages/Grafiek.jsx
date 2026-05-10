import { useState, useEffect } from 'react'
import { Line } from 'react-chartjs-2'
import { Chart as ChartJS, CategoryScale, LinearScale, PointElement, LineElement, Tooltip, Legend } from 'chart.js'
import { db } from '../database.js'

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, Tooltip, Legend)

const SPIERGROEPEN = ['Schouders','Borst','Rug','Biceps','Triceps','Benen','Buik','Volledig lichaam']
const KLEUREN = ['#e63946','#4ecdc4','#45b7d1','#96ceb4','#ffeaa7','#dda0dd','#98d8c8','#f7dc6f','#bb8fce','#85c1e9']

export default function Grafiek() {
  const [modus, setModus] = useState('oefening') // 'oefening' of 'spiergroep'

  // Oefening modus
  const [zoekterm, setZoekterm] = useState('')
  const [gekozen, setGekozen] = useState('')
  const [alleOefeningen, setAlleOefeningen] = useState([])
  const [toonSuggesties, setToonSuggesties] = useState(false)
  const [data, setData] = useState(null)

  // Spiergroep modus
  const [gekozenSpier, setGekozenSpier] = useState('')
  const [spierData, setSpierData] = useState(null)

  useEffect(() => { laadOefeningen() }, [])
  useEffect(() => { if (gekozen) laadData(gekozen) }, [gekozen])
  useEffect(() => { if (gekozenSpier) laadSpierData(gekozenSpier) }, [gekozenSpier])

  async function laadOefeningen() {
    const lijst = await db.oefeningen.orderBy('exercise').toArray()
    setAlleOefeningen(lijst.map(o => o.exercise))
  }

  async function laadData(naam) {
    const rows = await db.workouts
      .where('exercise').equals(naam)
      .and(r => r.set_type === 'Werkset')
      .toArray()
    if (rows.length === 0) { setData(null); return }
    const perDatum = {}
    rows.forEach(r => {
      if (!perDatum[r.date] || r.weight_kg > perDatum[r.date]) perDatum[r.date] = r.weight_kg
    })
    const gesorteerd = Object.entries(perDatum).sort((a, b) => a[0].localeCompare(b[0]))
    const maanden = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec']
    setData({
      labels: gesorteerd.map(([d]) => {
        const [y, m, day] = d.split('-')
        return `${parseInt(day)} ${maanden[parseInt(m)-1]}`
      }),
      datasets: [{
        label: naam,
        data: gesorteerd.map(([, kg]) => kg),
        borderColor: '#e63946',
        backgroundColor: 'rgba(230,57,70,0.1)',
        tension: 0.3,
        pointBackgroundColor: '#e63946',
        fill: true,
      }]
    })
  }

  async function laadSpierData(spiergroep) {
    const oefeningen = await db.oefeningen.where('muscle_group').equals(spiergroep).toArray()
    if (oefeningen.length === 0) { setSpierData(null); return }

    const maanden = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec']
    const alleLabels = new Set()
    const datasets = []

    for (let i = 0; i < oefeningen.length; i++) {
      const oef = oefeningen[i]
      const rows = await db.workouts
        .where('exercise').equals(oef.exercise)
        .and(r => r.set_type === 'Werkset')
        .toArray()
      if (rows.length === 0) continue

      const perDatum = {}
      rows.forEach(r => {
        if (!perDatum[r.date] || r.weight_kg > perDatum[r.date]) perDatum[r.date] = r.weight_kg
        alleLabels.add(r.date)
      })

      const kleur = KLEUREN[i % KLEUREN.length]
      datasets.push({ oefening: oef.exercise, perDatum, kleur })
    }

    if (datasets.length === 0) { setSpierData(null); return }

    const gesorteerdeLabels = [...alleLabels].sort()
    const labels = gesorteerdeLabels.map(d => {
      const [y, m, day] = d.split('-')
      return `${parseInt(day)} ${maanden[parseInt(m)-1]}`
    })

    setSpierData({
      labels,
      datasets: datasets.map(ds => ({
        label: ds.oefening,
        data: gesorteerdeLabels.map(d => ds.perDatum[d] ?? null),
        borderColor: ds.kleur,
        backgroundColor: 'transparent',
        tension: 0.3,
        pointBackgroundColor: ds.kleur,
        spanGaps: true,
      }))
    })
  }

  const suggesties = alleOefeningen.filter(o =>
    o.toLowerCase().includes(zoekterm.toLowerCase()) && zoekterm.length > 0
  )

  function kiesOefening(naam) {
    setZoekterm(naam)
    setGekozen(naam)
    setToonSuggesties(false)
  }

  return (
    <div>
      <h1 className="page-title">📈 Voortgang</h1>

      {/* Modus toggle */}
      <div className="modus-toggle">
        <button
          className={`modus-btn ${modus === 'oefening' ? 'actief' : ''}`}
          onClick={() => setModus('oefening')}
        >
          💪 Oefening
        </button>
        <button
          className={`modus-btn ${modus === 'spiergroep' ? 'actief' : ''}`}
          onClick={() => setModus('spiergroep')}
        >
          🎯 Spiergroep
        </button>
      </div>

      {/* Oefening modus */}
      {modus === 'oefening' && (
        <>
          <div style={{position: 'relative', marginBottom: 20}}>
            <div className="zoek-rij">
              <input
                type="text"
                placeholder="Oefening zoeken..."
                value={zoekterm}
                onChange={e => { setZoekterm(e.target.value); setToonSuggesties(true) }}
                onBlur={() => setTimeout(() => setToonSuggesties(false), 200)}
                onKeyDown={e => e.key === 'Enter' && suggesties.length > 0 && kiesOefening(suggesties[0])}
                className="input"
                style={{flex: 1}}
              />
              <button className="btn-primary" onClick={() => suggesties.length > 0 && kiesOefening(suggesties[0])} style={{padding: '12px 20px'}}>Zoek</button>
            </div>
            {toonSuggesties && suggesties.length > 0 && (
              <div className="suggesties">
                {suggesties.map(o => (
                  <div key={o} className="suggestie-item" onMouseDown={() => kiesOefening(o)}>
                    <span>{o}</span>
                  </div>
                ))}
              </div>
            )}
          </div>

          {!gekozen && <p style={{color:'#555', textAlign:'center', marginTop:40}}>Zoek een oefening om de voortgang te zien.</p>}
          {gekozen && !data && <p style={{color:'#555', textAlign:'center', marginTop:40}}>Geen werksets gevonden voor "{gekozen}".</p>}
          {data && (
            <div style={{marginTop: 20}}>
              <p style={{color:'#aaa', fontSize:13, marginBottom:12}}>{gekozen}</p>
              <Line data={data} options={{
                responsive: true,
                plugins: { legend: { display: false } },
                scales: {
                  x: { ticks: { color: '#888', font: { size: 11 } }, grid: { color: '#222' } },
                  y: { ticks: { color: '#888' }, grid: { color: '#222' } }
                }
              }} />
            </div>
          )}
        </>
      )}

      {/* Spiergroep modus */}
      {modus === 'spiergroep' && (
        <>
          <div className="form-groep">
            <label>Spiergroep</label>
            <select className="input" value={gekozenSpier} onChange={e => setGekozenSpier(e.target.value)}>
              <option value="">— Kies een spiergroep —</option>
              {SPIERGROEPEN.map(s => <option key={s} value={s}>{s}</option>)}
            </select>
          </div>

          {!gekozenSpier && <p style={{color:'#555', textAlign:'center', marginTop:40}}>Kies een spiergroep om de voortgang te zien.</p>}
          {gekozenSpier && !spierData && <p style={{color:'#555', textAlign:'center', marginTop:40}}>Geen data gevonden voor {gekozenSpier}.</p>}
          {spierData && (
            <div style={{marginTop: 20}}>
              <Line data={spierData} options={{
                responsive: true,
                plugins: {
                  legend: {
                    display: true,
                    labels: { color: '#aaa', font: { size: 11 }, boxWidth: 12 }
                  }
                },
                scales: {
                  x: { ticks: { color: '#888', font: { size: 11 } }, grid: { color: '#222' } },
                  y: { ticks: { color: '#888' }, grid: { color: '#222' } }
                }
              }} />
            </div>
          )}
        </>
      )}
    </div>
  )
}