import { useMemo, useState } from "react";
import { Activity, ArrowDownToLine, CalendarDays, CheckCircle2, ClipboardList, FilePlus2, HeartPulse, Home, LayoutDashboard, Menu, Plus, Search, ShieldCheck, Stethoscope, Users, UserRoundCheck, X } from "lucide-react";

type Patient = { id: string; village: string; adl: number | null; adlItems: number[] | null; cg: string; status: "ติดบ้าน" | "ติดเตียง" | "ติดสังคม" | "รอประเมิน"; planBudget: string; planActual: string; updatedAt: string };
type CG = { id: string; village: string; workload: string };
type Visit = { id: string; patientId: string; date: string; result: string };
type Tab = "dashboard" | "patients" | "careplan" | "cg" | "visits";

const tabs: { id: Tab; label: string; icon: typeof LayoutDashboard }[] = [
  { id: "dashboard", label: "ภาพรวมระบบ", icon: LayoutDashboard },
  { id: "patients", label: "ทะเบียนผู้รับบริการ", icon: Users },
  { id: "careplan", label: "Care Plan 2 ส่วน", icon: ClipboardList },
  { id: "cg", label: "ทะเบียน CG", icon: UserRoundCheck },
  { id: "visits", label: "เยี่ยมบ้าน", icon: CalendarDays },
];
const blankPatient = (): Patient => ({ id: "", village: "", adl: null, adlItems: null, cg: "", status: "รอประเมิน", planBudget: "", planActual: "", updatedAt: "" });
const fmtDate = () => new Date().toLocaleDateString("th-TH");
const ADL_ITEMS = [
  { key: "feeding", label: "1. การรับประทานอาหาร", options: [{v:0,t:"ไม่สามารถรับประทานอาหารเองได้ ต้องมีผู้ป้อน"},{v:1,t:"รับประทานเองได้บางส่วน ต้องช่วยเหลือ"},{v:2,t:"รับประทานเองได้ตามปกติ"}] },
  { key: "grooming", label: "2. การล้างหน้า หวีผม แปรงฟัน และโกนหนวด", options: [{v:0,t:"ต้องการความช่วยเหลือ"},{v:1,t:"ทำได้เอง"}] },
  { key: "transfer", label: "3. การลุกจากที่นอนหรือเตียงไปยังเก้าอี้", options: [{v:0,t:"ไม่สามารถทำได้"},{v:1,t:"ต้องช่วยมาก/นั่งทรงตัวไม่ได้"},{v:2,t:"ต้องช่วยเล็กน้อยหรือคอยดูแล"},{v:3,t:"ทำได้เอง"}] },
  { key: "toilet", label: "4. การใช้ห้องน้ำ", options: [{v:0,t:"ช่วยเหลือตนเองไม่ได้"},{v:1,t:"ต้องช่วยบางส่วน"},{v:2,t:"ทำได้เอง"}] },
  { key: "mobility", label: "5. การเคลื่อนที่ภายในห้องหรือบ้าน", options: [{v:0,t:"เคลื่อนที่ไม่ได้"},{v:1,t:"ใช้รถเข็นและต้องช่วยเหลือ"},{v:2,t:"เดินโดยมีผู้ช่วยหรืออุปกรณ์ช่วย"},{v:3,t:"เดินได้เอง"}] },
  { key: "dressing", label: "6. การสวมใส่เสื้อผ้า", options: [{v:0,t:"ต้องช่วยทั้งหมด"},{v:1,t:"ช่วยบางส่วน"},{v:2,t:"ทำได้เอง"}] },
  { key: "stairs", label: "7. การขึ้นลงบันได 1 ชั้น", options: [{v:0,t:"ไม่สามารถทำได้"},{v:1,t:"ต้องช่วยเหลือ"},{v:2,t:"ขึ้นลงได้เอง"}] },
  { key: "bathing", label: "8. การอาบน้ำ", options: [{v:0,t:"ต้องมีคนช่วย"},{v:1,t:"อาบน้ำได้เอง"}] },
  { key: "bowels", label: "9. การกลั้นการถ่ายอุจจาระ", options: [{v:0,t:"กลั้นไม่ได้/ต้องได้รับการช่วยเหลือ"},{v:1,t:"มีปัญหาบางครั้ง"},{v:2,t:"กลั้นได้ปกติ"}] },
  { key: "bladder", label: "10. การกลั้นปัสสาวะ", options: [{v:0,t:"กลั้นไม่ได้/ต้องใส่สายสวนหรือช่วยเหลือ"},{v:1,t:"มีปัญหาบางครั้ง"},{v:2,t:"กลั้นได้ปกติ"}] },
];

export default function App() {
  const [tab, setTab] = useState<Tab>("dashboard");
  const [patients, setPatients] = useState<Patient[]>([]);
  const [caregivers, setCaregivers] = useState<CG[]>([]);
  const [visits, setVisits] = useState<Visit[]>([]);
  const [query, setQuery] = useState("");
  const [filterVillage, setFilterVillage] = useState("ทั้งหมด");
  const [patientForm, setPatientForm] = useState(false);
  const [draft, setDraft] = useState<Patient>(blankPatient());
  const [cgDraft, setCgDraft] = useState<CG>({ id: "", village: "", workload: "" });
  const [visitDraft, setVisitDraft] = useState<Visit>({ id: "", patientId: "", date: "", result: "" });
  const [selectedId, setSelectedId] = useState("");
  const [notice, setNotice] = useState("โหมดทดลองใช้งาน: ข้อมูลจะอยู่ในหน่วยความจำของหน้านี้เท่านั้น");
  const [mobileNav, setMobileNav] = useState(false);

  const selected = patients.find(p => p.id === selectedId) ?? patients[0];
  const villages = useMemo(() => ["ทั้งหมด", ...Array.from(new Set(patients.map(p => p.village).filter(Boolean))).sort()], [patients]);
  const filtered = patients.filter(p => (p.id.toLowerCase().includes(query.toLowerCase()) || p.village.includes(query)) && (filterVillage === "ทั้งหมด" || p.village === filterVillage));
  const assessed = patients.filter(p => p.adl !== null).length;
  const budgetCount = patients.filter(p => p.planBudget.trim()).length;
  const actualCount = patients.filter(p => p.planActual.trim()).length;

  function savePatient(e: React.FormEvent) {
    e.preventDefault();
    if (!draft.id.trim() || !draft.village.trim()) { setNotice("กรุณาระบุรหัสอ้างอิงและหมู่บ้าน"); return; }
    if (patients.some(p => p.id === draft.id.trim() && p.id !== selectedId)) { setNotice("รหัสอ้างอิงนี้มีอยู่แล้ว"); return; }
    const record = { ...draft, id: draft.id.trim(), updatedAt: fmtDate() };
    setPatients(old => selectedId ? old.map(p => p.id === selectedId ? record : p) : [...old, record]);
    setSelectedId(record.id); setPatientForm(false); setSelectedId(""); setNotice("บันทึกข้อมูลในเซสชันนี้แล้ว");
    setDraft(blankPatient());
  }
  function editPatient(p: Patient) { setDraft(p); setSelectedId(p.id); setPatientForm(true); }
  function saveCG(e: React.FormEvent) {
    e.preventDefault();
    if (!cgDraft.id.trim() || !cgDraft.village.trim()) return;
    setCaregivers(old => [...old.filter(c => c.id !== cgDraft.id), cgDraft]);
    setCgDraft({ id: "", village: "", workload: "" }); setNotice("เพิ่มข้อมูล CG ในเซสชันนี้แล้ว");
  }
  function saveVisit(e: React.FormEvent) {
    e.preventDefault();
    if (!visitDraft.patientId || !visitDraft.date) return;
    setVisits(old => [...old, { ...visitDraft, id: String(Date.now()) }]);
    setVisitDraft({ id: "", patientId: "", date: "", result: "" }); setNotice("บันทึกการเยี่ยมบ้านในเซสชันนี้แล้ว");
  }
  function exportCSV() {
    const rows = [["รหัสอ้างอิง","หมู่บ้าน","ADL","กลุ่ม","CG","Care Plan เสนอของบ","Care Plan ปฏิบัติจริง","วันที่แก้ไข"], ...patients.map(p => [p.id,p.village,p.adl ?? "",p.status,p.cg,p.planBudget,p.planActual,p.updatedAt])];
    const csv = "\uFEFF" + rows.map(row => row.map(v => '"' + String(v).replaceAll('"','""') + '"').join(",")).join("\r\n");
    const url = URL.createObjectURL(new Blob([csv], { type: "text/csv;charset=utf-8" }));
    const a = document.createElement("a"); a.href = url; a.download = "tongta-ltc-register.csv"; a.click(); URL.revokeObjectURL(url);
    setNotice("ส่งออก CSV แล้ว");
  }
  function updateADLItems(index: number, score: number) {
    if (!selected) return;
    const next = [...(selected.adlItems ?? Array(10).fill(-1))];
    next[index] = score;
    const complete = next.every(v => v >= 0);
    const total = complete ? next.reduce((sum, v) => sum + v, 0) : null;
    const status: Patient["status"] = total === null ? "รอประเมิน" : total <= 4 ? "ติดเตียง" : total <= 11 ? "ติดบ้าน" : "ติดสังคม";
    setPatients(old => old.map(p => p.id === selected.id ? { ...p, adlItems: next, adl: total, status, updatedAt: fmtDate() } : p));
  }
  function updateADL(score: number | null) {
    if (!selected) return;
    const status: Patient["status"] = score === null ? "รอประเมิน" : score <= 4 ? "ติดเตียง" : score <= 11 ? "ติดบ้าน" : "ติดสังคม";
    setPatients(old => old.map(p => p.id === selected.id ? { ...p, adl: score, status, updatedAt: fmtDate() } : p));
  }

  const kpis = [
    { label: "ผู้รับบริการในทะเบียน", value: patients.length, note: "รายการที่เพิ่มในเซสชันนี้", icon: Users, tone: "blue" },
    { label: "ประเมิน ADL แล้ว", value: assessed, note: "จากทะเบียนทั้งหมด", icon: Activity, tone: "green" },
    { label: "Care Plan ส่วนที่ 1", value: budgetCount, note: "แผนเสนอของบประมาณ", icon: ClipboardList, tone: "gold" },
    { label: "Care Plan ส่วนที่ 2", value: actualCount, note: "แผนปฏิบัติงานจริง", icon: CheckCircle2, tone: "purple" },
  ];

  return <div className="min-h-screen bg-[#f2f5fa] text-slate-800">
    <header className="sticky top-0 z-30 border-b border-white/10 bg-[#071d3b] text-white shadow-xl">
      <div className="mx-auto flex max-w-[1500px] items-center justify-between gap-4 px-4 py-3 lg:px-7">
        <div className="flex items-center gap-3">
          <button className="rounded-xl p-2 hover:bg-white/10 lg:hidden" onClick={() => setMobileNav(!mobileNav)} aria-label="เปิดเมนู">{mobileNav ? <X/> : <Menu/>}</button>
          <div className="grid h-11 w-11 place-items-center rounded-2xl border border-[#d4af37]/50 bg-gradient-to-br from-[#173c69] to-[#0a2446] text-[#e6c65a]"><HeartPulse size={25}/></div>
          <div><p className="text-[10px] font-bold tracking-[.22em] text-[#e6c65a]">TONGTA HEALTHCARE SYSTEM</p><h1 className="font-heading text-lg font-bold leading-tight sm:text-xl">TONGTA LTC MANAGER</h1><p className="text-[11px] text-blue-100/70">3C Plus+ Care Plan Studio</p></div>
        </div>
        <div className="hidden items-center gap-2 rounded-full border border-emerald-300/20 bg-emerald-400/10 px-3 py-2 text-xs text-emerald-100 sm:flex"><ShieldCheck size={15}/> Prototype · ไม่มีการเชื่อมฐานข้อมูลผู้ป่วย</div>
        <button onClick={exportCSV} className="inline-flex items-center gap-2 rounded-xl bg-[#d4af37] px-3 py-2.5 text-xs font-bold text-[#102644] shadow-lg hover:bg-[#e8c85b]"><ArrowDownToLine size={16}/><span className="hidden sm:inline">ส่งออก CSV</span></button>
      </div>
    </header>

    <div className="mx-auto grid max-w-[1500px] lg:grid-cols-[245px_1fr]">
      <aside className={`${mobileNav ? "block" : "hidden"} border-r border-slate-200 bg-white p-4 lg:sticky lg:top-[73px] lg:block lg:h-[calc(100vh-73px)]`}>
        <p className="mb-3 px-3 text-[10px] font-bold tracking-[.18em] text-slate-400">WORKSPACE</p>
        <nav className="space-y-1">{tabs.map(item => { const Icon = item.icon; return <button key={item.id} onClick={() => {setTab(item.id);setMobileNav(false);}} className={`flex w-full items-center gap-3 rounded-xl px-3 py-3 text-left text-sm font-semibold transition ${tab===item.id ? "bg-[#0b2b50] text-white shadow-lg shadow-blue-950/15" : "text-slate-600 hover:bg-slate-100"}`}><Icon size={18}/>{item.label}</button>; })}</nav>
        <div className="mt-8 rounded-2xl border border-amber-200 bg-amber-50 p-3"><div className="flex items-center gap-2 text-xs font-bold text-amber-900"><ShieldCheck size={16}/> ความปลอดภัยข้อมูล</div><p className="mt-2 text-[11px] leading-relaxed text-amber-800">ห้ามกรอกชื่อ-นามสกุล เลขบัตรประชาชน หรือข้อมูลสุขภาพที่ระบุตัวบุคคลได้ในต้นแบบนี้</p></div>
        <div className="mt-5 border-t border-slate-100 pt-4 text-[11px] text-slate-400">TONGTA LTC MANAGER<br/>Version 0.1 · Prototype</div>
      </aside>

      <main className="min-w-0 p-4 sm:p-6 lg:p-8">
        <div className="mb-6 flex flex-wrap items-end justify-between gap-3"><div><p className="text-xs font-bold tracking-[.16em] text-[#a17d19]">CARE MANAGEMENT WORKSPACE</p><h2 className="mt-1 font-heading text-2xl font-bold text-[#0b2b50] sm:text-3xl">{tabs.find(t=>t.id===tab)?.label}</h2><p className="mt-1 text-sm text-slate-500">จัดการกระบวนการดูแลระยะยาวอย่างเป็นระบบ</p></div><div className="text-right text-xs text-slate-500">วันที่ {fmtDate()}<p className="mt-1">ข้อมูลในหน้านี้เป็นข้อมูลที่ผู้ใช้เพิ่มเอง</p></div></div>
        {notice && <div className="mb-5 flex items-start gap-2 rounded-xl border border-blue-100 bg-blue-50 px-4 py-3 text-xs text-blue-800"><ShieldCheck size={16} className="shrink-0"/>{notice}</div>}

        {tab==="dashboard" && <div className="space-y-6">
          <section className="overflow-hidden rounded-3xl bg-gradient-to-r from-[#071d3b] via-[#123c68] to-[#155e65] p-6 text-white shadow-xl sm:p-8"><div className="max-w-2xl"><p className="text-xs font-bold tracking-[.2em] text-[#e8cb70]">LONG-TERM CARE COMMAND CENTER</p><h3 className="mt-3 font-heading text-2xl font-bold sm:text-3xl">ดูแลต่อเนื่อง เชื่อมโยงทุกแผนการดูแล</h3><p className="mt-3 max-w-xl text-sm leading-6 text-blue-100/80">พื้นที่ทำงานสำหรับทะเบียนผู้รับบริการ การประเมิน ADL แผนการดูแล 2 ส่วน การบริหาร CG และการติดตามเยี่ยมบ้าน</p><button onClick={()=>setTab("patients")} className="mt-5 inline-flex items-center gap-2 rounded-xl bg-[#d4af37] px-4 py-3 text-sm font-bold text-[#102644]"><Plus size={17}/> เพิ่มทะเบียนผู้รับบริการ</button></div></section>
          <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">{kpis.map(k=>{const Icon=k.icon;return <div key={k.label} className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm"><div className="flex items-center justify-between"><span className="text-xs font-semibold text-slate-500">{k.label}</span><span className={`rounded-xl p-2 ${k.tone==="blue"?"bg-blue-50 text-blue-700":k.tone==="green"?"bg-emerald-50 text-emerald-700":k.tone==="gold"?"bg-amber-50 text-amber-700":"bg-violet-50 text-violet-700"}`}><Icon size={19}/></span></div><p className="mt-4 text-3xl font-bold text-[#0b2b50]">{k.value}</p><p className="mt-1 text-[11px] text-slate-400">{k.note}</p></div>;})}</section>
          <section className="grid gap-4 xl:grid-cols-2"><div className="rounded-2xl border border-slate-200 bg-white p-5"><h3 className="font-heading font-bold text-[#0b2b50]">ความคืบหน้าการจัดทำ Care Plan</h3><div className="mt-5 space-y-4">{[{label:"ส่วนที่ 1 · เสนอของบประมาณ",value:budgetCount},{label:"ส่วนที่ 2 · ปฏิบัติงานจริง",value:actualCount},{label:"ประเมิน ADL",value:assessed}].map(x=><div key={x.label}><div className="mb-1.5 flex justify-between text-xs"><span className="text-slate-600">{x.label}</span><b>{x.value} / {patients.length}</b></div><div className="h-2 overflow-hidden rounded-full bg-slate-100"><div className="h-full rounded-full bg-gradient-to-r from-[#0b2b50] to-emerald-500" style={{width:patients.length?`${x.value/patients.length*100}%`:"0%"}}/></div></div>)}</div></div><div className="rounded-2xl border border-slate-200 bg-white p-5"><h3 className="font-heading font-bold text-[#0b2b50]">ทางลัดการทำงาน</h3><div className="mt-4 grid gap-2 sm:grid-cols-2">{tabs.slice(1).map(t=>{const Icon=t.icon;return <button key={t.id} onClick={()=>setTab(t.id)} className="flex items-center gap-3 rounded-xl border border-slate-100 p-3 text-left text-sm font-semibold hover:border-blue-200 hover:bg-blue-50"><Icon size={18} className="text-[#a17d19]"/>{t.label}</button>;})}</div></div></section>
        </div>}

        {tab==="patients" && <div className="space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-3"><div className="flex flex-1 flex-wrap gap-2"><div className="relative min-w-[210px] flex-1"><Search size={16} className="absolute left-3 top-3 text-slate-400"/><input value={query} onChange={e=>setQuery(e.target.value)} placeholder="ค้นหารหัสอ้างอิงหรือหมู่บ้าน" className="w-full rounded-xl border border-slate-200 bg-white py-2.5 pl-9 pr-3 text-sm outline-none focus:border-blue-400"/></div><select value={filterVillage} onChange={e=>setFilterVillage(e.target.value)} className="rounded-xl border border-slate-200 bg-white px-3 text-sm">{villages.map(v=><option key={v}>{v}</option>)}</select></div><button onClick={()=>{setDraft(blankPatient());setSelectedId("");setPatientForm(true);}} className="inline-flex items-center gap-2 rounded-xl bg-[#0b2b50] px-4 py-2.5 text-sm font-bold text-white"><FilePlus2 size={17}/> เพิ่มรายการ</button></div>
          {patientForm && <form onSubmit={savePatient} className="rounded-2xl border border-blue-200 bg-white p-5 shadow-sm"><div className="mb-4 flex items-center justify-between"><h3 className="font-bold text-[#0b2b50]">{selectedId?"แก้ไขทะเบียน":"เพิ่มทะเบียนผู้รับบริการ"}</h3><button type="button" onClick={()=>setPatientForm(false)}><X size={18}/></button></div><div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3"><label className="field-label">รหัสอ้างอิง (ไม่ใช้ชื่อจริง)<input required value={draft.id} onChange={e=>setDraft({...draft,id:e.target.value})} placeholder="เช่น LTC-001" className="field-input"/></label><label className="field-label">หมู่บ้าน / หมู่ที่<input required value={draft.village} onChange={e=>setDraft({...draft,village:e.target.value})} placeholder="เช่น ม.1" className="field-input"/></label><label className="field-label">CG ผู้รับผิดชอบ<input value={draft.cg} onChange={e=>setDraft({...draft,cg:e.target.value})} placeholder="รหัส CG (ถ้ามี)" className="field-input"/></label></div><div className="mt-4 flex justify-end gap-2"><button type="button" onClick={()=>setPatientForm(false)} className="rounded-xl border px-4 py-2 text-sm">ยกเลิก</button><button className="rounded-xl bg-[#0b2b50] px-4 py-2 text-sm font-bold text-white">บันทึก</button></div></form>}
          <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm"><div className="flex items-center justify-between border-b border-slate-100 px-4 py-3 text-xs text-slate-500"><span>ทะเบียนผู้รับบริการ (ใช้รหัสแทนตัวบุคคล)</span><b>{filtered.length} รายการ</b></div><div className="overflow-x-auto"><table className="w-full min-w-[750px] text-left text-sm"><thead className="bg-slate-50 text-xs text-slate-500"><tr>{["รหัสอ้างอิง","หมู่บ้าน","ADL","กลุ่ม","CG","แก้ไข"].map(x=><th key={x} className="px-4 py-3">{x}</th>)}</tr></thead><tbody className="divide-y divide-slate-100">{filtered.map(p=><tr key={p.id} className="hover:bg-slate-50"><td className="px-4 py-3 font-bold text-[#0b2b50]">{p.id}</td><td className="px-4 py-3">{p.village}</td><td className="px-4 py-3">{p.adl ?? "รอประเมิน"}</td><td className="px-4 py-3"><span className="rounded-full bg-slate-100 px-2.5 py-1 text-xs">{p.status}</span></td><td className="px-4 py-3">{p.cg||"—"}</td><td className="px-4 py-3"><button onClick={()=>editPatient(p)} className="font-semibold text-blue-700 hover:underline">แก้ไข / ADL</button></td></tr>)}</tbody></table></div>{!filtered.length && <div className="p-10 text-center"><Users size={30} className="mx-auto text-slate-300"/><p className="mt-3 font-semibold text-slate-600">ยังไม่มีข้อมูลในทะเบียน</p><p className="mt-1 text-xs text-slate-400">เพิ่มรายการโดยใช้รหัสอ้างอิงแทนชื่อจริง</p></div>}</div>
          {selected && <div className="rounded-2xl border border-slate-200 bg-white p-5">
            <div className="flex flex-wrap items-center justify-between gap-3"><div><p className="text-xs text-slate-400">แบบประเมิน Barthel ADL · 10 กิจกรรม</p><h3 className="font-bold text-[#0b2b50]">{selected.id} · {selected.village}</h3></div><button onClick={()=>{setPatients(old=>old.map(p=>p.id===selected.id?{...p,adl:null,adlItems:null,status:"รอประเมิน",updatedAt:fmtDate()}:p));}} className="text-xs text-slate-500 underline">ล้างผลประเมิน</button></div>
            <div className="mt-4 flex flex-wrap items-center justify-between gap-3 rounded-xl bg-[#f3f7fb] p-4"><div><p className="text-xs text-slate-500">คะแนนรวม</p><p className="text-3xl font-bold text-[#0b2b50]">{selected.adlItems?.every(v=>v>=0) ? selected.adl : "—"} <span className="text-sm font-medium text-slate-400">/ 20</span></p></div><div className="rounded-xl bg-white px-4 py-3 text-sm font-bold text-blue-800">{selected.status}</div></div>
            <p className="mt-2 text-[11px] text-slate-500">เลือกคะแนนตามแบบประเมินต้นฉบับ คะแนนรวมสูงสุด 20 คะแนน โดยระบบจะรวมเมื่อเลือกครบทั้ง 10 กิจกรรม ทั้งนี้ต้องตรวจสอบแบบประเมินมาตรฐานและเกณฑ์ของหน่วยงานก่อนใช้งานจริง</p>
            <div className="mt-4 space-y-4">{ADL_ITEMS.map((item,index)=><section key={item.key} className="rounded-xl border border-slate-100 p-4"><h4 className="mb-3 text-sm font-bold text-[#0b2b50]">{item.label}</h4><div className="grid gap-2 sm:grid-cols-2">{item.options.map(option=><label key={option.v} className={`flex cursor-pointer items-start gap-2 rounded-lg border p-3 text-xs leading-5 ${selected.adlItems?.[index]===option.v?"border-blue-400 bg-blue-50 text-blue-900":"border-slate-200 hover:bg-slate-50"}`}><input type="radio" name={item.key} checked={selected.adlItems?.[index]===option.v} onChange={()=>updateADLItems(index,option.v)} className="mt-0.5 accent-blue-700"/><span><b className="mr-1">{option.v}</b>{option.t}</span></label>)}</div></section>)}</div>
            <p className="mt-4 rounded-lg bg-amber-50 p-3 text-[11px] leading-5 text-amber-900">หมายเหตุ: ชุดคะแนนนี้เป็นโครงสร้างแบบร่างเพื่อพัฒนาฟังก์ชันเท่านั้น เนื่องจากคะแนนและเกณฑ์ Barthel ADL ที่ใช้จริงต้องยึดแบบฟอร์มของหน่วยงาน/คู่มือ 3C Plus+ ที่ได้รับอนุมัติ ก่อนใช้กับผู้รับบริการ</p>
          </div>}
        </div>}

        {tab==="careplan" && <div className="space-y-4">
          <div className="rounded-2xl border border-amber-200 bg-amber-50 p-4 text-xs leading-5 text-amber-900">เลือกผู้รับบริการจากรายการที่เพิ่มไว้ก่อน ข้อมูล Care Plan เป็นข้อความร่างสำหรับเตรียมบันทึก ไม่ได้ส่งเข้าสู่ระบบ 3C Plus+ โดยอัตโนมัติ</div>
          <div className="rounded-2xl border border-slate-200 bg-white p-4"><label className="field-label">ผู้รับบริการ<select value={selected?.id ?? ""} onChange={e=>setSelectedId(e.target.value)} className="field-input"><option value="">— เลือกรหัสอ้างอิง —</option>{patients.map(p=><option key={p.id} value={p.id}>{p.id} · {p.village}</option>)}</select></label></div>
          {selected ? <div className="grid gap-4 xl:grid-cols-2"><div className="rounded-2xl border border-blue-200 bg-white p-5"><div className="flex items-center gap-2"><span className="rounded-lg bg-blue-100 p-2 text-blue-800"><ClipboardList size={19}/></span><div><p className="text-[10px] font-bold tracking-wider text-blue-700">PART 01</p><h3 className="font-heading font-bold text-[#0b2b50]">แผนเสนอของบประมาณ</h3></div></div><p className="mt-2 text-xs text-slate-500">ปัญหา / เป้าหมาย / กิจกรรม / ทรัพยากรและงบประมาณ</p><textarea value={selected.planBudget} onChange={e=>setPatients(old=>old.map(p=>p.id===selected.id?{...p,planBudget:e.target.value,updatedAt:fmtDate()}:p))} rows={12} placeholder="บันทึกร่างแผนเสนอของบประมาณ..." className="mt-4 w-full rounded-xl border border-slate-200 p-3 text-sm leading-6 outline-none focus:border-blue-400"/></div><div className="rounded-2xl border border-emerald-200 bg-white p-5"><div className="flex items-center gap-2"><span className="rounded-lg bg-emerald-100 p-2 text-emerald-800"><CheckCircle2 size={19}/></span><div><p className="text-[10px] font-bold tracking-wider text-emerald-700">PART 02</p><h3 className="font-heading font-bold text-[#0b2b50]">แผนปฏิบัติงานจริง</h3></div></div><p className="mt-2 text-xs text-slate-500">กิจกรรมที่ดำเนินการ / ผู้รับผิดชอบ / ผลลัพธ์ / ติดตาม</p><textarea value={selected.planActual} onChange={e=>setPatients(old=>old.map(p=>p.id===selected.id?{...p,planActual:e.target.value,updatedAt:fmtDate()}:p))} rows={12} placeholder="บันทึกร่างแผนปฏิบัติงานจริง..." className="mt-4 w-full rounded-xl border border-slate-200 p-3 text-sm leading-6 outline-none focus:border-emerald-400"/></div></div> : <div className="rounded-2xl border border-dashed border-slate-300 bg-white p-12 text-center text-sm text-slate-500">เพิ่มทะเบียนผู้รับบริการก่อน จึงจะจัดทำ Care Plan ได้</div>}
        </div>}

        {tab==="cg" && <div className="space-y-4"><form onSubmit={saveCG} className="rounded-2xl border border-slate-200 bg-white p-5"><h3 className="mb-4 font-bold text-[#0b2b50]">เพิ่ม Caregiver</h3><div className="grid gap-3 sm:grid-cols-3"><label className="field-label">รหัส CG<input required value={cgDraft.id} onChange={e=>setCgDraft({...cgDraft,id:e.target.value})} className="field-input" placeholder="CG-001"/></label><label className="field-label">พื้นที่รับผิดชอบ<input required value={cgDraft.village} onChange={e=>setCgDraft({...cgDraft,village:e.target.value})} className="field-input" placeholder="หมู่บ้าน"/></label><label className="field-label">ภาระงาน / หมายเหตุ<input value={cgDraft.workload} onChange={e=>setCgDraft({...cgDraft,workload:e.target.value})} className="field-input" placeholder="ระบุเมื่อมีข้อมูล"/></label></div><button className="mt-4 inline-flex items-center gap-2 rounded-xl bg-[#0b2b50] px-4 py-2.5 text-sm font-bold text-white"><Plus size={16}/> เพิ่ม CG</button></form><div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">{caregivers.map(c=><div key={c.id} className="rounded-2xl border border-slate-200 bg-white p-5"><div className="flex items-center gap-3"><span className="rounded-xl bg-emerald-50 p-3 text-emerald-700"><Stethoscope/></span><div><p className="font-bold text-[#0b2b50]">{c.id}</p><p className="text-xs text-slate-500">{c.village}</p></div></div><p className="mt-3 text-xs text-slate-600">ภาระงาน: {c.workload||"ยังไม่ระบุ"}</p><button onClick={()=>setCaregivers(old=>old.filter(x=>x.id!==c.id))} className="mt-3 text-xs text-red-600 underline">ลบรายการ</button></div>)}</div>{!caregivers.length&&<div className="rounded-2xl border border-dashed border-slate-300 bg-white p-10 text-center text-sm text-slate-500">ยังไม่มีข้อมูล CG · เพิ่มโดยใช้รหัสแทนชื่อจริง</div>}</div>}

        {tab==="visits" && <div className="space-y-4"><form onSubmit={saveVisit} className="rounded-2xl border border-slate-200 bg-white p-5"><h3 className="mb-4 font-bold text-[#0b2b50]">บันทึกการเยี่ยมบ้าน</h3><div className="grid gap-3 sm:grid-cols-3"><label className="field-label">รหัสผู้รับบริการ<select required value={visitDraft.patientId} onChange={e=>setVisitDraft({...visitDraft,patientId:e.target.value})} className="field-input"><option value="">เลือกรหัส</option>{patients.map(p=><option key={p.id}>{p.id}</option>)}</select></label><label className="field-label">วันที่เยี่ยม<input required type="date" value={visitDraft.date} onChange={e=>setVisitDraft({...visitDraft,date:e.target.value})} className="field-input"/></label><label className="field-label">ผลการเยี่ยม / แผนติดตาม<input value={visitDraft.result} onChange={e=>setVisitDraft({...visitDraft,result:e.target.value})} className="field-input" placeholder="สรุปผลโดยไม่ระบุตัวบุคคล"/></label></div><button className="mt-4 inline-flex items-center gap-2 rounded-xl bg-[#0b2b50] px-4 py-2.5 text-sm font-bold text-white"><Plus size={16}/> บันทึกการเยี่ยม</button></form><div className="overflow-hidden rounded-2xl border border-slate-200 bg-white"><div className="border-b border-slate-100 p-4 font-bold text-[#0b2b50]">ประวัติการเยี่ยมบ้าน</div>{visits.length?visits.slice().reverse().map(v=><div key={v.id} className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-100 px-4 py-3 text-sm"><div><b>{v.patientId}</b><p className="text-xs text-slate-500">{v.result||"ไม่มีหมายเหตุ"}</p></div><span className="text-xs text-slate-500">{v.date}</span></div>):<div className="p-10 text-center text-sm text-slate-500">ยังไม่มีประวัติการเยี่ยมบ้าน</div>}</div></div>}
      </main>
    </div>
    <footer className="border-t border-slate-200 bg-white px-4 py-5 text-center text-[11px] text-slate-400">TONGTA LTC MANAGER · 3C Plus+ Care Plan Studio · ต้นแบบสำหรับพัฒนาต่อ ไม่ใช่ระบบเวชระเบียนหรือระบบ 3C Plus+ อย่างเป็นทางการ</footer>
  </div>;
}
