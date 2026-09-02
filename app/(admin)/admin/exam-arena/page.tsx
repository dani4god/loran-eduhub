//app/(admin)/admin/exam-arena/page.tsx
'use client'

import { useEffect, useState } from 'react'
import { Loader2, Plus, Trophy } from 'lucide-react'

export default function AdminExamArenaPage() {
  const [rooms, setRooms] = useState<any[]>([])
  const [catalog, setCatalog] = useState<any[]>([])
  const [creating, setCreating] = useState(false)
  const [form, setForm] = useState({ name: '', instructions: '', screenShareMode: 'off', visibility: 'public' })
  const [selected, setSelected] = useState<any[]>([])

  const load = async () => {
    const [r,c] = await Promise.all([
      fetch('/api/exam-prep/arena').then(r=>r.json()),
      fetch('/api/exam-prep/subjects').then(r=>r.json()),
    ])
    setRooms(r.rooms || [])
    setCatalog(c.categories || [])
  }

  useEffect(() => { load() }, [])

  const toggle = (subject:string) => setSelected(cur => cur.some(x=>x.subject===subject)
    ? cur.filter(x=>x.subject!==subject)
    : [...cur,{subject,durationMinutes:30,questionCount:50}]
  )

  const create = async () => {
    setCreating(true)
    try {
      const res = await fetch('/api/exam-prep/arena',{
        method:'POST',headers:{'Content-Type':'application/json'},
        body:JSON.stringify({...form,subjects:selected,maxParticipants:100})
      })
      const d = await res.json()
      if(!res.ok) throw new Error(d.error)

      for(let i=0;i<selected.length;i++){
        const pr=await fetch(`/api/exam-prep/arena/${d.roomCode}/prepare`,{
          method:'POST',headers:{'Content-Type':'application/json'},
          body:JSON.stringify({subjectIndex:i})
        })
        const pd=await pr.json()
        if(!pr.ok) throw new Error(pd.error)
      }
      setForm({name:'',instructions:'',screenShareMode:'off',visibility:'public'})
      setSelected([])
      await load()
    } catch(e:any){ alert(e.message) } finally { setCreating(false) }
  }

  return (
    <div className="space-y-5 p-4 sm:p-6">
      <div><h1 className="text-2xl font-bold">Official Exam Arena</h1><p className="text-sm text-slate-500">Create Loran-branded live competitions.</p></div>

      <div className="rounded-2xl border bg-white p-5">
        <h2 className="font-bold">Create Official Competition</h2>
        <div className="mt-4 grid gap-3 sm:grid-cols-2">
          <input value={form.name} onChange={e=>setForm({...form,name:e.target.value})} placeholder="Room name" className="rounded-xl border px-3 py-2.5 text-sm"/>
          <select value={form.screenShareMode} onChange={e=>setForm({...form,screenShareMode:e.target.value})} className="rounded-xl border px-3 py-2.5 text-sm"><option value="off">Screen share off</option><option value="optional">Screen share optional</option><option value="required">Screen share required</option></select>
        </div>
        <textarea value={form.instructions} onChange={e=>setForm({...form,instructions:e.target.value})} placeholder="Exam instructions..." rows={3} className="mt-3 w-full rounded-xl border px-3 py-2.5 text-sm"/>

        <div className="mt-4 space-y-3">
          {catalog.map(cat=><div key={cat.value}><p className="mb-2 text-[10px] font-bold uppercase text-slate-400">{cat.label}</p><div className="flex flex-wrap gap-2">{cat.subjects.map((s:string)=><button type="button" key={s} onClick={()=>toggle(s)} className={`rounded-lg border px-2 py-1.5 text-[11px] ${selected.some(x=>x.subject===s)?'border-blue-500 bg-blue-50':''}`}>{s}</button>)}</div></div>)}
        </div>

        <button onClick={create} disabled={creating||!form.name||!selected.length} className="mt-5 flex items-center gap-2 rounded-xl bg-blue-600 px-4 py-3 text-sm font-bold text-white disabled:opacity-50">{creating?<Loader2 size={15} className="animate-spin"/>:<Plus size={15}/>}Create Official Arena</button>
      </div>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {rooms.filter(r=>r.official).map(r=><div key={r.roomCode} className="rounded-2xl border bg-white p-5"><Trophy size={18} className="text-amber-500"/><h3 className="mt-2 font-bold">{r.name}</h3><p className="mt-1 text-xs text-slate-500">{r.roomCode} · {r.participants} participants · {r.status}</p></div>)}
      </div>
    </div>
  )
}
