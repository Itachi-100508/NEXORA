import { useEffect, useMemo, useState } from 'react'
import { motion } from 'framer-motion'
import {
  CalendarDays,
  CheckCircle2,
  Download,
  FileSpreadsheet,
  Filter,
  History,
  LayoutList,
  Printer,
  Save,
  Users,
  XCircle,
} from 'lucide-react'
import { useToast } from '../../context/ToastContext'
import {
  getAttendanceClasses,
  getAttendanceDivisions,
  getAttendanceStudents,
  getAttendanceRecord,
  saveAttendanceRecord,
  getAttendanceHistory,
  getWeeklyAttendance,
  getStudentAttendanceSummary,
} from '../../services/mock'
import PageHeader from '../../components/ui/PageHeader'
import Card from '../../components/ui/Card'
import Button from '../../components/ui/Button'
import Badge from '../../components/ui/Badge'
import Select from '../../components/ui/Select'
import SearchBar from '../../components/ui/SearchBar'
import StatCard from '../../components/ui/StatCard'
import EmptyState from '../../components/ui/EmptyState'
import { SkeletonBlock } from '../../components/ui/Skeleton'
import ConfirmDialog from '../../components/ui/ConfirmDialog'
import { cn, formatDate } from '../../utils/helpers'
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, Legend, LineChart, Line } from 'recharts'

function toInputDate(d) {
  if (!d) return ''
  const date = d instanceof Date ? d : new Date(d)
  return date.toISOString().split('T')[0]
}

function todayStr() {
  return toInputDate(new Date())
}

function formatWeekRange(startDate, endDate) {
  const s = new Date(startDate)
  const e = new Date(endDate)
  return `${s.getDate()} ${s.toLocaleString('en-US', { month: 'short' })} – ${e.getDate()} ${e.toLocaleString('en-US', { month: 'short' })} ${e.getFullYear()}`
}

export default function Attendance() {
  const { toast } = useToast()

  const [view, setView] = useState('daily')

  const [classes, setClasses] = useState([])
  const [selectedClass, setSelectedClass] = useState('')
  const [divisions, setDivisions] = useState([])
  const [selectedDivision, setSelectedDivision] = useState('')
  const [selectedDate, setSelectedDate] = useState(todayStr())

  const [students, setStudents] = useState([])
  const [attendance, setAttendance] = useState({})
  const [existingRecord, setExistingRecord] = useState(null)

  const [search, setSearch] = useState('')
  const [loadingStudents, setLoadingStudents] = useState(false)
  const [saving, setSaving] = useState(false)
  const [dirty, setDirty] = useState(false)
  const [confirmOpen, setConfirmOpen] = useState(false)
  const [resetOpen, setResetOpen] = useState(false)

  const [weeklyData, setWeeklyData] = useState(null)
  const [weekOffset, setWeekOffset] = useState(0)
  const [loadingWeekly, setLoadingWeekly] = useState(false)

  const [historyData, setHistoryData] = useState([])
  const [historyTotal, setHistoryTotal] = useState(0)
  const [historyPage, setHistoryPage] = useState(1)
  const [historyFilters, setHistoryFilters] = useState({ classId: '', division: '', dateFrom: '', dateTo: '' })
  const [loadingHistory, setLoadingHistory] = useState(false)

  const [studentSummaries, setStudentSummaries] = useState([])
  const [summarySort, setSummarySort] = useState('rollNumber')
  const [summaryFilter, setSummaryFilter] = useState('all')
  const [summarySearch, setSummarySearch] = useState('')
  const [loadingSummary, setLoadingSummary] = useState(false)

  useEffect(() => {
    getAttendanceClasses().then(setClasses)
  }, [])

  useEffect(() => {
    if (selectedClass) {
      getAttendanceDivisions(selectedClass).then(setDivisions)
      setSelectedDivision('')
      setStudents([])
      setAttendance({})
      setExistingRecord(null)
    }
  }, [selectedClass])

  useEffect(() => {
    if (!selectedClass || !selectedDivision || view !== 'daily') return
    setLoadingStudents(true)
    Promise.all([
      getAttendanceStudents(selectedClass, selectedDivision),
      getAttendanceRecord(selectedClass, selectedDivision, selectedDate),
    ]).then(([studs, record]) => {
      setStudents(studs)
      if (record) {
        const att = {}
        record.students.forEach((s) => { att[s.studentId] = s.status })
        setAttendance(att)
        setExistingRecord(record)
      } else {
        const att = {}
        studs.forEach((s) => { att[s.id] = '' })
        setAttendance(att)
        setExistingRecord(null)
      }
      setDirty(false)
      setLoadingStudents(false)
    })
  }, [selectedClass, selectedDivision, selectedDate, view])

  useEffect(() => {
    if (!selectedClass || !selectedDivision || view !== 'weekly') return
    setLoadingWeekly(true)
    getWeeklyAttendance(selectedClass, selectedDivision, weekOffset).then((data) => {
      setWeeklyData(data)
      setLoadingWeekly(false)
    })
  }, [selectedClass, selectedDivision, weekOffset, view])

  useEffect(() => {
    if (view !== 'history') return
    setLoadingHistory(true)
    getAttendanceHistory({ ...historyFilters, page: historyPage, pageSize: 10 }).then((res) => {
      setHistoryData(res.data)
      setHistoryTotal(res.total)
      setLoadingHistory(false)
    })
  }, [view, historyFilters, historyPage])

  useEffect(() => {
    if (!selectedClass || !selectedDivision || view !== 'studentwise') return
    setLoadingSummary(true)
    getStudentAttendanceSummary(selectedClass, selectedDivision).then((data) => {
      setStudentSummaries(data)
      setLoadingSummary(false)
    })
  }, [selectedClass, selectedDivision, view])

  const filteredStudents = useMemo(() => {
    const q = search.trim().toLowerCase()
    if (!q) return students
    return students.filter((s) => s.name.toLowerCase().includes(q) || s.rollNumber.toLowerCase().includes(q))
  }, [students, search])

  const totalPresent = useMemo(() =>
    students.filter((s) => attendance[s.id] === 'PRESENT').length,
    [students, attendance],
  )
  const totalAbsent = useMemo(() =>
    students.filter((s) => attendance[s.id] === 'ABSENT').length,
    [students, attendance],
  )
  const totalUnmarked = useMemo(() =>
    students.filter((s) => !attendance[s.id]).length,
    [students, attendance],
  )

  const handleToggle = (studentId, status) => {
    setDirty(true)
    setAttendance((prev) => ({ ...prev, [studentId]: status }))
  }

  const handleMarkAll = (status) => {
    setDirty(true)
    const updated = {}
    students.forEach((s) => { updated[s.id] = status })
    setAttendance(updated)
  }

  const handleReset = () => {
    if (dirty) {
      setResetOpen(true)
      return
    }
    const reset = {}
    students.forEach((s) => { reset[s.id] = '' })
    setAttendance(reset)
    setDirty(false)
  }

  const handleConfirmReset = () => {
    const reset = {}
    students.forEach((s) => { reset[s.id] = '' })
    setAttendance(reset)
    setDirty(false)
    setResetOpen(false)
  }

  const handleSave = async () => {
    if (totalUnmarked > 0) {
      toast.error('Cannot save', `${totalUnmarked} student${totalUnmarked > 1 ? 's' : ''} ${totalUnmarked > 1 ? 'are' : 'is'} still unmarked.`)
      return
    }
    setSaving(true)
    try {
      const result = await saveAttendanceRecord({
        classId: selectedClass,
        className: `Class ${selectedClass}`,
        division: selectedDivision,
        date: selectedDate,
        students: students.map((s) => ({
          studentId: s.id,
          rollNumber: s.rollNumber,
          studentName: s.name,
          status: attendance[s.id] || 'ABSENT',
        })),
        markedBy: 'James Carter',
      })
      if (result.ok) {
        setExistingRecord(result.record)
        setDirty(false)
        toast.success('Attendance saved', 'Attendance recorded successfully.')
      }
    } catch {
      toast.error('Save failed', 'Unable to save attendance. Please try again.')
    } finally {
      setSaving(false)
    }
  }

  const handleExportDaily = () => {
    if (!students.length) return
    const header = ['Roll Number', 'Student Name', 'Class', 'Division', 'Date', 'Status']
    const rows = students.map((s) => [
      s.rollNumber,
      s.name,
      `Class ${selectedClass}`,
      selectedDivision,
      selectedDate,
      attendance[s.id] || 'UNMARKED',
    ])
    const csv = [header.join(','), ...rows.map((r) => r.join(','))].join('\n')
    downloadCSV(csv, `attendance-${selectedClass}-${selectedDivision}-${selectedDate}.csv`)
    toast.success('Exported', 'Daily attendance exported successfully.')
  }

  const handleExportWeekly = () => {
    if (!weeklyData) return
    const header = ['Day', 'Date', 'Present', 'Absent', 'Total', 'Attendance %']
    const rows = weeklyData.days.map((d) => [
      d.day,
      d.date,
      d.present,
      d.absent,
      d.total,
      `${d.percentage}%`,
    ])
    const csv = [
      `EXAMORA Weekly Attendance Report`,
      `Class: ${selectedClass}`,
      `Division: ${selectedDivision}`,
      `Week: ${formatWeekRange(weeklyData.startDate, weeklyData.endDate)}`,
      '',
      header.join(','),
      ...rows.map((r) => r.join(',')),
    ].join('\n')
    downloadCSV(csv, `weekly-attendance-${selectedClass}-${selectedDivision}-${weeklyData.startDate}.csv`)
    toast.success('Exported', 'Weekly attendance exported successfully.')
  }

  const handleExportStudentWise = () => {
    if (!studentSummaries.length) return
    const header = ['Roll Number', 'Student Name', 'Present', 'Absent', 'Total Days', 'Attendance %']
    const rows = studentSummaries.map((s) => [
      s.rollNumber,
      s.name,
      s.present,
      s.absent,
      s.total,
      `${s.percentage}%`,
    ])
    const csv = [
      `EXAMORA Student-wise Attendance Report`,
      `Class: ${selectedClass}`,
      `Division: ${selectedDivision}`,
      '',
      header.join(','),
      ...rows.map((r) => r.join(',')),
    ].join('\n')
    downloadCSV(csv, `student-attendance-${selectedClass}-${selectedDivision}.csv`)
    toast.success('Exported', 'Student-wise attendance exported successfully.')
  }

  function downloadCSV(content, filename) {
    const blob = new Blob([content], { type: 'text/csv;charset=utf-8;' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = filename
    a.click()
    URL.revokeObjectURL(url)
  }

  const handlePrint = () => {
    window.print()
  }

  const classSelected = selectedClass && selectedDivision
  const weekRangeText = weeklyData ? formatWeekRange(weeklyData.startDate, weeklyData.endDate) : ''

  const filteredSummaries = useMemo(() => {
    let data = [...studentSummaries]
    const q = summarySearch.trim().toLowerCase()
    if (q) data = data.filter((s) => s.name.toLowerCase().includes(q) || s.rollNumber.toLowerCase().includes(q))
    if (summaryFilter === 'excellent') data = data.filter((s) => s.percentage >= 90)
    else if (summaryFilter === 'good') data = data.filter((s) => s.percentage >= 75 && s.percentage < 90)
    else if (summaryFilter === 'low') data = data.filter((s) => s.percentage >= 60 && s.percentage < 75)
    else if (summaryFilter === 'critical') data = data.filter((s) => s.percentage < 60)
    data.sort((a, b) => {
      if (summarySort === 'name') return a.name.localeCompare(b.name)
      if (summarySort === 'percentage') return b.percentage - a.percentage
      if (summarySort === 'present') return b.present - a.present
      if (summarySort === 'absent') return b.absent - a.absent
      return a.rollNumber.localeCompare(b.rollNumber)
    })
    return data
  }, [studentSummaries, summarySearch, summaryFilter, summarySort])

  const avgPct = studentSummaries.length ? Math.round(studentSummaries.reduce((a, s) => a + s.percentage, 0) / studentSummaries.length) : 0

  const tabs = [
    { key: 'daily', label: 'Daily', icon: CalendarDays },
    { key: 'weekly', label: 'Weekly', icon: LayoutList },
    { key: 'studentwise', label: 'Student-wise', icon: Users },
    { key: 'history', label: 'History', icon: History },
  ]

  return (
    <div className="no-print-wrapper">
      <PageHeader
        title="Attendance Management"
        subtitle="Record, track and analyze student attendance."
        actions={
          <div className="flex" style={{ gap: 8 }}>
            {classSelected && view === 'daily' && (
              <Button variant="outline" size="sm" onClick={handlePrint}>
                <Printer size={15} /> Print
              </Button>
            )}
          </div>
        }
      />

      <div className="attendance-filters" style={{ marginBottom: 20 }}>
        <div className="flex" style={{ gap: 12, flexWrap: 'wrap', alignItems: 'flex-end' }}>
          <div style={{ minWidth: 150 }}>
            <Select label="Class" value={selectedClass} onChange={(e) => setSelectedClass(Number(e.target.value) || '')}>
              <option value="">Select Class</option>
              {classes.map((c) => (
                <option key={c.id} value={c.id}>{c.name}</option>
              ))}
            </Select>
          </div>
          <div style={{ minWidth: 150 }}>
            <Select
              label="Division"
              value={selectedDivision}
              onChange={(e) => setSelectedDivision(e.target.value)}
              disabled={!selectedClass}
            >
              <option value="">Select Division</option>
              {divisions.map((d) => (
                <option key={d.id} value={d.id}>{d.name}</option>
              ))}
            </Select>
          </div>
          {view === 'daily' && (
            <div style={{ minWidth: 180 }}>
              <label className="form-label">Attendance Date</label>
              <input
                type="date"
                className="form-control"
                value={selectedDate}
                onChange={(e) => setSelectedDate(e.target.value)}
              />
            </div>
          )}
        </div>

        {classSelected && (
          <div className="attendance-tabs" style={{ marginTop: 14 }}>
            {tabs.map((tab) => (
              <button
                key={tab.key}
                type="button"
                className={cn('attendance-tab', view === tab.key && 'active')}
                onClick={() => setView(tab.key)}
              >
                <tab.icon size={15} />
                {tab.label}
              </button>
            ))}
          </div>
        )}
      </div>

      {classSelected && (
        <div className="attendance-context-bar" style={{ marginBottom: 16 }}>
          <Badge variant="primary" dot>Class {selectedClass}</Badge>
          <Badge variant="accent">Division {selectedDivision}</Badge>
          {view === 'daily' && <Badge variant="secondary">{formatDate(selectedDate, { weekday: 'long', day: '2-digit', month: 'long', year: 'numeric' })}</Badge>}
          {view === 'weekly' && weekRangeText && <Badge variant="secondary">{weekRangeText}</Badge>}
          {existingRecord && <Badge variant="success" dot>Record exists</Badge>}
        </div>
      )}

      {!classSelected && (
        <Card padded>
          <EmptyState
            title="Select Class and Division"
            description="Choose a class and division from the filters above to get started."
          />
        </Card>
      )}

      {classSelected && view === 'daily' && (
        <DailyView
          loading={loadingStudents}
          students={filteredStudents}
          allStudents={students}
          attendance={attendance}
          search={search}
          setSearch={setSearch}
          onToggle={handleToggle}
          onMarkAll={handleMarkAll}
          onReset={handleReset}
          onSave={() => setConfirmOpen(true)}
          saving={saving}
          presentCount={totalPresent}
          absentCount={totalAbsent}
          unmarkedCount={totalUnmarked}
          existingRecord={existingRecord}
          selectedClass={selectedClass}
          selectedDivision={selectedDivision}
          onExportDaily={handleExportDaily}
          onPrint={handlePrint}
        />
      )}

      {classSelected && view === 'weekly' && (
        <WeeklyView
          loading={loadingWeekly}
          data={weeklyData}
          weekOffset={weekOffset}
          setWeekOffset={setWeekOffset}
          onExport={handleExportWeekly}
        />
      )}

      {classSelected && view === 'studentwise' && (
        <StudentWiseView
          loading={loadingSummary}
          summaries={filteredSummaries}
          allSummaries={studentSummaries}
          search={summarySearch}
          setSearch={setSummarySearch}
          filter={summaryFilter}
          setFilter={setSummaryFilter}
          sort={summarySort}
          setSort={setSummarySort}
          avgPct={avgPct}
          onExport={handleExportStudentWise}
        />
      )}

      {classSelected && view === 'history' && (
        <HistoryView
          loading={loadingHistory}
          data={historyData}
          total={historyTotal}
          page={historyPage}
          setPage={setHistoryPage}
          filters={historyFilters}
          setFilters={setHistoryFilters}
          classes={classes}
          divisions={divisions}
        />
      )}

      <ConfirmDialog
        open={confirmOpen}
        title="Save attendance?"
        description={
          existingRecord
            ? `Update attendance for Class ${selectedClass} Division ${selectedDivision} on ${formatDate(selectedDate)}?`
            : `Save attendance for Class ${selectedClass} Division ${selectedDivision} on ${formatDate(selectedDate)}?`
        }
        confirmLabel={existingRecord ? 'Update Attendance' : 'Save Attendance'}
        variant="success"
        loading={saving}
        onCancel={() => setConfirmOpen(false)}
        onConfirm={async () => {
          setConfirmOpen(false)
          await handleSave()
        }}
      />

      <ConfirmDialog
        open={resetOpen}
        title="Reset attendance?"
        description="All unsaved attendance changes will be lost. Are you sure?"
        confirmLabel="Reset"
        variant="danger"
        onCancel={() => setResetOpen(false)}
        onConfirm={handleConfirmReset}
      />
    </div>
  )
}

function DailyView({
  loading, students, allStudents, attendance, search, setSearch,
  onToggle, onMarkAll, onReset, onSave, saving,
  presentCount, absentCount, unmarkedCount, existingRecord,
  selectedClass, selectedDivision,
  onExportDaily, onPrint,
}) {
  return (
    <>
      <div className="grid grid-4" style={{ marginBottom: 20 }}>
        <StatCard label="Total Students" value={allStudents.length} icon={Users} variant="primary" index={0} />
        <StatCard label="Present" value={presentCount} icon={CheckCircle2} variant="success" index={1} />
        <StatCard label="Absent" value={absentCount} icon={XCircle} variant="danger" index={2} />
        <StatCard
          label="Attendance %"
          value={allStudents.length > 0 ? `${Math.round((presentCount / allStudents.length) * 100)}%` : '—'}
          icon={FileSpreadsheet}
          variant={presentCount / Math.max(allStudents.length, 1) >= 0.75 ? 'accent' : 'warning'}
          index={3}
        />
      </div>

      <Card>
        <div className="card-header" style={{ flexWrap: 'wrap' }}>
          <div className="flex items-center" style={{ gap: 10, flexWrap: 'wrap' }}>
            <h3>Student Attendance</h3>
            <Badge variant="muted">{allStudents.length} students</Badge>
            {existingRecord && <Badge variant="success" dot>Existing record loaded</Badge>}
          </div>
          <div className="flex" style={{ gap: 8, flexWrap: 'wrap', alignItems: 'center' }}>
            <SearchBar value={search} onChange={setSearch} placeholder="Search by name or roll number..." />
          </div>
        </div>

        <div className="attendance-toolbar">
          <div className="flex items-center" style={{ gap: 6, flexWrap: 'wrap' }}>
            <span className="muted" style={{ fontSize: 12.5, marginRight: 4 }}>Bulk:</span>
            <Button size="sm" variant="soft-primary" onClick={() => onMarkAll('PRESENT')}>
              <CheckCircle2 size={14} /> All Present
            </Button>
            <Button size="sm" variant="danger-soft" onClick={() => onMarkAll('ABSENT')}>
              <XCircle size={14} /> All Absent
            </Button>
            <Button size="sm" variant="ghost" onClick={onReset}>
              Reset
            </Button>
          </div>
          <div className="muted" style={{ fontSize: 12.5 }}>
            Showing {students.length} of {allStudents.length} students
          </div>
        </div>

        {loading ? (
          <div style={{ padding: 22 }}>
            <SkeletonBlock rows={8} height={18} />
          </div>
        ) : students.length === 0 ? (
          <EmptyState
            title="No students found"
            description={search ? `No students match "${search}"` : `No students in Class ${selectedClass} Division ${selectedDivision}`}
          />
        ) : (
          <div className="table-wrap">
            <table className="table attendance-table">
              <thead>
                <tr>
                  <th style={{ width: 50 }}>#</th>
                  <th>Roll No.</th>
                  <th>Student Name</th>
                  <th style={{ width: 200, textAlign: 'center' }}>Attendance</th>
                  <th style={{ width: 110, textAlign: 'center' }}>Status</th>
                </tr>
              </thead>
              <tbody>
                {students.map((s, idx) => {
                  const status = attendance[s.id]
                  return (
                    <motion.tr
                      key={s.id}
                      initial={{ opacity: 0, y: 6 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: idx * 0.02 }}
                      className={cn(!status && 'row-unmarked')}
                    >
                      <td className="muted">{idx + 1}</td>
                      <td className="muted" style={{ fontFamily: 'monospace', fontSize: 13 }}>{s.rollNumber}</td>
                      <td>
                        <div className="cell-main">{s.name}</div>
                      </td>
                      <td style={{ textAlign: 'center' }}>
                        <div className="attendance-toggle-group">
                          <button
                            type="button"
                            className={cn('attendance-toggle', status === 'PRESENT' && 'present')}
                            onClick={() => onToggle(s.id, 'PRESENT')}
                          >
                            <CheckCircle2 size={14} /> Present
                          </button>
                          <button
                            type="button"
                            className={cn('attendance-toggle', status === 'ABSENT' && 'absent')}
                            onClick={() => onToggle(s.id, 'ABSENT')}
                          >
                            <XCircle size={14} /> Absent
                          </button>
                        </div>
                      </td>
                      <td style={{ textAlign: 'center' }}>
                        {status === 'PRESENT' && <Badge variant="success" dot>Present</Badge>}
                        {status === 'ABSENT' && <Badge variant="danger" dot>Absent</Badge>}
                        {!status && <Badge variant="warning">Unmarked</Badge>}
                      </td>
                    </motion.tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        )}

        <div className="card-footer" style={{ display: 'flex', justifyContent: 'space-between', flexWrap: 'wrap', gap: 12 }}>
          <div className="muted" style={{ fontSize: 13 }}>
            {unmarkedCount > 0 ? (
              <span style={{ color: 'var(--warning)' }}>{unmarkedCount} student{unmarkedCount > 1 ? 's' : ''} still unmarked.</span>
            ) : (
              <span style={{ color: 'var(--success)' }}>All students marked. Ready to save.</span>
            )}
          </div>
          <div className="flex" style={{ gap: 8 }}>
            <Button variant="outline" size="sm" onClick={onExportDaily}>
              <Download size={15} /> Export CSV
            </Button>
            <Button variant="outline" size="sm" onClick={onPrint}>
              <Printer size={15} /> Print
            </Button>
            <Button
              variant="success"
              onClick={onSave}
              loading={saving}
              disabled={unmarkedCount > 0 || allStudents.length === 0}
            >
              <Save size={16} /> {existingRecord ? 'Update Attendance' : 'Save Attendance'}
            </Button>
          </div>
        </div>
      </Card>
    </>
  )
}

function WeeklyView({ loading, data, weekOffset, setWeekOffset, onExport }) {
  if (loading) {
    return (
      <Card padded>
        <SkeletonBlock rows={6} height={18} />
      </Card>
    )
  }

  if (!data) return null

  return (
    <>
      <div className="flex items-center justify-between" style={{ marginBottom: 16, flexWrap: 'wrap', gap: 12 }}>
        <div className="flex items-center" style={{ gap: 10 }}>
          <Button variant="outline" size="sm" onClick={() => setWeekOffset(weekOffset - 1)}>
            Previous Week
          </Button>
          <Badge variant="primary">{formatWeekRange(data.startDate, data.endDate)}</Badge>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setWeekOffset(weekOffset + 1)}
            disabled={weekOffset >= 0}
          >
            Next Week
          </Button>
        </div>
        <Button variant="outline" size="sm" onClick={onExport}>
          <Download size={15} /> Export Weekly
        </Button>
      </div>

      <div className="grid grid-2" style={{ marginBottom: 20 }}>
        <Card padded>
          <h3 className="card-title mb-4">Weekly Attendance Overview</h3>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={data.days}>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" vertical={false} />
              <XAxis dataKey="day" tick={{ fill: 'var(--muted)', fontSize: 12 }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fill: 'var(--muted)', fontSize: 12 }} axisLine={false} tickLine={false} width={30} />
              <Tooltip
                cursor={{ fill: 'color-mix(in srgb, var(--primary) 6%, transparent)' }}
                contentStyle={{ borderRadius: 10, border: '1px solid var(--border)', background: 'var(--surface)' }}
              />
              <Legend wrapperStyle={{ fontSize: 13 }} />
              <Bar dataKey="present" name="Present" fill="var(--success)" radius={[4, 4, 0, 0]} maxBarSize={36} />
              <Bar dataKey="absent" name="Absent" fill="var(--danger)" radius={[4, 4, 0, 0]} maxBarSize={36} />
            </BarChart>
          </ResponsiveContainer>
        </Card>

        <Card padded>
          <h3 className="card-title mb-4">Attendance Percentage Trend</h3>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={data.days}>
              <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" vertical={false} />
              <XAxis dataKey="day" tick={{ fill: 'var(--muted)', fontSize: 12 }} axisLine={false} tickLine={false} />
              <YAxis domain={[0, 100]} tick={{ fill: 'var(--muted)', fontSize: 12 }} axisLine={false} tickLine={false} width={30} />
              <Tooltip
                contentStyle={{ borderRadius: 10, border: '1px solid var(--border)', background: 'var(--surface)' }}
                formatter={(v) => [`${v}%`, 'Attendance']}
              />
              <Line type="monotone" dataKey="percentage" stroke="var(--primary)" strokeWidth={2.5} dot={{ r: 5, fill: 'var(--primary)' }} activeDot={{ r: 7 }} />
            </LineChart>
          </ResponsiveContainer>
        </Card>
      </div>

      <Card>
        <div className="card-header">
          <h3>Daily Breakdown</h3>
        </div>
        <div className="table-wrap">
          <table className="table">
            <thead>
              <tr>
                <th>Day</th>
                <th>Date</th>
                <th>Present</th>
                <th>Absent</th>
                <th>Total</th>
                <th>Attendance %</th>
              </tr>
            </thead>
            <tbody>
              {data.days.map((d) => (
                <tr key={d.date}>
                  <td className="cell-main">{d.day}</td>
                  <td className="muted">{formatDate(d.date)}</td>
                  <td><Badge variant="success">{d.present}</Badge></td>
                  <td><Badge variant="danger">{d.absent}</Badge></td>
                  <td>{d.total}</td>
                  <td>
                    <Badge variant={d.percentage >= 80 ? 'success' : d.percentage >= 60 ? 'warning' : 'danger'}>
                      {d.percentage}%
                    </Badge>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>
    </>
  )
}

function StudentWiseView({
  loading, summaries, allSummaries, search, setSearch,
  filter, setFilter, sort, setSort, avgPct, onExport,
}) {
  const excellentCount = allSummaries.filter((s) => s.percentage >= 90).length
  const goodCount = allSummaries.filter((s) => s.percentage >= 75 && s.percentage < 90).length
  const lowCountTotal = allSummaries.filter((s) => s.percentage >= 60 && s.percentage < 75).length
  const criticalCount = allSummaries.filter((s) => s.percentage < 60).length

  return (
    <>
      <div className="grid grid-4" style={{ marginBottom: 20 }}>
        <StatCard label="Total Students" value={allSummaries.length} icon={Users} variant="primary" index={0} />
        <StatCard label="Average %" value={`${avgPct}%`} icon={FileSpreadsheet} variant="accent" index={1} />
        <StatCard label="Low Attendance" value={lowCountTotal + criticalCount} icon={XCircle} variant="warning" index={2} />
        <StatCard label="Excellent (90%+)" value={excellentCount} icon={CheckCircle2} variant="success" index={3} />
      </div>

      <Card>
        <div className="card-header" style={{ flexWrap: 'wrap' }}>
          <div className="flex items-center" style={{ gap: 10, flexWrap: 'wrap' }}>
            <h3>Student-wise Attendance</h3>
            <Badge variant="muted">{summaries.length} students</Badge>
          </div>
          <div className="flex" style={{ gap: 8, flexWrap: 'wrap', alignItems: 'center' }}>
            <SearchBar value={search} onChange={setSearch} placeholder="Search students..." />
            <Button variant="outline" size="sm" onClick={onExport}>
              <Download size={15} /> Export
            </Button>
          </div>
        </div>

        <div className="attendance-toolbar">
          <div className="flex items-center" style={{ gap: 6, flexWrap: 'wrap' }}>
            <Filter size={14} className="muted" />
            {[
              { key: 'all', label: 'All', count: allSummaries.length },
              { key: 'excellent', label: 'Excellent', count: excellentCount },
              { key: 'good', label: 'Good', count: goodCount },
              { key: 'low', label: 'Low', count: lowCountTotal },
              { key: 'critical', label: 'Critical', count: criticalCount },
            ].map((f) => (
              <button
                key={f.key}
                type="button"
                className={cn('page-btn', filter === f.key && 'active')}
                onClick={() => setFilter(f.key)}
                style={{ fontSize: 12, padding: '4px 10px', height: 'auto' }}
              >
                {f.label} ({f.count})
              </button>
            ))}
          </div>
          <div className="flex items-center" style={{ gap: 6 }}>
            <span className="muted" style={{ fontSize: 12 }}>Sort:</span>
            <Select value={sort} onChange={(e) => setSort(e.target.value)}>
              <option value="rollNumber">Roll Number</option>
              <option value="name">Name</option>
              <option value="percentage">Attendance %</option>
              <option value="present">Present Days</option>
              <option value="absent">Absent Days</option>
            </Select>
          </div>
        </div>

        {loading ? (
          <div style={{ padding: 22 }}><SkeletonBlock rows={8} height={18} /></div>
        ) : summaries.length === 0 ? (
          <EmptyState title="No students found" description={search ? `No students match "${search}"` : 'No data available'} />
        ) : (
          <div className="table-wrap">
            <table className="table">
              <thead>
                <tr>
                  <th>Roll No.</th>
                  <th>Student Name</th>
                  <th style={{ textAlign: 'center' }}>Present</th>
                  <th style={{ textAlign: 'center' }}>Absent</th>
                  <th style={{ textAlign: 'center' }}>Total Days</th>
                  <th style={{ textAlign: 'center' }}>Attendance %</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {summaries.map((s) => (
                  <tr key={s.id} className={cn(s.percentage < 60 && 'row-low-attendance')}>
                    <td className="muted" style={{ fontFamily: 'monospace', fontSize: 13 }}>{s.rollNumber}</td>
                    <td className="cell-main">{s.name}</td>
                    <td style={{ textAlign: 'center' }}>{s.present}</td>
                    <td style={{ textAlign: 'center' }}>{s.absent}</td>
                    <td style={{ textAlign: 'center' }}>{s.total}</td>
                    <td style={{ textAlign: 'center' }}>
                      <Badge variant={s.percentage >= 90 ? 'success' : s.percentage >= 75 ? 'primary' : s.percentage >= 60 ? 'warning' : 'danger'}>
                        {s.percentage}%
                      </Badge>
                    </td>
                    <td>
                      {s.percentage >= 90 && <Badge variant="success" dot>Excellent</Badge>}
                      {s.percentage >= 75 && s.percentage < 90 && <Badge variant="primary" dot>Good</Badge>}
                      {s.percentage >= 60 && s.percentage < 75 && <Badge variant="warning" dot>Low</Badge>}
                      {s.percentage < 60 && <Badge variant="danger" dot>Critical</Badge>}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>
    </>
  )
}

function HistoryView({ loading, data, total, page, setPage, filters, setFilters, classes, divisions }) {
  return (
    <Card>
      <div className="card-header" style={{ flexWrap: 'wrap' }}>
        <div className="flex items-center" style={{ gap: 10 }}>
          <h3>Attendance History</h3>
          <Badge variant="muted">{total} records</Badge>
        </div>
      </div>

      <div className="attendance-toolbar">
        <div className="flex" style={{ gap: 10, flexWrap: 'wrap', alignItems: 'flex-end' }}>
          <div style={{ minWidth: 130 }}>
            <Select
              label="Class"
              value={filters.classId}
              onChange={(e) => { setFilters({ ...filters, classId: e.target.value }); setPage(1) }}
            >
              <option value="">All Classes</option>
              {classes.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
            </Select>
          </div>
          <div style={{ minWidth: 130 }}>
            <Select
              label="Division"
              value={filters.division}
              onChange={(e) => { setFilters({ ...filters, division: e.target.value }); setPage(1) }}
            >
              <option value="">All Divisions</option>
              {divisions.map((d) => <option key={d.id} value={d.id}>{d.name}</option>)}
            </Select>
          </div>
          <div style={{ minWidth: 150 }}>
            <label className="form-label">From</label>
            <input
              type="date"
              className="form-control"
              value={filters.dateFrom}
              onChange={(e) => { setFilters({ ...filters, dateFrom: e.target.value }); setPage(1) }}
            />
          </div>
          <div style={{ minWidth: 150 }}>
            <label className="form-label">To</label>
            <input
              type="date"
              className="form-control"
              value={filters.dateTo}
              onChange={(e) => { setFilters({ ...filters, dateTo: e.target.value }); setPage(1) }}
            />
          </div>
        </div>
      </div>

      {loading ? (
        <div style={{ padding: 22 }}><SkeletonBlock rows={6} height={18} /></div>
      ) : data.length === 0 ? (
        <EmptyState title="No attendance records found" description="Adjust filters to see results." />
      ) : (
        <div className="table-wrap">
          <table className="table">
            <thead>
              <tr>
                <th>Date</th>
                <th>Class</th>
                <th>Division</th>
                <th style={{ textAlign: 'center' }}>Total</th>
                <th style={{ textAlign: 'center' }}>Present</th>
                <th style={{ textAlign: 'center' }}>Absent</th>
                <th style={{ textAlign: 'center' }}>Attendance %</th>
                <th>Marked By</th>
              </tr>
            </thead>
            <tbody>
              {data.map((r) => (
                <tr key={r.id}>
                  <td className="cell-main">{formatDate(r.date, { weekday: 'short', day: '2-digit', month: 'short', year: 'numeric' })}</td>
                  <td>{r.className}</td>
                  <td><Badge variant="accent">{r.division}</Badge></td>
                  <td style={{ textAlign: 'center' }}>{r.totalStudents}</td>
                  <td style={{ textAlign: 'center' }}><Badge variant="success">{r.presentCount}</Badge></td>
                  <td style={{ textAlign: 'center' }}><Badge variant="danger">{r.absentCount}</Badge></td>
                  <td style={{ textAlign: 'center' }}>
                    <Badge variant={r.attendancePercentage >= 80 ? 'success' : r.attendancePercentage >= 60 ? 'warning' : 'danger'}>
                      {r.attendancePercentage}%
                    </Badge>
                  </td>
                  <td className="muted">{r.markedBy}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {total > 10 && (
        <div className="pagination" style={{ padding: '14px 22px' }}>
          <span className="muted" style={{ fontSize: 13 }}>
            Page {page} of {Math.ceil(total / 10)}
          </span>
          <div className="page-btns">
            <button className="page-btn" disabled={page <= 1} onClick={() => setPage(page - 1)}>Prev</button>
            <button className="page-btn" disabled={page >= Math.ceil(total / 10)} onClick={() => setPage(page + 1)}>Next</button>
          </div>
        </div>
      )}
    </Card>
  )
}
