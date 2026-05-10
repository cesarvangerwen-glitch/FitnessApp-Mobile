import { useState, useEffect } from 'react'
import { Bar, Doughnut } from 'react-chartjs-2'
import {
  Chart as ChartJS, CategoryScale, LinearScale, BarElement,
  ArcElement, Tooltip, Legend
} from 'chart.js'
import { db } from '../database.js'

ChartJS.register(CategoryScale, LinearScale, BarElement, ArcElement, Tooltip, Legend)

const SPIER_KLEUREN = {
  'Rug': '#e63946',
  'Borst': '#4ecdc4',
  'Schouders': '#f4a261',
  'Biceps': '#a8dadc',
  'Triceps': '#9b72cf',
  'Benen': '#57cc99',
  'Buik': '#ff9f43',
  'Volledig lichaam': '#54a0ff',
  'Niet ingesteld': '#555',
}

function getWeekLabel(datum) {
  const d = new Date(datum)
  const now = new Date(); now.setHours(0,0,0,0)
  const diffDagen = Math.floor((now - d) / 86400000)
  const weekNr = Math.floor(diffDagen / 7)
  if (weekNr === 0) return 'Deze week'
  if (weekNr === 1) return 'Vorige week'
  return `${weekNr + 1} weken geleden`
}

export default function Dashboard() {
  const [stats, setStats] = useState(null)

  useEffect(() => { laadStats() }, [])

  async function laadStats() {
    const rows = await db.workouts.toArray()
    if (rows.length === 0) { setStats({ leeg: true }); return }

    const datums = [...new Set(rows.map(r => r.date))]
    const oefeningen = [...new Set(rows.map(r => r.exercise))]

    // Streak
    const gesorteerd = [...datums].sort().reverse()
    let streak = 0
    let check = new Date(); check.setHours(0,0,0,0)
    for (const d of gesorteerd) {
      const dag = new Date(d)
      const diff = Math.round((check - dag) / 86400000)
      if (diff <= 1) { streak++; check = dag } else break
    }

    // Top oefeningen
    const oefCount = {}
    rows.filter(r => r.set_type === 'Werkset').forEach(r => {
      oefCount[r.exercise] = (oefCount[r.exercise] || 0) + 1
    })
    const top = Object.entries(oefCount).sort((a, b) => b[1] - a[1]).slice(0, 5)

    // Spiergroepen
    const spierCount = {}
    rows.filter(r => r.set_type === 'Werkset').forEach(r => {
      spierCount[r.muscle_group] = (spierCount[r.muscle_group] || 0) + 1
    })
    const spiergroepen = Object.entries(spierCount).sort((a, b) => b[1] - a[1])

    // Activiteit per week (laatste 5 weken)
    const weekCount = {}
    const nu = new Date(); nu.setHours(0,0,0,0)
    datums.forEach(d => {
      const dag = new Date(d)
      const diffDagen = Math.floor((nu - dag) / 86400000)
      const weekNr = Math.floor(diffDagen / 7)
      if (weekNr < 5) {
        weekCount[weekNr] = (weekCount[weekNr] || 0) + 1
      }
    })
    const weekLabels = [4,3,2,1,0].map(i => {
      if (i === 0) return 'Deze week'
      if (i === 1) return 'Vorige week'
      return `${i+1}w geleden`
    })
    const weekData = [4,3,2,1,0].map(i => weekCount[i] || 0)

    const activiteitData = {
      labels: weekLabels,
      datasets: [{
        label: 'Trainingsdagen',
        data: weekData,
        backgroundColor: '#e63946',
        borderRadius: 8,
      }]
    }

    // Donut spiergroepen
    const donutData = {
      labels: spiergroepen.map(([naam]) => naam),
      datasets: [{
        data: spiergroepen.map(([, sets]) => sets),
        backgroundColor: spiergroepen.map(([naam]) => SPIER_KLEUREN[naam] || '#555'),
        borderWidth: 0,
      }]
    }

    // Favoriet spiergroep
    const favoriet = spiergroepen[0]?.[0] || '—'

    setStats({
      dagen: datums.length,
      sets: rows.length,
      oefeningen: oefeningen.length,
      streak,
      top,
      spiergroepen,
      activiteitData,
      donutData,
      favoriet,
    })
  }

  if (!stats) return <div style={{color:'#555', textAlign:'center', marginTop:60}}>Laden...</div>

  if (stats.leeg) return (
    <div style={{color:'#555', textAlign:'center', marginTop:60}}>
      <p style={{fontSize:40, marginBottom:16}}>📊</p>
      <p>Nog geen data beschikbaar.</p>
      <p style={{fontSize:12, marginTop:8}}>Voeg eerst een workout toe!</p>
    </div>
  )

  return (
    <div>
      <h1 className="page-title">📊 Dashboard</h1>

      {/* Streak */}
      <div className="stat-groot">
        <span className="stat-groot-getal">{stats.streak}</span>
        <span className="stat-groot-label">dagen streak 🔥</span>
      </div>

      {/* Stats rij */}
      <div className="stats-rij">
        <div className="stat-kaart">
          <span className="stat-getal">{stats.dagen}</span>
          <span className="stat-label">Trainingsdagen</span>
        </div>
        <div className="stat-kaart">
          <span className="stat-getal">{stats.sets}</span>
          <span className="stat-label">Totaal sets</span>
        </div>
        <div className="stat-kaart">
          <span className="stat-getal">{stats.oefeningen}</span>
          <span className="stat-label">Oefeningen</span>
        </div>
      </div>

      {/* Activiteit grafiek */}
      <div className="dashboard-sectie">
        <p className="dashboard-titel">📅 Activiteit laatste 5 weken</p>
        <Bar data={stats.activiteitData} options={{
          responsive: true,
          plugins: { legend: { display: false } },
          scales: {
            x: { ticks: { color: '#888', font: { size: 11 } }, grid: { color: '#222' } },
            y: { ticks: { color: '#888', stepSize: 1 }, grid: { color: '#222' }, beginAtZero: true }
          }
        }} />
      </div>

      {/* Donut grafiek */}
      <div className="dashboard-sectie">
        <p className="dashboard-titel">💪 Spiergroep verdeling</p>
        <div style={{maxWidth: 260, margin: '0 auto'}}>
          <Doughnut data={stats.donutData} options={{
            responsive: true,
            plugins: {
              legend: {
                display: true,
                position: 'bottom',
                labels: { color: '#aaa', font: { size: 11 }, boxWidth: 12, padding: 10 }
              }
            },
            cutout: '60%',
          }} />
        </div>
      </div>

      {/* Top oefeningen */}
      {stats.top.length > 0 && (
        <div className="dashboard-sectie">
          <p className="dashboard-titel">🏆 Top oefeningen</p>
          {stats.top.map(([naam, sets], i) => (
            <div key={i} className="top-rij">
              <span className="top-rank">#{i+1}</span>
              <span className="top-naam">{naam}</span>
              <span className="top-sets">{sets} sets</span>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}