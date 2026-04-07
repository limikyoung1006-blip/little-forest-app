import React, { useState, useEffect } from 'react';
import * as XLSX from 'xlsx';
import { supabase } from './supabaseClient';
import {
  CreditCard, History, User,
  Users, BookOpen, LogOut, CheckCircle2, XCircle, Trash2,
  DollarSign, Edit3, Clock, Eye, EyeOff, BarChart3, TrendingUp, ShieldCheck
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { QRCodeSVG } from 'qrcode.react';
import './index.css';
import logo from './logo.png';

// --- Types ---
type Role = 'SUPER_ADMIN' | 'ADMIN' | 'INSTRUCTOR' | 'STUDENT';

interface BaseUser {
  id: string;
  name: string;
  birthdate: string; // e.g. '800101'
  password: string;
  role: Role;
}

type DiscountType = 'NONE' | 'ACQUAINTANCE' | 'SINGLE_MOTHER' | 'MULTICULTURAL';
const DISCOUNT_LABELS: { [key in DiscountType]: string } = {
  NONE: '일반 / NONE',
  ACQUAINTANCE: '지인 / ACQUAINTANCE',
  SINGLE_MOTHER: '미혼모 / SINGLE MOTHER',
  MULTICULTURAL: '다문화 / MULTICULTURAL'
};

interface Student extends BaseUser {
  balance: number;
  enrolledCourses: string[]; // Course IDs
  coursePayments: { [courseId: string]: { amount: number; isFullyPaid: boolean } };
  paidStatus: boolean; // Overall status (deprecated but kept for compatibility)
  attendance: { [date: string]: boolean };
  discountType?: DiscountType;
  discountedCourseId?: string;
  studentNo?: string; // 번호
  phone?: string;     // 연락처
}

interface Instructor extends BaseUser {
  assignedCourses: string[]; // Course IDs
}

interface Course {
  id: string;
  title: string;
  instructorId: string;
  studentIds: string[];
  time: string; // e.g. '14:00 - 16:00'
  fee: number;
}

// --- Mock Initial Data ---
const INITIAL_SUPER_ADMIN: BaseUser = { id: 'SA1', name: '백동희', birthdate: '790528', password: '0000', role: 'SUPER_ADMIN' };

const INITIAL_GENERAL_ADMINS: BaseUser[] = [];

const INITIAL_STUDENTS: Student[] = [
  { id: 'S1', name: '이혜원', birthdate: '920512', password: '111', role: 'STUDENT', balance: 1250000, enrolledCourses: ['C1', 'C2', 'C4'], coursePayments: { 'C1': { amount: 350000, isFullyPaid: true }, 'C2': { amount: 200000, isFullyPaid: false }, 'C4': { amount: 700000, isFullyPaid: true } }, paidStatus: true, attendance: {} },
  { id: 'S2', name: '박지민', birthdate: '950815', password: '222', role: 'STUDENT', balance: 450000, enrolledCourses: ['C1'], coursePayments: { 'C1': { amount: 350000, isFullyPaid: true } }, paidStatus: true, attendance: {} },
  { id: 'S3', name: '최강수', birthdate: '880320', password: '333', role: 'STUDENT', balance: 50000, enrolledCourses: ['C3', 'C4'], coursePayments: { 'C3': { amount: 0, isFullyPaid: false }, 'C4': { amount: 100000, isFullyPaid: false } }, paidStatus: false, attendance: {} },
];

const INITIAL_INSTRUCTORS: Instructor[] = [
  { id: 'I1', name: '장영실 강사', birthdate: '750101', password: 'pro1', role: 'INSTRUCTOR', assignedCourses: ['C1', 'C4'] },
  { id: 'I2', name: '소미 강사', birthdate: '800202', password: 'pro2', role: 'INSTRUCTOR', assignedCourses: ['C2', 'C3'] },
];

const INITIAL_COURSES: Course[] = [
  { id: 'C1', title: '명품 와인 테이스팅', instructorId: 'I1', studentIds: ['S1', 'S2'], time: '월 14:00 - 16:00', fee: 350000 },
  { id: 'C2', title: '프리미엄 세라믹 클래스', instructorId: 'I2', studentIds: ['S1'], time: '화 10:00 - 12:00', fee: 400000 },
  { id: 'C3', title: '오가닉 쿠킹 스튜디오', instructorId: 'I2', studentIds: ['S3'], time: '목 15:00 - 17:00', fee: 250000 },
  { id: 'C4', title: '로열 골프 매니지먼트', instructorId: 'I1', studentIds: ['S1', 'S3'], time: '토 09:00 - 11:00', fee: 700000 },
];

// --- Sub-Components ---

const Header: React.FC = () => (
  <header style={{ 
    display: 'flex', 
    flexDirection: 'row', 
    alignItems: 'center', 
    justifyContent: 'center', 
    padding: '30px 24px', 
    gap: '20px',
    background: 'linear-gradient(180deg, rgba(191,149,63,0.1) 0%, transparent 100%)',
    borderRadius: '0 0 32px 32px',
    marginBottom: '20px',
    borderBottom: '1px solid rgba(191,149,63,0.05)'
  }}>
    <div style={{ 
      width: '80px', 
      height: '80px', 
      borderRadius: '20px', 
      overflow: 'hidden',
      boxShadow: '0 10px 20px rgba(0,0,0,0.3)',
      border: '2px solid var(--accent-gold)',
      backgroundColor: 'var(--secondary-black)',
      flexShrink: 0
    }}>
      <img 
        src={logo} 
        alt="Little Forest Logo" 
        style={{ width: '100%', height: '100%', objectFit: 'cover' }}
        onError={(e) => {
          // Fallback if image not found
          (e.target as HTMLImageElement).src = 'https://img.icons8.com/color/144/evergreen-tree.png';
        }}
      />
    </div>
    <div style={{ textAlign: 'left', display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
      <h1 style={{ 
        fontSize: '1.4rem', 
        fontWeight: 900, 
        letterSpacing: '1px', 
        color: 'white',
        lineHeight: '1.2',
        margin: 0
      }}>
        LITTLE FOREST CULTURE CENTER
      </h1>
      <p style={{ 
        fontSize: '1.1rem', 
        fontWeight: 600, 
        color: 'var(--accent-gold)', 
        marginTop: '2px',
        letterSpacing: '1px',
        margin: 0
      }}>
        리틀포레스트 문화센터
      </p>
    </div>
  </header>
);

// 0. LOGIN VIEW
interface LoginViewProps {
  loginForm: { name: string; birthdate: string; password: string };
  setLoginForm: React.Dispatch<React.SetStateAction<{ name: string; birthdate: string; password: string }>>;
  handleLogin: (e: React.FormEvent) => void;
  showPassword: boolean;
  setShowPassword: React.Dispatch<React.SetStateAction<boolean>>;
}
const LoginView: React.FC<LoginViewProps> = ({ loginForm, setLoginForm, handleLogin, showPassword, setShowPassword }) => (
  <div style={{ display: 'flex', flexDirection: 'column', minHeight: '100vh', padding: '0 0 40px 0' }}>
    <Header />
    <div style={{ padding: '0 24px' }}>
      <form onSubmit={handleLogin} style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
        <input
          className="premium-input"
          placeholder="성함 (NAME)"
          value={loginForm.name}
          onChange={e => setLoginForm({ ...loginForm, name: e.target.value })}
          style={{ padding: '16px', borderRadius: '12px', background: 'var(--secondary-black)', color: 'white', border: '1px solid var(--glass-border)' }}
        />
        <input
          className="premium-input"
          placeholder="생년월일 (BIRTHDATE) 예: 800101"
          value={loginForm.birthdate}
          maxLength={6}
          onChange={e => setLoginForm({ ...loginForm, birthdate: e.target.value })}
          style={{ padding: '16px', borderRadius: '12px', background: 'var(--secondary-black)', color: 'white', border: '1px solid var(--glass-border)' }}
        />
        <div style={{ position: 'relative' }}>
          <input
            type={showPassword ? 'text' : 'password'}
            className="premium-input"
            placeholder="비밀번호 (PASSWORD)"
            value={loginForm.password}
            onChange={e => setLoginForm({ ...loginForm, password: e.target.value })}
            style={{ width: '100%', padding: '16px', borderRadius: '12px', background: 'var(--secondary-black)', color: 'white', border: '1px solid var(--glass-border)' }}
          />
          <button type="button" onClick={() => setShowPassword(!showPassword)} style={{ position: 'absolute', right: '16px', top: '16px', background: 'none', border: 'none' }}>
            {showPassword ? <EyeOff size={20} color="var(--text-grey)" /> : <Eye size={20} color="var(--text-grey)" />}
          </button>
        </div>
        <button type="submit" style={{ padding: '18px', backgroundColor: 'var(--accent-gold)', borderRadius: '12px', fontWeight: 900, fontSize: '1.1rem', marginTop: '10px', color: 'black' }}>
          로그인 / LOG IN
        </button>
      </form>
    </div>
  </div>
);

// 1. ADMIN VIEW
interface AdminViewProps {
  currentUser: BaseUser;
  activeTab: string;
  setActiveTab: React.Dispatch<React.SetStateAction<string>>;
  students: Student[];
  instructors: Instructor[];
  generalAdmins: BaseUser[];
  courses: Course[];
  selectedDate: string;
  setEditUser: (user: any) => void;
  editUser: any;
  updateUserInfo: (id: string, newName: string, newBd: string, newPw: string, newPhone?: string) => void;
  onShowStats: () => void;
  onAddGeneralAdmin: (name: string, bd: string, pw: string) => void;
  onDeleteAdmin: (id: string) => void;
  onAddInstructor: (name: string, bd: string, pw: string) => void;
  onDeleteInstructor: (id: string) => void;
  onAddStudent: (name: string, studentNo: string, phone: string, pw: string, courseId?: string, discountType?: DiscountType) => void;
  onDeleteStudent: (id: string) => void;
  onAddCourse: (title: string, time: string, instructorId: string, fee: number) => void;
  onDeleteCourse: (id: string) => void;
  onBulkAddStudents: (data: string) => void;
  onUpdatePayment: (sid: string, cid: string, amount: number, isFull: boolean) => void;
  onUpdateCourseFee: (id: string, fee: number) => void;
  onToggleAttendance: (sid: string) => void;
  onBulkDeleteStudents: (ids: string[]) => void;
  onBulkDeleteInstructors: (ids: string[]) => void;
  onBulkDeleteCourses: (ids: string[]) => void;
  onDownloadAttendance: () => void;
  onDownloadFinance: () => void;
  onUpdateDiscount: (sid: string, cid: string, type: DiscountType) => void;
  onDownloadStudentTemplate: () => void;
  discountRate: number;
  onUpdateDiscountRate: (rate: number) => void;
  onBulkRegisterToCourse: (sids: string[], cid: string) => void;
}

const AdminView: React.FC<AdminViewProps> = ({
  currentUser, activeTab, setActiveTab, students, instructors, generalAdmins, courses, selectedDate,
  setEditUser, editUser, updateUserInfo, onShowStats, onAddGeneralAdmin, onDeleteAdmin,
  onAddInstructor, onDeleteInstructor, onAddStudent, onDeleteStudent, onAddCourse, onDeleteCourse,
  onBulkAddStudents, onUpdatePayment, onUpdateCourseFee, onToggleAttendance,
  onBulkDeleteStudents, onBulkDeleteInstructors, onBulkDeleteCourses,
  onDownloadAttendance, onDownloadFinance, onUpdateDiscount, onDownloadStudentTemplate,
  discountRate, onUpdateDiscountRate, onBulkRegisterToCourse
}) => {
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  useEffect(() => {
    setSelectedIds([]);
  }, [activeTab]);
  const isSuper = currentUser.role === 'SUPER_ADMIN';
  const isAdmin = currentUser.role === 'ADMIN' || isSuper;

  const tabs = ['STUDENTS', 'INSTRUCTORS', 'COURSES', 'REPORT', 'ATTENDANCE', 'FINANCE'];
  if (isSuper) tabs.push('ADMINS');

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px', paddingBottom: '100px' }}>
      <Header />
      <div style={{ display: 'flex', gap: '12px', overflowX: 'auto', padding: '0 24px 10px 24px' }}>
        {tabs.map(tab => (
          <button key={tab} onClick={() => setActiveTab(tab)}
            style={{
              padding: '12px 20px', borderRadius: '12px', backgroundColor: activeTab === tab ? 'var(--accent-gold)' : 'var(--secondary-black)',
              color: activeTab === tab ? 'black' : 'var(--text-grey)', fontWeight: 800, fontSize: '0.75rem', whiteSpace: 'nowrap'
            }}>
            {tab === 'STUDENTS' ? '수강생 / STU' : tab === 'INSTRUCTORS' ? '강사 / INST' : tab === 'COURSES' ? '강좌 / CRS' : tab === 'REPORT' ? '통합 현황 / RPT' : tab === 'ATTENDANCE' ? '출석 / ATT' : tab === 'FINANCE' ? '납부 / FIN' : '관리자 / ADM'}
          </button>
        ))}
      </div>

      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div style={{ display: 'flex', flexDirection: 'column' }}>
          <h3 style={{ textTransform: 'capitalize' }}>
            {activeTab === 'STUDENTS' ? '수강생 관리 / STUDENT MGMT' :
              activeTab === 'INSTRUCTORS' ? '강사 관리 / INSTRUCTOR MGMT' :
                activeTab === 'COURSES' ? '강좌 관리 / COURSE MGMT' :
                  activeTab === 'REPORT' ? '통합 수강 현황 / TOTAL OVERVIEW' :
                    activeTab === 'ATTENDANCE' ? '출석 모니터링 / ATTENDANCE' :
                      activeTab === 'ADMINS' ? '관리자 임명 / ADMIN MGMT' :
                        '금융 관리 / FINANCE'}
          </h3>
          <p style={{ fontSize: '0.7rem', color: 'var(--accent-gold)', fontWeight: 800, marginTop: '4px' }}>
            {isSuper ? '🛡️ 슈퍼관리자 권한 (SUPER ADMIN)' : '🔑 일반관리자 권한 (ADMIN)'}
          </p>
        </div>
        {activeTab === 'REPORT' && (
          <button onClick={onShowStats} style={{ background: 'var(--accent-gold)', color: 'black', padding: '8px 16px', borderRadius: '8px', display: 'flex', alignItems: 'center', gap: '8px', fontWeight: 800, fontSize: '0.75rem' }}>
            <TrendingUp size={16} /> 월간 통계 / STATS
          </button>
        )}
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
        {activeTab === 'ADMINS' && isSuper && (
          <div style={{ marginBottom: '20px' }}>
            <div className="premium-card" style={{ padding: '24px', marginBottom: '24px' }}>
              <h4 style={{ marginBottom: '16px', color: 'var(--accent-gold)' }}>새 관리자 등록 / REGISTER ADMIN</h4>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                <input id="adm-name" placeholder="이름 (NAME)" style={{ padding: '12px', borderRadius: '8px', background: 'var(--primary-black)', color: 'white', border: '1px solid var(--accent-gold)' }} />
                <input id="adm-bd" placeholder="생년월일 (BD)" style={{ padding: '12px', borderRadius: '8px', background: 'var(--primary-black)', color: 'white', border: '1px solid var(--accent-gold)' }} />
                <input id="adm-pw" placeholder="비밀번호 (PW)" style={{ padding: '12px', borderRadius: '8px', background: 'var(--primary-black)', color: 'white', border: '1px solid var(--accent-gold)' }} />
                <button onClick={() => {
                  const n = (document.getElementById('adm-name') as HTMLInputElement).value;
                  const bd = (document.getElementById('adm-bd') as HTMLInputElement).value;
                  const pw = (document.getElementById('adm-pw') as HTMLInputElement).value;
                  if (n && bd && pw) onAddGeneralAdmin(n, bd, pw);
                }} style={{ padding: '12px', background: 'var(--accent-gold)', fontWeight: 800, borderRadius: '8px', color: 'black' }}>임명하기 / APPOINT</button>
              </div>
            </div>

            <div className="grid-list">
              {generalAdmins.map((adm: BaseUser) => (
                <div key={adm.id} className="premium-card" style={{ padding: '20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div>
                    <p style={{ fontWeight: 800, color: 'var(--accent-gold)' }}>{adm.name} 관리자 <span style={{ fontSize: '0.7rem', opacity: 0.5 }}>{adm.birthdate}</span></p>
                    <p style={{ fontSize: '0.75rem', color: 'var(--text-grey)' }}>ID: {adm.id} | PW: {adm.password}</p>
                  </div>
                  <button onClick={() => onDeleteAdmin(adm.id)} style={{ background: 'none', border: 'none' }}><Trash2 size={18} color="#FF4B4B" /></button>
                </div>
              ))}
            </div>
          </div>
        )}

        {activeTab === 'STUDENTS' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
            <div className="premium-card" style={{ padding: '24px' }}>
              <h4 style={{ marginBottom: '16px', color: 'var(--accent-gold)' }}>새 수강생 등록 / REGISTER STUDENT</h4>
              <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
                <input id="stu-no" placeholder="번호 (NUMBER)" style={{ flex: 1, minWidth: '120px', padding: '12px', borderRadius: '8px', background: 'var(--primary-black)', color: 'white', border: '1px solid var(--accent-gold)' }} />
                <input id="stu-name" placeholder="이름(보호자) (NAME)" style={{ flex: 1, minWidth: '120px', padding: '12px', borderRadius: '8px', background: 'var(--primary-black)', color: 'white', border: '1px solid var(--accent-gold)' }} />
                <input id="stu-phone" placeholder="연락처 (PHONE)" style={{ flex: 1, minWidth: '120px', padding: '12px', borderRadius: '8px', background: 'var(--primary-black)', color: 'white', border: '1px solid var(--accent-gold)' }} />
                <select id="stu-course" style={{ flex: 1, minWidth: '120px', padding: '12px', borderRadius: '8px', background: 'var(--primary-black)', color: 'white', border: '1px solid var(--accent-gold)' }}>
                  <option value="">수강 강좌 선택 / COURSE</option>
                  {courses.map((c: Course) => <option key={c.id} value={c.id}>{c.title}</option>)}
                </select>
                <select id="stu-discount" style={{ flex: 1, minWidth: '120px', padding: '12px', borderRadius: '8px', background: 'var(--primary-black)', color: 'white', border: '1px solid var(--accent-gold)' }}>
                  <option value="NONE">할인 대상 가정 선택 / DISCOUNT</option>
                  {Object.entries(DISCOUNT_LABELS).map(([val, label]) => <option key={val} value={val}>{label}</option>)}
                </select>
                <input id="stu-pw" placeholder="비밀번호 (PW)" style={{ flex: 1, minWidth: '120px', padding: '12px', borderRadius: '8px', background: 'var(--primary-black)', color: 'white', border: '1px solid var(--accent-gold)' }} />
                <button onClick={() => {
                  const no = (document.getElementById('stu-no') as HTMLInputElement).value;
                  const n = (document.getElementById('stu-name') as HTMLInputElement).value;
                  const ph = (document.getElementById('stu-phone') as HTMLInputElement).value;
                  const pw = (document.getElementById('stu-pw') as HTMLInputElement).value;
                  const cid = (document.getElementById('stu-course') as HTMLSelectElement).value;
                  const disc = (document.getElementById('stu-discount') as HTMLSelectElement).value as DiscountType;
                  if (n && no && pw) onAddStudent(n, no, ph, pw, cid, disc);
                }} style={{ padding: '12px 24px', background: 'var(--accent-gold)', fontWeight: 800, borderRadius: '8px', color: 'black' }}>등록 / ADD</button>
              </div>
            </div>

            <div className="premium-card" style={{ padding: '24px' }}>
              <h4 style={{ marginBottom: '16px', color: 'var(--accent-gold)' }}>일괄 수강생 등록 (엑셀/CSV 파일) / BULK REGISTER</h4>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'var(--primary-black)', padding: '16px', borderRadius: '12px', border: '1px solid rgba(212,175,55,0.2)' }}>
                  <div>
                    <p style={{ fontSize: '0.9rem', fontWeight: 700 }}>1. 양식 파일 다운로드</p>
                    <p style={{ fontSize: '0.7rem', color: 'var(--text-grey)' }}>정해진 규격에 맞춰 데이터를 입력해 주세요.</p>
                  </div>
                  <button onClick={onDownloadStudentTemplate} style={{ padding: '8px 16px', background: 'transparent', border: '1px solid var(--accent-gold)', color: 'var(--accent-gold)', borderRadius: '8px', fontSize: '0.75rem', fontWeight: 800 }}>
                    📥 양식 받기 / TEMPLATE
                  </button>
                </div>
                
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'var(--primary-black)', padding: '16px', borderRadius: '12px', border: '1px solid rgba(212,175,55,0.2)' }}>
                  <div>
                    <p style={{ fontSize: '0.9rem', fontWeight: 700 }}>2. 엑셀 파일 업로드</p>
                    <p style={{ fontSize: '0.7rem', color: 'var(--text-grey)' }}>편집한 엑셀(.xlsx) 파일을 선택하여 등록합니다.</p>
                  </div>
                  <label style={{ padding: '8px 16px', background: 'var(--accent-gold)', color: 'black', borderRadius: '8px', fontSize: '0.75rem', fontWeight: 800, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '4px' }}>
                    파일 선택 / UPLOAD
                    <input 
                      type="file" 
                      accept=".xlsx, .xls, .csv" 
                      style={{ display: 'none' }} 
                      onChange={(e) => {
                        const file = e.target.files?.[0];
                        if (file) {
                          const reader = new FileReader();
                          reader.onload = (evt) => {
                            const data = evt.target?.result;
                            const workbook = XLSX.read(data, { type: 'binary' });
                            const sheetName = workbook.SheetNames[0];
                            const sheet = workbook.Sheets[sheetName];
                            const csvText = XLSX.utils.sheet_to_csv(sheet);
                            if (csvText) onBulkAddStudents(csvText);
                          };
                          reader.readAsBinaryString(file);
                        }
                        e.target.value = '';
                      }} 
                    />
                  </label>
                </div>
              </div>
            </div>

            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', margin: '12px 0', padding: '0 8px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <input 
                  type="checkbox" 
                  checked={students.length > 0 && selectedIds.length === students.length}
                  onChange={(e) => {
                    if (e.target.checked) setSelectedIds(students.map(s => s.id));
                    else setSelectedIds([]);
                  }}
                  style={{ width: '18px', height: '18px', accentColor: 'var(--accent-gold)' }}
                />
                <span style={{ fontSize: '0.8rem', fontWeight: 800 }}>전체 선택 / SELECT ALL</span>
                <span style={{ fontSize: '0.8rem', opacity: 0.6 }}>| {students.length}명 중 {selectedIds.length}명 선택</span>
              </div>
              {selectedIds.length > 0 && (
                <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                  <select 
                    id="bulk-crs-reg" 
                    style={{ padding: '8px', borderRadius: '8px', background: 'var(--secondary-black)', color: 'white', border: '1px solid var(--accent-gold)', fontSize: '0.75rem' }}
                  >
                    <option value="">강좌 선택 / SELECT COURSE</option>
                    {courses.map(c => <option key={c.id} value={c.id}>{c.title}</option>)}
                  </select>
                  <button
                    onClick={() => {
                      const cid = (document.getElementById('bulk-crs-reg') as HTMLSelectElement).value;
                      if (!cid) { alert('강좌를 선택해주세요.'); return; }
                      onBulkRegisterToCourse(selectedIds, cid);
                      setSelectedIds([]);
                    }}
                    style={{ background: 'var(--accent-gold)', color: 'black', padding: '8px 16px', borderRadius: '8px', fontWeight: 800, fontSize: '0.75rem', border: 'none' }}
                  >
                    강좌 등록 / REGISTER
                  </button>
                  <button
                    onClick={() => {
                      if (window.confirm(`${selectedIds.length}명의 수강생을 삭제하시겠습니까?`)) {
                        onBulkDeleteStudents(selectedIds);
                        setSelectedIds([]);
                      }
                    }}
                    style={{ background: '#FF4B4B', color: 'white', padding: '8px 16px', borderRadius: '8px', fontWeight: 800, fontSize: '0.75rem', border: 'none' }}
                  >
                    선택 삭제
                  </button>
                </div>
              )}
            </div>

            <div className="grid-list">
              {students.map((s: Student) => (
                <div key={s.id} className="premium-card" style={{ padding: '20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                    <input
                      type="checkbox"
                      checked={selectedIds.includes(s.id)}
                      onChange={(e) => {
                        if (e.target.checked) setSelectedIds([...selectedIds, s.id]);
                        else setSelectedIds(selectedIds.filter(id => id !== s.id));
                      }}
                      style={{ width: '18px', height: '18px', accentColor: 'var(--accent-gold)' }}
                    />
                    <div>
                      <p style={{ fontWeight: 800, color: 'var(--accent-gold)' }}>{s.name} <span style={{ fontSize: '0.7rem', opacity: 0.5, marginLeft: '4px' }}>#{s.studentNo || s.id}</span></p>
                      <p style={{ fontSize: '0.75rem', color: 'var(--text-grey)', marginTop: '4px' }}>
                        PW: {s.password} | PH: {s.phone || 'N/A'} | BAL: ₩{s.balance.toLocaleString()}
                      </p>
                    </div>
                  </div>
                  <div style={{ display: 'flex', gap: '12px' }}>
                    <button onClick={() => setEditUser(s)} style={{ background: 'none', border: 'none' }}><Edit3 size={18} color="var(--accent-gold)" /></button>
                    <button onClick={() => onDeleteStudent(s.id)} style={{ background: 'none', border: 'none' }}><Trash2 size={18} color="#FF4B4B" /></button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {activeTab === 'INSTRUCTORS' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
            <div className="premium-card" style={{ padding: '24px' }}>
              <h4 style={{ marginBottom: '16px', color: 'var(--accent-gold)' }}>새 강사 등록 / REGISTER INSTRUCTOR</h4>
              <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
                <input id="inst-name" placeholder="이름 (NAME)" style={{ flex: 1, minWidth: '120px', padding: '12px', borderRadius: '8px', background: 'var(--primary-black)', color: 'white', border: '1px solid var(--accent-gold)' }} />
                <input id="inst-bd" placeholder="생년월일 (BD)" style={{ flex: 1, minWidth: '120px', padding: '12px', borderRadius: '8px', background: 'var(--primary-black)', color: 'white', border: '1px solid var(--accent-gold)' }} />
                <input id="inst-pw" placeholder="비밀번호 (PW)" style={{ flex: 1, minWidth: '120px', padding: '12px', borderRadius: '8px', background: 'var(--primary-black)', color: 'white', border: '1px solid var(--accent-gold)' }} />
                <button onClick={() => {
                  const n = (document.getElementById('inst-name') as HTMLInputElement).value;
                  const bd = (document.getElementById('inst-bd') as HTMLInputElement).value;
                  const pw = (document.getElementById('inst-pw') as HTMLInputElement).value;
                  if (n && bd && pw) onAddInstructor(n, bd, pw);
                }} style={{ padding: '12px 24px', background: 'var(--accent-gold)', fontWeight: 800, borderRadius: '8px', color: 'black' }}>등록 / ADD</button>
              </div>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', margin: '12px 0', padding: '0 8px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <input 
                  type="checkbox" 
                  checked={instructors.length > 0 && selectedIds.length === instructors.length}
                  onChange={(e) => {
                    if (e.target.checked) setSelectedIds(instructors.map(i => i.id));
                    else setSelectedIds([]);
                  }}
                  style={{ width: '18px', height: '18px', accentColor: 'var(--accent-gold)' }}
                />
                <span style={{ fontSize: '0.8rem', fontWeight: 800 }}>전체 선택 / SELECT ALL</span>
                <span style={{ fontSize: '0.8rem', opacity: 0.6 }}>| {instructors.length}명 중 {selectedIds.length}명 선택</span>
              </div>
              {selectedIds.length > 0 && (
                <button
                  onClick={() => {
                    if (window.confirm(`${selectedIds.length}명의 강사를 삭제하시겠습니까?`)) {
                      onBulkDeleteInstructors(selectedIds);
                      setSelectedIds([]);
                    }
                  }}
                  style={{ background: '#FF4B4B', color: 'white', padding: '8px 16px', borderRadius: '8px', fontWeight: 800, fontSize: '0.75rem', border: 'none' }}
                >
                  선택 강사 삭제 / DELETE SELECTED
                </button>
              )}
            </div>
            <div className="grid-list">
              {instructors.map((i: Instructor) => (
                <div key={i.id} className="premium-card" style={{ padding: '20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                    <input
                      type="checkbox"
                      checked={selectedIds.includes(i.id)}
                      onChange={(e) => {
                        if (e.target.checked) setSelectedIds([...selectedIds, i.id]);
                        else setSelectedIds(selectedIds.filter(id => id !== i.id));
                      }}
                      style={{ width: '18px', height: '18px', accentColor: 'var(--accent-gold)' }}
                    />
                    <div>
                      <p style={{ fontWeight: 800, color: 'var(--accent-gold)' }}>{i.name} 강사 <span style={{ fontSize: '0.7rem', opacity: 0.5, marginLeft: '4px' }}>{i.birthdate}</span></p>
                      <p style={{ fontSize: '0.75rem', color: 'var(--text-grey)', marginTop: '4px' }}>
                        PW: {i.password} | 강좌(COURSES): {i.assignedCourses.length}
                      </p>
                    </div>
                  </div>
                  <div style={{ display: 'flex', gap: '12px' }}>
                    <button onClick={() => setEditUser(i)} style={{ background: 'none', border: 'none' }}><Edit3 size={18} color="var(--accent-gold)" /></button>
                    <button onClick={() => onDeleteInstructor(i.id)} style={{ background: 'none', border: 'none' }}><Trash2 size={18} color="#FF4B4B" /></button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {activeTab === 'COURSES' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
            <div className="premium-card" style={{ padding: '24px' }}>
              <h4 style={{ marginBottom: '16px', color: 'var(--accent-gold)' }}>새 강좌 등록 및 배정 / REGISTER COURSE</h4>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                <input id="crs-title" placeholder="강좌명 (TITLE)" style={{ padding: '12px', borderRadius: '8px', background: 'var(--primary-black)', color: 'white', border: '1px solid var(--accent-gold)' }} />
                <input id="crs-time" placeholder="수업시간 (TIME) 예: 월 14:00-16:00" style={{ padding: '12px', borderRadius: '8px', background: 'var(--primary-black)', color: 'white', border: '1px solid var(--accent-gold)' }} />
                <select id="crs-inst" style={{ padding: '12px', borderRadius: '8px', background: 'var(--primary-black)', color: 'white', border: '1px solid var(--accent-gold)' }}>
                  <option value="">강사 선택 / SELECT INSTRUCTOR</option>
                  {instructors.map((i: Instructor) => <option key={i.id} value={i.id}>{i.name} 강사</option>)}
                </select>
                <input id="crs-fee" type="number" placeholder="수강료 (FEE) 예: 300000" style={{ padding: '12px', borderRadius: '8px', background: 'var(--primary-black)', color: 'white', border: '1px solid var(--accent-gold)' }} />
                <button onClick={() => {
                  const t = (document.getElementById('crs-title') as HTMLInputElement).value;
                  const tm = (document.getElementById('crs-time') as HTMLInputElement).value;
                  const instId = (document.getElementById('crs-inst') as HTMLSelectElement).value;
                  const f = parseInt((document.getElementById('crs-fee') as HTMLInputElement).value) || 0;
                  if (t && tm && instId) onAddCourse(t, tm, instId, f);
                }} style={{ padding: '12px', background: 'var(--accent-gold)', fontWeight: 800, borderRadius: '8px', color: 'black' }}>강좌 생성 및 배정 / CREATE & ASSIGN</button>
              </div>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', margin: '12px 0', padding: '0 8px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <input 
                  type="checkbox" 
                  checked={courses.length > 0 && selectedIds.length === courses.length}
                  onChange={(e) => {
                    if (e.target.checked) setSelectedIds(courses.map(c => c.id));
                    else setSelectedIds([]);
                  }}
                  style={{ width: '18px', height: '18px', accentColor: 'var(--accent-gold)' }}
                />
                <span style={{ fontSize: '0.8rem', fontWeight: 800 }}>전체 선택 / SELECT ALL</span>
                <span style={{ fontSize: '0.8rem', opacity: 0.6 }}>| {courses.length}개 중 {selectedIds.length}개 선택</span>
              </div>
              {selectedIds.length > 0 && (
                <button
                  onClick={() => {
                    if (window.confirm(`${selectedIds.length}개의 강좌를 삭제하시겠습니까?`)) {
                      onBulkDeleteCourses(selectedIds);
                      setSelectedIds([]);
                    }
                  }}
                  style={{ background: '#FF4B4B', color: 'white', padding: '8px 16px', borderRadius: '8px', fontWeight: 800, fontSize: '0.75rem', border: 'none' }}
                >
                  선택 강좌 삭제 / DELETE SELECTED
                </button>
              )}
            </div>
            <div className="grid-list">
              {courses.map((c: Course) => {
                const inst = instructors.find((i: Instructor) => i.id === c.instructorId);
                return (
                  <div key={c.id} className="premium-card" style={{ padding: '20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div style={{ flex: 1, display: 'flex', alignItems: 'center', gap: '16px' }}>
                      <input
                        type="checkbox"
                        checked={selectedIds.includes(c.id)}
                        onChange={(e) => {
                          if (e.target.checked) setSelectedIds([...selectedIds, c.id]);
                          else setSelectedIds(selectedIds.filter(id => id !== c.id));
                        }}
                        style={{ width: '18px', height: '18px', accentColor: 'var(--accent-gold)' }}
                      />
                      <div style={{ flex: 1 }}>
                        <p style={{ fontWeight: 800, color: 'var(--accent-gold)' }}>{c.title}</p>
                        <p style={{ fontSize: '0.75rem', color: 'var(--text-grey)', marginTop: '4px' }}>
                          강사: {inst?.name || '미지정'} | 시간: {c.time}
                        </p>
                      </div>
                    </div>
                    <div style={{ textAlign: 'right', display: 'flex', alignItems: 'center', gap: '16px' }}>
                      <div>
                        <p style={{ fontSize: '0.6rem', color: 'var(--text-grey)' }}>수강료</p>
                        <p style={{ color: 'var(--accent-gold)', fontWeight: 800, fontSize: '0.9rem' }}>
                          ₩{c.fee.toLocaleString()}
                        </p>
                        <input
                          type="number"
                          defaultValue={c.fee}
                          onBlur={(e) => onUpdateCourseFee(c.id, parseInt(e.target.value) || 0)}
                          style={{ width: '80px', padding: '2px', background: 'transparent', border: 'none', borderBottom: '1px solid #333', color: 'var(--text-grey)', fontSize: '0.7rem', textAlign: 'right' }}
                          placeholder="직접입력"
                        />
                      </div>
                      <button onClick={() => onDeleteCourse(c.id)} style={{ background: 'none', border: 'none' }}><Trash2 size={18} color="#FF4B4B" /></button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {activeTab === 'REPORT' && courses.map((c: Course) => {
          const inst = instructors.find((i: Instructor) => i.id === c.instructorId);
          return (
            <div key={c.id} style={{ marginBottom: '24px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', padding: '0 8px 12px 8px', borderBottom: '1px solid var(--accent-gold)' }}>
                <div>
                  <h4 style={{ color: 'var(--accent-gold)', fontSize: '1.2rem', marginBottom: '4px' }}>{c.title}</h4>
                  <p style={{ fontSize: '0.8rem', color: 'var(--text-grey)' }}>담당 강사: {inst?.name} 강사 ({c.time})</p>
                </div>
                <p style={{ fontSize: '0.75rem', opacity: 0.6 }}>정원: {c.studentIds.length}명</p>
              </div>
              <div className="grid-list">
                {c.studentIds.map((sid: string) => {
                  const s = students.find((student: Student) => student.id === sid);
                  if (!s) return null;
                  const attended = s.attendance[selectedDate];
                  return (
                    <div key={sid} className="premium-card" style={{ padding: '14px 20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <span style={{ fontWeight: 700 }}>{s.name}</span>
                      <div style={{ display: 'flex', gap: '16px', fontSize: '0.75rem' }}>
                        <button
                          onClick={() => onToggleAttendance(sid)}
                          style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 0 }}
                        >
                          <span style={{ color: attended ? 'var(--accent-gold)' : '#555', fontWeight: 800 }}>
                            {attended ? '✓ 출석완료' : '✗ 미출석'}
                          </span>
                        </button>
                        <span style={{ color: (s.coursePayments[c.id]?.isFullyPaid) ? '#4CAF50' : '#FF4B4B', fontWeight: 800, borderLeft: '1px solid #333', paddingLeft: '16px' }}>
                          {(s.coursePayments[c.id]?.isFullyPaid) ? '완납' : '미납'}
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          );
        })}

        {activeTab === 'ATTENDANCE' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <button onClick={onDownloadAttendance} className="premium-card" style={{ padding: '12px', background: '#2e7d32', color: 'white', fontWeight: 800, border: 'none', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', cursor: 'pointer' }}>
              📊 출석 현황 엑셀 다운로드 (CSV)
            </button>
            <div className="grid-list">
              {students.map((s: Student) => (
                <div key={s.id} className="premium-card" style={{ padding: '16px 20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ fontWeight: 700 }}>{s.name} <span style={{ fontSize: '0.65rem', opacity: 0.5 }}>({s.id})</span></span>
                  <button
                    onClick={() => onToggleAttendance(s.id)}
                    style={{
                      padding: '8px 16px',
                      borderRadius: '20px',
                      backgroundColor: s.attendance[selectedDate] ? 'var(--accent-gold)' : 'transparent',
                      border: '1px solid var(--accent-gold)',
                      color: s.attendance[selectedDate] ? 'black' : 'var(--accent-gold)',
                      fontWeight: 800,
                      fontSize: '0.7rem'
                    }}
                  >
                    {s.attendance[selectedDate] ? '출석 완료 / ATTENDED' : '미출석 / ABSENT'}
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}

        {activeTab === 'FINANCE' && (() => {
          let totalCenterTarget = 0;
          let totalDiscountSupport = 0;
          const discountCounts: { [key in DiscountType]: number } = {
            NONE: 0,
            ACQUAINTANCE: 0,
            SINGLE_MOTHER: 0,
            MULTICULTURAL: 0
          };

          students.forEach(s => {
            const hasActualDiscount = !!(s.discountType && s.discountType !== 'NONE' && s.discountedCourseId);
            if (hasActualDiscount) {
              discountCounts[s.discountType as DiscountType]++;
            } else {
              discountCounts.NONE++;
            }
            s.enrolledCourses.forEach(cid => {
              const c = courses.find(course => course.id === cid);
              if (c) {
                totalCenterTarget += c.fee;
                if (hasActualDiscount && s.discountedCourseId === cid) {
                  totalDiscountSupport += Math.round(c.fee * (discountRate / 100));
                }
              }
            });
          });

          return (
            <div className="finance-grid">
              <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
                <button onClick={onDownloadFinance} className="premium-card" style={{ padding: '12px', background: '#2e7d32', color: 'white', fontWeight: 800, border: 'none', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', cursor: 'pointer' }}>
                  💰 수강료 납부 현황 엑셀 다운로드 (CSV)
                </button>

                {(isAdmin) && (
                  <div className="premium-card" style={{ padding: '24px', background: 'rgba(76, 175, 80, 0.05)', border: '1px solid #4CAF50', marginTop: '16px' }}>
                    <h4 style={{ color: '#4CAF50', marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <ShieldCheck size={18} /> 센터 재무 통합 요약 / CENTER FINANCIAL SUMMARY
                    </h4>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '24px' }}>
                      <div>
                        <p style={{ fontSize: '0.8rem', color: 'var(--text-grey)' }}>전체 강좌 매출 목표 (Total Target)</p>
                        <h3 style={{ fontSize: '1.4rem', color: 'white' }}>₩ {totalCenterTarget.toLocaleString()}</h3>
                        <p style={{ fontSize: '0.7rem', color: 'var(--text-grey)', marginTop: '8px' }}>일반 수강생: {discountCounts.NONE}명</p>
                      </div>
                      <div>
                        <p style={{ fontSize: '0.8rem', color: 'var(--text-grey)' }}>교회 지원 총액 (Total Church Support)</p>
                        <h3 style={{ fontSize: '1.4rem', color: '#4CAF50' }}>₩ {totalDiscountSupport.toLocaleString()}</h3>
                        <div style={{ display: 'flex', gap: '10px', marginTop: '8px', flexWrap: 'wrap' }}>
                          <span style={{ fontSize: '0.7rem', background: 'rgba(76,175,80,0.1)', padding: '2px 6px', borderRadius: '4px', color: '#4CAF50' }}>지인: {discountCounts.ACQUAINTANCE}</span>
                          <span style={{ fontSize: '0.7rem', background: 'rgba(76,175,80,0.1)', padding: '2px 6px', borderRadius: '4px', color: '#4CAF50' }}>미혼모: {discountCounts.SINGLE_MOTHER}</span>
                          <span style={{ fontSize: '0.7rem', background: 'rgba(76,175,80,0.1)', padding: '2px 6px', borderRadius: '4px', color: '#4CAF50' }}>다문화: {discountCounts.MULTICULTURAL}</span>
                        </div>
                      </div>
                    </div>
                    <div style={{ marginTop: '20px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <p style={{ fontSize: '0.8rem', color: 'var(--text-grey)' }}>할인율 설정 (%):</p>
                      <input
                        type="number"
                        value={discountRate}
                        onChange={(e) => onUpdateDiscountRate(parseInt(e.target.value) || 0)}
                        style={{ width: '60px', padding: '4px 8px', borderRadius: '4px', background: '#111', color: '#4CAF50', border: '1px solid #4CAF50', fontWeight: 800 }}
                      />
                    </div>
                    <div style={{ marginTop: '16px', paddingTop: '16px', borderTop: '1px solid rgba(76,175,80,0.2)' }}>
                      <p style={{ fontSize: '0.7rem', color: 'var(--text-grey)' }}>※ 교회 지원금은 학생 할인({discountRate}%)에 대한 보전금으로, 센터 수입에 포함됩니다.</p>
                    </div>
                  </div>
                )}
                {/* Revenue Analytics per Instructor */}
                <div className="premium-card" style={{ padding: '24px', background: 'rgba(191,149,63,0.05)', border: '1px solid var(--accent-gold)' }}>
                  <h4 style={{ color: 'var(--accent-gold)', marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <TrendingUp size={18} /> 강사별 정산 현황 / REVENUE PER INSTRUCTOR
                  </h4>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                    {instructors.map(inst => {
                      const instCourses = courses.filter(c => c.instructorId === inst.id);
                      let collected = 0;
                      let outstanding = 0;
                      let paidCount = 0;
                      let unpaidCount = 0;

                      students.forEach(s => {
                        instCourses.forEach(c => {
                          if (s.enrolledCourses.includes(c.id)) {
                            const p = s.coursePayments[c.id] || { amount: 0, isFullyPaid: false };
                            if (p.isFullyPaid) {
                              collected += p.amount;
                              paidCount++;
                            } else {
                              unpaidCount++;
                              outstanding += (c.fee - p.amount);
                            }
                          }
                        });
                      });

                      return (
                        <div key={inst.id} style={{ padding: '12px 0', borderBottom: '1px solid #222' }}>
                          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                            <span style={{ fontWeight: 700 }}>{inst.name.replace(' 강사', '')} 강사</span>
                            <div style={{ textAlign: 'right' }}>
                              <span style={{ color: 'var(--accent-gold)', fontWeight: 900, fontSize: '1.2rem' }}>₩ {collected.toLocaleString()}</span>
                              <p style={{ fontSize: '0.7rem', marginTop: '4px' }}>
                                <span style={{ color: '#FF4B4B' }}>미수금: ₩{outstanding.toLocaleString()}</span>
                                <span style={{ color: 'var(--text-grey)', marginLeft: '8px' }}>/ 총합: ₩{(collected + outstanding).toLocaleString()}</span>
                              </p>
                            </div>
                          </div>
                          <div style={{ display: 'flex', gap: '12px', fontSize: '0.7rem', color: 'var(--text-grey)' }}>
                            <span>완납: {paidCount}명</span>
                            <span>미납: {unpaidCount}명</span>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
                {/* Detailed Payment Management by Course */}
                {courses.map(c => (
                  <div key={c.id} style={{ marginBottom: '12px' }}>
                    <div style={{ padding: '12px 16px', background: 'var(--secondary-black)', borderRadius: '12px 12px 0 0', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <h4 style={{ fontSize: '1rem', color: 'var(--accent-gold)' }}>{c.title}</h4>
                      <span style={{ fontSize: '0.7rem', color: 'var(--text-grey)' }}>수강료: ₩{c.fee.toLocaleString()}</span>
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '1px', background: '#222', borderRadius: '0 0 12px 12px', overflow: 'hidden' }}>
                      {c.studentIds.map(sid => {
                        const s = students.find(student => student.id === sid);
                        if (!s) return null;
                        const payment = s.coursePayments[c.id] || { amount: 0, isFullyPaid: false };
                        const isDiscountedHere = s.discountedCourseId === c.id;
                        const discountAmt = (isDiscountedHere && s.discountType && s.discountType !== 'NONE') ? Math.round(c.fee * (discountRate / 100)) : 0;
                        const targetAmount = c.fee - discountAmt;

                        return (
                          <div key={sid} style={{ background: 'var(--primary-black)', padding: '16px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <div style={{ flex: 1 }}>
                              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
                                <p style={{ fontWeight: 700, fontSize: '0.9rem' }}>{s.name}</p>
                                <select
                                  value={s.discountedCourseId === c.id ? (s.discountType || 'NONE') : 'NONE'}
                                  onChange={(e) => onUpdateDiscount(s.id, c.id, e.target.value as DiscountType)}
                                  style={{ background: 'transparent', color: 'var(--accent-gold)', border: '1px solid #333', fontSize: '0.65rem', padding: '2px 4px', borderRadius: '4px' }}
                                >
                                  {Object.entries(DISCOUNT_LABELS).map(([val, label]) => (
                                    <option key={val} value={val} style={{ background: '#111', color: 'white' }}>{label}</option>
                                  ))}
                                </select>
                              </div>
                              <p style={{ fontSize: '0.65rem', color: 'var(--text-grey)' }}>
                                {s.birthdate} {s.discountedCourseId === c.id && s.discountType && s.discountType !== 'NONE' ? (
                                  <span style={{ color: '#4CAF50' }}>{discountRate}% 실납부액: ₩ {targetAmount.toLocaleString()} <span style={{ textDecoration: 'line-through', opacity: 0.5, fontSize: '0.6rem' }}>(₩{c.fee.toLocaleString()})</span></span>
                                ) : (
                                  <span>정상가: ₩ {c.fee.toLocaleString()} {s.discountedCourseId && <span style={{ fontSize: '0.6rem', opacity: 0.5, color: 'var(--accent-gold)' }}>(다른 과목 할인중)</span>}</span>
                                )}
                              </p>
                            </div>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                              <div style={{ textAlign: 'right' }}>
                                <p style={{ fontSize: '0.6rem', color: 'var(--text-grey)' }}>납부 금액 (₩)</p>
                                <p style={{ color: 'white', fontWeight: 700, fontSize: '1rem', marginBottom: '2px' }}>
                                  ₩{payment.amount.toLocaleString()}
                                </p>
                                <input
                                  type="number"
                                  defaultValue={payment.amount}
                                  onBlur={(e) => onUpdatePayment(s.id, c.id, parseInt(e.target.value) || 0, payment.isFullyPaid)}
                                  style={{ width: '100px', padding: '4px', background: 'transparent', border: 'none', borderBottom: '1px solid #333', color: 'var(--text-grey)', fontSize: '0.75rem', textAlign: 'right' }}
                                  placeholder="금액 수정"
                                />
                              </div>
                              <button
                                onClick={() => {
                                  const nextPaid = !payment.isFullyPaid;
                                  const nextAmount = nextPaid ? targetAmount : payment.amount;
                                  onUpdatePayment(s.id, c.id, nextAmount, nextPaid);
                                }}
                                style={{ padding: '6px 12px', borderRadius: '8px', background: payment.isFullyPaid ? '#4CAF50' : '#333', color: payment.isFullyPaid ? 'black' : 'var(--text-grey)', fontSize: '0.7rem', fontWeight: 800, border: 'none', minWidth: '70px' }}
                              >
                                {payment.isFullyPaid ? '완납 ✓' : '미납'}
                              </button>
                            </div>
                          </div>
                        );
                      })}
                      {c.studentIds.length === 0 && <div style={{ padding: '20px', textAlign: 'center', color: '#555', fontSize: '0.8rem' }}>배정된 수강생이 없습니다.</div>}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          );
        })()}
      </div>

      {/* Edit User Info Modal */}
      <AnimatePresence>
        {editUser && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.9)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '24px' }}>
            <div className="premium-card" style={{ width: '100%', padding: '32px' }}>
              <h2 style={{ marginBottom: '8px' }}>정보 수정 / EDIT INFO</h2>
              <p style={{ color: 'var(--text-grey)', fontSize: '0.75rem', marginBottom: '24px' }}>ID: {editUser.id} | 역할: {editUser.role}</p>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '14px', marginBottom: '24px' }}>
                <div>
                  <p style={{ fontSize: '0.75rem', color: 'var(--text-grey)', marginBottom: '6px' }}>이름 / NAME</p>
                  <input
                    id="edit-name-input"
                    placeholder="이름 (NAME)"
                    defaultValue={editUser.name}
                    style={{ width: '100%', padding: '14px', borderRadius: '12px', background: 'var(--primary-black)', color: 'white', border: '1px solid var(--accent-gold)' }}
                  />
                </div>
                <div>
                  <p style={{ fontSize: '0.75rem', color: 'var(--text-grey)', marginBottom: '6px' }}>{editUser.role === 'STUDENT' ? '번호' : '생년월일'} / {editUser.role === 'STUDENT' ? 'NUMBER' : 'BIRTHDATE'}</p>
                  <input
                    id="edit-bd-input"
                    placeholder="정보 입력 / INFO"
                    defaultValue={editUser.birthdate}
                    style={{ width: '100%', padding: '14px', borderRadius: '12px', background: 'var(--primary-black)', color: 'white', border: '1px solid var(--accent-gold)' }}
                  />
                </div>
                {editUser.role === 'STUDENT' && (
                  <div>
                    <p style={{ fontSize: '0.75rem', color: 'var(--text-grey)', marginBottom: '6px' }}>연락처 / PHONE</p>
                    <input
                      id="edit-phone-input"
                      placeholder="연락처 (PHONE)"
                      defaultValue={editUser.phone || ''}
                      style={{ width: '100%', padding: '14px', borderRadius: '12px', background: 'var(--primary-black)', color: 'white', border: '1px solid var(--accent-gold)' }}
                    />
                  </div>
                )}
                <div>
                  <p style={{ fontSize: '0.75rem', color: 'var(--text-grey)', marginBottom: '6px' }}>비밀번호 / PASSWORD</p>
                  <input
                    id="edit-pw-input"
                    placeholder="비밀번호 (PASSWORD)"
                    defaultValue={editUser.password}
                    style={{ width: '100%', padding: '14px', borderRadius: '12px', background: 'var(--primary-black)', color: 'white', border: '1px solid var(--accent-gold)' }}
                  />
                </div>
              </div>
              <div style={{ display: 'flex', gap: '12px' }}>
                <button
                  onClick={() => {
                    const newName = (document.getElementById('edit-name-input') as HTMLInputElement).value.trim();
                    const newBd = (document.getElementById('edit-bd-input') as HTMLInputElement).value.trim();
                    const newPw = (document.getElementById('edit-pw-input') as HTMLInputElement).value.trim();
                    const newPhone = (document.getElementById('edit-phone-input') as HTMLInputElement)?.value.trim() || "";
                    if (!newName || !newBd || !newPw) { alert('모든 항목을 입력해 주세요.'); return; }
                    updateUserInfo(editUser.id, newName, newBd, newPw, newPhone);
                  }}
                  style={{ flex: 1, padding: '16px', background: 'var(--accent-gold)', fontWeight: 800, borderRadius: '12px', color: 'black' }}
                >
                  저장 / SAVE
                </button>
                <button onClick={() => setEditUser(null)} style={{ flex: 1, padding: '16px', background: 'transparent', border: '1px solid var(--text-grey)', color: 'white', borderRadius: '12px' }}>취소 / CANCEL</button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

// 2. INSTRUCTOR VIEW (Multi-Course)
interface InstructorViewProps {
  user: Instructor;
  courses: Course[];
  students: Student[];
  selectedDate: string;
  toggleAttendance: (sid: string) => void;
  onLogout: () => void;
  onAddStudent: (name: string, studentNo: string, phone: string, pw: string, courseId?: string, discountType?: DiscountType) => void;
  onDeleteStudent: (id: string) => void;
  onBulkAddStudents: (data: string) => void;
}

const InstructorView: React.FC<InstructorViewProps> = ({ user, courses, students, selectedDate, toggleAttendance, onLogout, onAddStudent, onDeleteStudent, onBulkAddStudents }) => {
  const [activeTab, setActiveTab] = useState('DASHBOARD');

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px', paddingBottom: '100px' }}>
      <Header />
      <header className="premium-card" style={{ padding: '24px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <p style={{ fontSize: '0.8rem', color: 'var(--text-grey)' }}>강사 대시보드 / INSTRUCTOR DASHBOARD</p>
          <h2 style={{ color: 'var(--accent-gold)' }}>{user.name} 강사님</h2>
        </div>
        <LogOut onClick={onLogout} style={{ cursor: 'pointer' }} />
      </header>

      <div style={{ display: 'flex', gap: '12px' }}>
        <button onClick={() => setActiveTab('DASHBOARD')}
          style={{ padding: '12px 20px', borderRadius: '12px', backgroundColor: activeTab === 'DASHBOARD' ? 'var(--accent-gold)' : 'var(--secondary-black)', color: activeTab === 'DASHBOARD' ? 'black' : 'var(--text-grey)', fontWeight: 800, fontSize: '0.75rem' }}>
          수강 관리 / DASHBOARD
        </button>
        <button onClick={() => setActiveTab('STUDENTS')}
          style={{ padding: '12px 20px', borderRadius: '12px', backgroundColor: activeTab === 'STUDENTS' ? 'var(--accent-gold)' : 'var(--secondary-black)', color: activeTab === 'STUDENTS' ? 'black' : 'var(--text-grey)', fontWeight: 800, fontSize: '0.75rem' }}>
          수강생 관리 / STUDENTS
        </button>
      </div>

      {activeTab === 'DASHBOARD' && (
        <div>
          <h3>나의 강좌 / MY COURSES <span style={{ fontSize: '0.8rem', opacity: 0.5 }}>({selectedDate})</span></h3>
          <div style={{ marginTop: '20px', display: 'flex', flexDirection: 'column', gap: '32px' }}>
            {user.assignedCourses.map((cid: string) => {
              const c = courses.find((course: Course) => course.id === cid);
              if (!c) return null;
              return (
                <div key={cid}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
                    <h4 style={{ color: 'var(--accent-gold)', fontSize: '1.2rem' }}>{c.title}</h4>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: 'var(--text-grey)', fontSize: '0.8rem' }}>
                      <Clock size={14} /> {c.time}
                    </div>
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                    {c.studentIds.map((sid: string) => {
                      const s = students.find((student: Student) => student.id === sid);
                      if (!s) return null;
                      const attended = s.attendance[selectedDate];
                      return (
                        <div key={sid} className="premium-card" style={{ padding: '16px 20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                          <span style={{ fontWeight: 700 }}>{s.name} <span style={{ fontSize: '0.65rem', opacity: 0.5 }}>({s.id})</span></span>
                          <button onClick={() => toggleAttendance(sid)}
                            style={{ padding: '8px 16px', borderRadius: '20px', backgroundColor: attended ? 'var(--accent-gold)' : 'transparent', border: '1px solid var(--accent-gold)', color: attended ? 'black' : 'var(--accent-gold)', fontWeight: 800, fontSize: '0.7rem' }}>
                            {attended ? '출석 완료' : '미출석'}
                          </button>
                        </div>
                      )
                    })}
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      )}

      {activeTab === 'STUDENTS' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          <div className="premium-card" style={{ padding: '24px' }}>
            <h4 style={{ marginBottom: '16px', color: 'var(--accent-gold)' }}>수강생 수동 등록 / REGISTER STUDENT</h4>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              <input id="inst-stu-no-new" placeholder="번호 (NUMBER)" style={{ padding: '12px', borderRadius: '8px', background: 'var(--primary-black)', color: 'white', border: '1px solid var(--accent-gold)' }} />
              <input id="inst-stu-name-new" placeholder="이름(보호자) (NAME)" style={{ padding: '12px', borderRadius: '8px', background: 'var(--primary-black)', color: 'white', border: '1px solid var(--accent-gold)' }} />
              <input id="inst-stu-phone-new" placeholder="연락처 (PHONE)" style={{ padding: '12px', borderRadius: '8px', background: 'var(--primary-black)', color: 'white', border: '1px solid var(--accent-gold)' }} />
              <select id="inst-stu-course-new" style={{ padding: '12px', borderRadius: '8px', background: 'var(--primary-black)', color: 'white', border: '1px solid var(--accent-gold)' }}>
                <option value="">수강 강좌 선택 / SELECT COURSE</option>
                {courses.map((c: Course) => <option key={c.id} value={c.id}>{c.title}</option>)}
              </select>
              <select id="inst-stu-discount-new" style={{ padding: '12px', borderRadius: '8px', background: 'var(--primary-black)', color: 'white', border: '1px solid var(--accent-gold)' }}>
                <option value="NONE">할인 대상 가정 선택 / DISCOUNT</option>
                {Object.entries(DISCOUNT_LABELS).map(([val, label]) => <option key={val} value={val}>{label}</option>)}
              </select>
              <input id="inst-stu-pw-new" placeholder="비밀번호 (PW)" style={{ padding: '12px', borderRadius: '8px', background: 'var(--primary-black)', color: 'white', border: '1px solid var(--accent-gold)' }} />
              <button onClick={() => {
                const no = (document.getElementById('inst-stu-no-new') as HTMLInputElement).value;
                const n = (document.getElementById('inst-stu-name-new') as HTMLInputElement).value;
                const ph = (document.getElementById('inst-stu-phone-new') as HTMLInputElement).value;
                const pw = (document.getElementById('inst-stu-pw-new') as HTMLInputElement).value;
                const cid = (document.getElementById('inst-stu-course-new') as HTMLSelectElement).value;
                const disc = (document.getElementById('inst-stu-discount-new') as HTMLSelectElement).value as DiscountType;
                if (n && no && pw) onAddStudent(n, no, ph, pw, cid, disc);
              }} style={{ padding: '12px', background: 'var(--accent-gold)', fontWeight: 800, borderRadius: '8px', color: 'black' }}>수강생 등록 / ADD</button>
            </div>
          </div>
          <div className="premium-card" style={{ padding: '24px', marginTop: '12px', border: '1px dashed var(--accent-gold)' }}>
            <h4 style={{ marginBottom: '16px', color: 'var(--accent-gold)' }}>일괄 수강생 등록 (엑셀파일) / BULK REGISTER</h4>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'var(--primary-black)', padding: '12px', borderRadius: '8px' }}>
                <p style={{ fontSize: '0.8rem' }}>엑셀 파일 업로드 (.xlsx)</p>
                <label style={{ padding: '8px 16px', background: 'var(--accent-gold)', color: 'black', borderRadius: '8px', fontSize: '0.75rem', fontWeight: 800, cursor: 'pointer' }}>
                  파일 선택 / UPLOAD
                  <input 
                    type="file" 
                    accept=".xlsx, .xls, .csv" 
                    style={{ display: 'none' }} 
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (file) {
                        const reader = new FileReader();
                        reader.onload = (evt) => {
                          const data = evt.target?.result;
                          const workbook = XLSX.read(data, { type: 'binary' });
                          const sheetName = workbook.SheetNames[0];
                          const sheet = workbook.Sheets[sheetName];
                          const csvText = XLSX.utils.sheet_to_csv(sheet);
                          if (csvText) onBulkAddStudents(csvText);
                        };
                        reader.readAsBinaryString(file);
                      }
                      e.target.value = '';
                    }} 
                  />
                </label>
              </div>
            </div>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            {students.map((s: Student) => (
              <div key={s.id} className="premium-card" style={{ padding: '16px 20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                  <p style={{ fontWeight: 800 }}>{s.name} <span style={{ fontSize: '0.7rem', opacity: 0.5 }}>#{s.studentNo || s.id}</span></p>
                  <p style={{ fontSize: '0.7rem', color: 'var(--text-grey)' }}>PH: {s.phone || 'N/A'}</p>
                </div>
                <button onClick={() => onDeleteStudent(s.id)} style={{ background: 'none', border: 'none' }}><Trash2 size={18} color="#FF4B4B" /></button>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

// 3. STUDENT VIEW
interface StudentViewProps {
  user: Student;
  courses: Course[];
  isFlipped: boolean;
  setIsFlipped: (val: boolean) => void;
  onLogout: () => void;
  onRecharge: (amount: number) => void;
  activeTab: string;
}

const StudentView: React.FC<StudentViewProps> = ({ user, courses, isFlipped, setIsFlipped, onLogout, onRecharge, activeTab }) => {
  const [showRecharge, setShowRecharge] = useState(false);
  const [selectedAmount, setSelectedAmount] = useState<number | null>(null);
  const [payMethod, setPayMethod] = useState<string>('CARD');

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '32px', paddingBottom: '100px' }}>
      <Header />
      <header style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <div>
          <h1 style={{ fontSize: '1.5rem' }}>{user.name} <span style={{ fontWeight: 300, fontSize: '0.8rem', color: 'var(--text-grey)' }}>ROYAL MEMBERSHIP</span></h1>
        </div>
        <button onClick={onLogout} style={{ background: 'none', border: 'none', color: 'var(--text-grey)', display: 'flex', alignItems: 'center', gap: '6px' }}>
          <LogOut size={18} /> <span style={{ fontSize: '0.7rem' }}>LOGOUT</span>
        </button>
      </header>

      {activeTab === 'CARD' && (
        <>
          <section style={{ perspective: '1200px' }}>
            <motion.div style={{ width: '100%', height: '220px', position: 'relative', transformStyle: 'preserve-3d', cursor: 'pointer' }} animate={{ rotateY: isFlipped ? 180 : 0 }} onClick={() => setIsFlipped(!isFlipped)}>
              <div className="premium-card" style={{ position: 'absolute', width: '100%', height: '100%', backfaceVisibility: 'hidden', padding: '30px', color: '#000', borderRadius: '20px', background: 'linear-gradient(135deg, #BF953F 0%, #FCF6BA 45%, #B38728 50%, #FBF5B7 55%, #AA771C 100%)' }}>
                <span style={{ fontWeight: 900, letterSpacing: '2px' }}>ROYAL PASS (로열 패스)</span>
                <div style={{ marginTop: '50px' }}>
                  <p style={{ opacity: 0.6, fontSize: '0.7rem' }}>NAME (성함)</p>
                  <h2 style={{ fontSize: '1.8rem', letterSpacing: '2px' }}>{user.name}</h2>
                </div>
                <div style={{ position: 'absolute', bottom: '30px', right: '30px', fontSize: '0.8rem', fontWeight: 900, opacity: 0.8 }}>LITTLE FOREST</div>
              </div>
              <div className="premium-card" style={{ position: 'absolute', width: '100%', height: '100%', backfaceVisibility: 'hidden', transform: 'rotateY(180deg)', borderRadius: '20px', background: 'var(--secondary-black)', display: 'flex', alignItems: 'center', justifyContent: 'center', border: '1px solid var(--accent-gold)' }}>
                <div style={{ padding: '12px', background: 'white', borderRadius: '12px' }}>
                  <QRCodeSVG value={`ROYAL-${user.name}`} size={120} />
                </div>
              </div>
            </motion.div>
          </section>

          <section className="premium-card" style={{ padding: '24px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div>
              <p style={{ color: 'var(--text-grey)', fontSize: '0.8rem' }}>현재 잔액 / CURRENT BALANCE</p>
              <h2 style={{ fontSize: '2rem', color: 'var(--accent-gold)' }}>₩ {user.balance.toLocaleString()}</h2>
            </div>
            <button
              onClick={() => setShowRecharge(true)}
              style={{ padding: '12px 20px', backgroundColor: 'var(--accent-gold)', borderRadius: '12px', fontWeight: 900, color: 'black', border: 'none' }}>
              충전 / RECHARGE
            </button>
          </section>

          <section>
            <h3>수강 중인 강좌 / REGISTERED COURSES</h3>
            <div style={{ marginTop: '16px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
              {user.enrolledCourses.map(cid => {
                const c = courses.find(course => course.id === cid);
                return (
                  <div key={cid} className="premium-card" style={{ padding: '16px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span>{c?.title}</span>
                    <span style={{ fontSize: '0.7rem', color: 'var(--accent-gold)' }}>수강 중 / ENROLLED</span>
                  </div>
                )
              })}
            </div>
          </section>
        </>
      )}

      {activeTab === 'HISTORY' && (
        <section>
          <h2 style={{ fontSize: '1.5rem', marginBottom: '24px' }}>이용 내역 / USAGE HISTORY</h2>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            <div className="premium-card" style={{ padding: '20px' }}>
              <p style={{ fontSize: '0.7rem', color: 'var(--text-grey)' }}>2026.03.10</p>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '8px' }}>
                <span>포인트 충전 / RECHARGE</span>
                <span style={{ color: 'var(--accent-gold)', fontWeight: 800 }}>+ ₩ 100,000</span>
              </div>
            </div>
            <div className="premium-card" style={{ padding: '20px' }}>
              <p style={{ fontSize: '0.7rem', color: 'var(--text-grey)' }}>2026.03.05</p>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '8px' }}>
                <span>수강료 차감 / COURSE FEE</span>
                <span style={{ color: '#FF4B4B', fontWeight: 800 }}>- ₩ 150,000</span>
              </div>
            </div>
          </div>
        </section>
      )}

      {activeTab === 'INFO' && (
        <section>
          <h2 style={{ fontSize: '1.5rem', marginBottom: '24px' }}>내 정보 / ACCOUNT INFO</h2>
          <div className="premium-card" style={{ padding: '32px', display: 'flex', flexDirection: 'column', gap: '20px' }}>
            <div>
              <p style={{ color: 'var(--text-grey)', fontSize: '0.8rem' }}>성함 (NAME)</p>
              <p style={{ fontSize: '1.1rem', fontWeight: 700 }}>{user.name}</p>
            </div>
            <div>
              <p style={{ color: 'var(--text-grey)', fontSize: '0.8rem' }}>관리 번호 (NUMBER)</p>
              <p style={{ fontSize: '1.1rem', fontWeight: 700 }}>{user.studentNo || user.id}</p>
            </div>
            <div>
              <p style={{ color: 'var(--text-grey)', fontSize: '0.8rem' }}>연락처 (PHONE)</p>
              <p style={{ fontSize: '1.1rem', fontWeight: 700 }}>{user.phone || 'N/A'}</p>
            </div>
            <div>
              <p style={{ color: 'var(--text-grey)', fontSize: '0.8rem' }}>회원 등급 (MEMBERSHIP)</p>
              <p style={{ fontSize: '1.1rem', fontWeight: 700, color: 'var(--accent-gold)' }}>ROYAL MEMBERSHIP</p>
            </div>
            <div style={{ marginTop: '20px', padding: '16px', background: 'rgba(191,149,63,0.05)', borderRadius: '12px', border: '1px dashed var(--accent-gold)' }}>
              <p style={{ fontSize: '0.8rem', color: 'var(--accent-gold)', lineHeight: '1.5' }}>ℹ️ 회원 정보 수정은 센터 데스크를 통해서만 가능합니다. 비밀번호 변경이 필요한 경우 관리자에게 문의해 주세요.</p>
            </div>
          </div>
        </section>
      )}

      {/* Navigation for Students - REMOVED, now handled by App component */}

      {/* Recharge Modal with Payment Method Selection */}
      <AnimatePresence>
        {showRecharge && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.95)', zIndex: 1200, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '24px' }}>
            <div className="premium-card" style={{ width: '100%', maxWidth: '400px', padding: '32px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
                <h2 style={{ fontSize: '1.2rem' }}>금액 충전 / RECHARGE</h2>
                <XCircle onClick={() => { setShowRecharge(false); setSelectedAmount(null); }} style={{ color: 'var(--text-grey)', cursor: 'pointer' }} />
              </div>

              {!selectedAmount ? (
                <>
                  <p style={{ color: 'var(--text-grey)', marginBottom: '16px', fontSize: '0.85rem' }}>충전하실 금액을 선택해 주세요.</p>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '24px' }}>
                    {[100000, 300000, 500000, 1000000].map(amount => (
                      <button
                        key={amount}
                        onClick={() => setSelectedAmount(amount)}
                        style={{ padding: '14px', borderRadius: '10px', backgroundColor: 'var(--secondary-black)', border: '1px solid var(--glass-border)', color: 'white', fontWeight: 700 }}>
                        ₩ {amount.toLocaleString()}
                      </button>
                    ))}
                  </div>
                </>
              ) : (
                <>
                  <div style={{ background: 'var(--secondary-black)', padding: '20px', borderRadius: '12px', textAlign: 'center', marginBottom: '24px' }}>
                    <p style={{ color: 'var(--text-grey)', fontSize: '0.8rem' }}>충전 금액</p>
                    <h3 style={{ color: 'var(--accent-gold)', fontSize: '1.8rem', fontWeight: 900 }}>₩ {selectedAmount.toLocaleString()}</h3>
                  </div>

                  <p style={{ color: 'var(--text-grey)', marginBottom: '12px', fontSize: '0.85rem' }}>결제 수단 선택 / SELECT PAYMENT</p>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', marginBottom: '32px' }}>
                    {[
                      { id: 'CARD', name: '신용/체크카드', eng: 'CREDIT CARD' },
                      { id: 'KAKAO', name: '카카오페이', eng: 'KAKAO PAY' },
                      { id: 'NAVER', name: '네이버페이', eng: 'NAVER PAY' }
                    ].map(method => (
                      <div
                        key={method.id}
                        onClick={() => setPayMethod(method.id)}
                        style={{ padding: '14px 20px', borderRadius: '12px', background: payMethod === method.id ? 'rgba(191,149,63,0.1)' : 'var(--secondary-black)', border: payMethod === method.id ? '1px solid var(--accent-gold)' : '1px solid var(--glass-border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', cursor: 'pointer' }}>
                        <span style={{ fontSize: '0.9rem', fontWeight: 600 }}>{method.name} <span style={{ fontSize: '0.7rem', opacity: 0.5 }}>{method.eng}</span></span>
                        {payMethod === method.id && <CheckCircle2 size={18} color="var(--accent-gold)" />}
                      </div>
                    ))}
                  </div>

                  <div style={{ display: 'flex', gap: '12px' }}>
                    <button onClick={() => setSelectedAmount(null)} style={{ flex: 1, padding: '16px', background: 'transparent', border: '1px solid #333', color: 'white', fontWeight: 700, borderRadius: '12px' }}>이전 / BACK</button>
                    <button
                      onClick={() => { onRecharge(selectedAmount); setShowRecharge(false); setSelectedAmount(null); }}
                      style={{ flex: 2, padding: '16px', background: 'var(--accent-gold)', color: 'black', fontWeight: 900, borderRadius: '12px' }}>결제하기 / PAY</button>
                  </div>
                </>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

// 4. STATS MODAL
interface StatsModalProps {
  isOpen: boolean;
  onClose: () => void;
  students: Student[];
  instructors: Instructor[];
  courses: Course[];
}

const StatsModal: React.FC<StatsModalProps> = ({ isOpen, onClose, students, instructors, courses }) => {
  const [selectedMonth, setSelectedMonth] = useState(new Date().toISOString().slice(0, 7)); // YYYY-MM

  if (!isOpen) return null;

  // Helper to calculate course attendance rate and count
  const getCourseData = (c: Course) => {
    let totalPossible = 0;
    let totalAttended = 0;

    const monthlyDates = new Set<string>();
    students.forEach(s => {
      Object.keys(s.attendance).forEach(date => {
        if (date.startsWith(selectedMonth)) monthlyDates.add(date);
      });
    });

    const datesArray = Array.from(monthlyDates);
    if (datesArray.length === 0) return { rate: 0, attended: 0, possible: 0 };

    c.studentIds.forEach(sid => {
      const s = students.find(student => student.id === sid);
      if (s) {
        datesArray.forEach(date => {
          totalPossible++;
          if (s.attendance[date]) totalAttended++;
        });
      }
    });

    const rate = totalPossible === 0 ? 0 : Math.round((totalAttended / totalPossible) * 100);
    return { rate, attended: totalAttended, possible: totalPossible };
  };

  // Helper to calculate instructor's overall stat and count
  const getInstructorData = (inst: Instructor) => {
    const assigned = courses.filter(c => inst.assignedCourses.includes(c.id));
    if (assigned.length === 0) return { rate: 0, attended: 0, possible: 0 };

    let totalAttended = 0;
    let totalPossible = 0;

    assigned.forEach(c => {
      const data = getCourseData(c);
      totalAttended += data.attended;
      totalPossible += data.possible;
    });

    const rate = totalPossible === 0 ? 0 : Math.round((totalAttended / totalPossible) * 100);
    return { rate, attended: totalAttended, possible: totalPossible };
  };

  return (
    <AnimatePresence>
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
        style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.95)', zIndex: 1100, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px' }}>
        <div className="premium-card" style={{ width: '100%', maxWidth: '500px', maxHeight: '85vh', overflowY: 'auto', padding: '32px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '32px' }}>
            <h2 style={{ fontSize: '1.5rem', borderLeft: '4px solid var(--accent-gold)', paddingLeft: '12px' }}>월간 통계 / MONTHLY STATS</h2>
            <XCircle onClick={onClose} style={{ cursor: 'pointer', color: 'var(--text-grey)' }} />
          </div>

          <div style={{ marginBottom: '24px' }}>
            <p style={{ fontSize: '0.8rem', color: 'var(--text-grey)', marginBottom: '8px' }}>조회 월 선택 / SELECT MONTH</p>
            <input
              type="month"
              value={selectedMonth}
              onChange={(e) => setSelectedMonth(e.target.value)}
              style={{ width: '100%', padding: '12px', background: 'var(--secondary-black)', color: 'white', border: '1px solid var(--accent-gold)', borderRadius: '12px' }}
            />
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '32px' }}>
            {/* By Course */}
            <div>
              <h3 style={{ fontSize: '1rem', color: 'var(--accent-gold)', marginBottom: '16px' }}>강좌별 출석 현황 / BY COURSE</h3>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                {courses.map(c => {
                  const data = getCourseData(c);
                  return (
                    <div key={c.id}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px', fontSize: '0.85rem' }}>
                        <span>{c.title}</span>
                        <span style={{ fontWeight: 800 }}>
                          {data.rate}% <span style={{ fontSize: '0.7rem', color: 'var(--text-grey)', marginLeft: '6px' }}>({data.attended}/{data.possible})</span>
                        </span>
                      </div>
                      <div style={{ height: '8px', background: '#333', borderRadius: '4px', overflow: 'hidden' }}>
                        <motion.div initial={{ width: 0 }} animate={{ width: `${data.rate}%` }} transition={{ duration: 1 }} style={{ height: '100%', background: 'linear-gradient(90deg, #BF953F, #FCF6BA)' }} />
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* By Instructor */}
            <div>
              <h3 style={{ fontSize: '1rem', color: 'var(--accent-gold)', marginBottom: '16px' }}>강사별 출석 현황 / BY INSTRUCTOR</h3>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                {instructors.map(inst => {
                  const data = getInstructorData(inst);
                  return (
                    <div key={inst.id} style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                      <div style={{ flex: 1 }}>
                        <p style={{ fontSize: '0.85rem', fontWeight: 600 }}>{inst.name} 강사</p>
                        <p style={{ fontSize: '0.7rem', color: 'var(--text-grey)' }}>{inst.assignedCourses.length} Courses</p>
                      </div>
                      <div style={{ background: 'var(--secondary-black)', padding: '10px 16px', borderRadius: '12px', textAlign: 'right', border: '1px solid var(--glass-border)' }}>
                        <span style={{ fontWeight: 900, fontSize: '1.2rem', color: 'var(--accent-gold)', display: 'block' }}>{data.rate}%</span>
                        <span style={{ fontSize: '0.65rem', color: 'var(--text-grey)' }}>출석수: {data.attended}/{data.possible}</span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>

          <button onClick={onClose} style={{ width: '100%', padding: '16px', marginTop: '40px', background: 'var(--accent-gold)', color: 'black', fontWeight: 800, borderRadius: '12px' }}>확인 / CLOSE</button>
        </div>
      </motion.div>
    </AnimatePresence>
  );
};

// --- Main App ---

const App: React.FC = () => {
  // --- Global State ---
  const [currentUser, setCurrentUser] = useState<(BaseUser | Student | Instructor) | null>(() => {
    try {
      const saved = localStorage.getItem('lf_current_user');
      return saved ? JSON.parse(saved) : null;
    } catch { return null; }
  });
  const [students, setStudents] = useState<Student[]>([]);
  const [instructors, setInstructors] = useState<Instructor[]>([]);
  const [generalAdmins, setGeneralAdmins] = useState<BaseUser[]>([]);
  const [courses, setCourses] = useState<Course[]>([]);
  const [discountRate, setDiscountRate] = useState(30);
  const [isLoading, setIsLoading] = useState(true);

  // UI States
  const [activeTab, setActiveTab] = useState<string>('STUDENTS');
  const [activeStudentTab, setActiveStudentTab] = useState<string>('CARD');
  const [loginForm, setLoginForm] = useState({ name: '', birthdate: '', password: '' });
  const [showPassword, setShowPassword] = useState(false);
  const [selectedDate] = useState<string>(new Date().toISOString().split('T')[0]);
  const [isFlipped, setIsFlipped] = useState<boolean>(false);
  const [editUser, setEditUser] = useState<any>(null);
  const [showStatsModal, setShowStatsModal] = useState(false);

  // --- Helper for Cloud Sync ---
  const syncToCloud = async (key: string, value: any) => {
    if (isLoading) return; // Don't sync while initial loading is in progress
    await supabase.from('app_data').upsert({ key, value });
  };

  // --- Initial Load from Cloud ---
  useEffect(() => {
    const loadData = async () => {
      try {
        const { data, error } = await supabase.from('app_data').select('*');
        if (error) throw error;

        const remoteData: Record<string, any> = {};
        data?.forEach((row: { key: string; value: any }) => remoteData[row.key] = row.value);

        // Map remote data to states with local fallbacks
        setStudents(remoteData.students || INITIAL_STUDENTS);
        setInstructors(remoteData.instructors || INITIAL_INSTRUCTORS);
        setGeneralAdmins(remoteData.admins || INITIAL_GENERAL_ADMINS);
        setCourses(remoteData.courses || INITIAL_COURSES);
        setDiscountRate(remoteData.discount_rate || 30);
        
        // Refresh currentUser object from the newly loaded data
        const savedUser = localStorage.getItem('lf_current_user');
        if (savedUser) {
          try {
            const parsed = JSON.parse(savedUser);
            if (parsed) {
              const allPossibleUsers = [
                ...(remoteData.admins || INITIAL_GENERAL_ADMINS),
                ...(remoteData.instructors || INITIAL_INSTRUCTORS),
                ...(remoteData.students || INITIAL_STUDENTS)
              ];
              const latest = allPossibleUsers.find(u => u.id === parsed.id);
              if (latest) {
                setCurrentUser(latest);
              } else if (parsed.id === INITIAL_SUPER_ADMIN.id) {
                setCurrentUser(INITIAL_SUPER_ADMIN);
              } else {
                // If user not found in remote data, clear local logout
                setCurrentUser(null);
              }
            }
          } catch (e) {
            console.error("Auto-login parsed failed", e);
          }
        }
        
      } catch (err) {
        console.error("Cloud load error:", err);
        // On error, fall back to initial data
        setStudents(INITIAL_STUDENTS);
        setInstructors(INITIAL_INSTRUCTORS);
        setGeneralAdmins(INITIAL_GENERAL_ADMINS);
        setCourses(INITIAL_COURSES);
      } finally {
        setIsLoading(false);
      }
    };
    loadData();
  }, []);

  // --- Persistence Sync (Local & Cloud) ---
  useEffect(() => {
    if (!isLoading) {
      localStorage.setItem('lf_current_user', JSON.stringify(currentUser));
    }
  }, [currentUser, isLoading]);

  useEffect(() => {
    syncToCloud('students', students);
  }, [students]);

  useEffect(() => {
    syncToCloud('instructors', instructors);
  }, [instructors]);

  useEffect(() => {
    syncToCloud('admins', generalAdmins);
  }, [generalAdmins]);

  useEffect(() => {
    syncToCloud('courses', courses);
  }, [courses]);

  useEffect(() => {
    syncToCloud('discount_rate', discountRate);
  }, [discountRate]);

  // --- Handlers ---
  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    const name = loginForm.name.trim();
    const birthdate = loginForm.birthdate.trim();
    const password = loginForm.password.trim();

    if (name === INITIAL_SUPER_ADMIN.name && birthdate === INITIAL_SUPER_ADMIN.birthdate && password === INITIAL_SUPER_ADMIN.password) {
      setCurrentUser(INITIAL_SUPER_ADMIN);
      return;
    }
    const genAdmin = generalAdmins.find(a => a.name === name && a.birthdate === birthdate && a.password === password);
    if (genAdmin) { setCurrentUser(genAdmin); return; }
    const inst = instructors.find(i => i.name === name && i.birthdate === birthdate && i.password === password);
    if (inst) { setCurrentUser(inst); return; }
    const stud = students.find(s => s.name === name && s.birthdate === birthdate && s.password === password);
    if (stud) { setCurrentUser(stud); return; }

    const nameMatchInst = instructors.find(i => i.name === name);
    const nameMatchStu = students.find(s => s.name === name);
    if (nameMatchInst || nameMatchStu) {
      alert('이름은 맞지만, 생년월일 또는 비밀번호가 올바르지 않습니다.\n(Name matched, but birthdate or password is incorrect.)');
    } else {
      alert(`'${name}' 이름으로 등록된 계정을 찾을 수 없습니다.\n등록된 이름을 정확히 입력해 주세요.\n(No account found for this name. Please enter the exact registered name.)`);
    }
  };

  const updateUserInfo = (id: string, newName: string, newBd: string, newPw: string, newPhone: string = "") => {
    setStudents(prev => prev.map(s => s.id === id ? { ...s, name: newName, birthdate: newBd, studentNo: newBd, password: newPw, phone: newPhone } : s));
    setInstructors(prev => prev.map(i => i.id === id ? { ...i, name: newName, birthdate: newBd, password: newPw } : i));
    setGeneralAdmins(prev => prev.map(a => a.id === id ? { ...a, name: newName, birthdate: newBd, password: newPw } : a));
    setEditUser(null);
    alert(`수정되었습니다: ${newName} / ${newBd}`);
  };

  const toggleAttendance = (studentId: string) => {
    setStudents(prev => prev.map(s => {
      if (s.id === studentId) {
        const currentAtt = s.attendance[selectedDate] || false;
        return { ...s, attendance: { ...s.attendance, [selectedDate]: !currentAtt } };
      }
      return s;
    }));
  };

  const handleRecharge = (amount: number) => {
    if (currentUser && currentUser.role === 'STUDENT') {
      setStudents(prev => prev.map(s =>
        s.id === currentUser.id ? { ...s, balance: s.balance + amount } : s
      ));
      // Update local currentUser state to reflect immediate UI change
      setCurrentUser(prev => prev ? { ...prev, balance: (prev as Student).balance + amount } : null);
      alert(`₩${amount.toLocaleString()}원이 충전되었습니다.`);
    }
  };

  const handleLogout = () => {
    setCurrentUser(null);
    localStorage.removeItem('lf_current_user');
    setLoginForm({ name: '', birthdate: '', password: '' });
  };

  const addGeneralAdmin = (name: string, bd: string, pw: string) => {
    const newAdmin: BaseUser = { id: `A${Date.now()}`, name, birthdate: bd, password: pw, role: 'ADMIN' };
    setGeneralAdmins([...generalAdmins, newAdmin]);
    alert(`${name} 관리자가 임명되었습니다.`);
  };

  const deleteAdmin = (id: string) => {
    if (window.confirm('정말 이 관리자를 삭제하시겠습니까? (Are you sure you want to delete this admin?)')) {
      setGeneralAdmins(prev => prev.filter(a => a.id !== id));
    }
  };

  const addInstructor = (name: string, bd: string, pw: string) => {
    const newInst: Instructor = { id: `I${Date.now()}`, name, birthdate: bd, password: pw, role: 'INSTRUCTOR', assignedCourses: [] };
    setInstructors([...instructors, newInst]);
    alert(`${name} 강사가 등록되었습니다.`);
  };

  const deleteInstructor = (id: string) => {
    if (window.confirm('정말 이 강사를 삭제하시겠습니까? 모든 정보가 사라집니다. (Are you sure you want to delete this instructor?)')) {
      setInstructors(prev => prev.filter(i => i.id !== id));
    }
  };

  const addStudent = (name: string, studentNo: string, phone: string, pw: string, courseId?: string, discountType: DiscountType = 'NONE') => {
    const studentId = `S${Date.now()}`;
    const newStu: Student = {
      id: studentId,
      name,
      birthdate: studentNo, // Using studentNo as birthdate for login compatibility
      password: pw,
      role: 'STUDENT',
      balance: 0,
      enrolledCourses: courseId ? [courseId] : [],
      coursePayments: courseId ? { [courseId]: { amount: 0, isFullyPaid: false } } : {},
      paidStatus: false,
      attendance: {},
      studentNo,
      phone,
      discountType
    };
    setStudents([...students, newStu]);

    if (courseId) {
      setCourses(prev => prev.map(c =>
        c.id === courseId ? { ...c, studentIds: [...c.studentIds, studentId] } : c
      ));
    }

    alert(`${name} 수강생이 등록되었습니다. ${courseId ? '(과목 배정 완료)' : ''}`);
  };

  const deleteStudent = (id: string) => {
    if (window.confirm('정말 이 수강생을 삭제하시겠습니까? (Are you sure you want to delete this student?)')) {
      setStudents(prev => prev.filter(s => s.id !== id));
      // Also remove student from any courses
      setCourses(prev => prev.map(c => ({
        ...c,
        studentIds: c.studentIds.filter(sid => sid !== id)
      })));
    }
  };

  const addCourse = (title: string, time: string, instructorId: string, fee: number = 0) => {
    const newCourse: Course = { id: `C${Date.now()}`, title, time, instructorId, studentIds: [], fee };
    setCourses([...courses, newCourse]);
    // Also update instructor's assignedCourses
    setInstructors(prev => prev.map(inst =>
      inst.id === instructorId ? { ...inst, assignedCourses: [...inst.assignedCourses, newCourse.id] } : inst
    ));
    alert(`${title} 강좌가 등록 및 강사에게 배정되었습니다.`);
  };

  const deleteCourse = (id: string) => {
    if (window.confirm('정말 이 강좌를 삭제하시겠습니까?')) {
      setCourses(prev => prev.filter(c => c.id !== id));
      // Remove from instructors
      setInstructors(prev => prev.map(inst => ({
        ...inst,
        assignedCourses: inst.assignedCourses.filter(cid => cid !== id)
      })));
      // Note: Students are not deleted, just the course association
    }
  };

  const bulkDeleteStudents = (ids: string[]) => {
    setStudents(prev => prev.filter(s => !ids.includes(s.id)));
    setCourses(prev => prev.map(c => ({
      ...c,
      studentIds: c.studentIds.filter(sid => !ids.includes(sid))
    })));
  };

  const bulkDeleteInstructors = (ids: string[]) => {
    setInstructors(prev => prev.filter(i => !ids.includes(i.id)));
    // Also remove from courses
    setCourses(prev => prev.map(c => 
      ids.includes(c.instructorId) ? { ...c, instructorId: "" } : c
    ));
  };

  const bulkDeleteCourses = (ids: string[]) => {
    setCourses(prev => prev.filter(c => !ids.includes(c.id)));
    setInstructors(prev => prev.map(inst => ({
      ...inst,
      assignedCourses: inst.assignedCourses.filter(cid => !ids.includes(cid))
    })));
  };

  const bulkAddStudents = (csvData: string) => {
    const lines = csvData.trim().split('\n');
    const newStudentsBatch: Student[] = [];
    const courseEnrollmentMaps: { [courseId: string]: string[] } = {};

    lines.forEach((line, index) => {
      // Skip header if it contains typical keywords
      if (index === 0 && (line.includes('번호') || line.includes('이름'))) return;

      const parts = line.split(',').map(s => s.trim());
      if (parts.length < 4) return; // Need at least no, name, phone, courseTitle
      const [no, name, phone, courseTitle, discountLabel, pw] = parts;

      const studentId = `S${Date.now()}-${Math.floor(Math.random() * 10000)}`;
      let matchedCid = "";

      if (courseTitle) {
        const found = courses.find(c =>
          c.title.replace(/\s+/g, '').includes(courseTitle.replace(/\s+/g, ''))
        );
        if (found) matchedCid = found.id;
      }

      let dType: DiscountType = 'NONE';
      if (discountLabel) {
        if (discountLabel.includes('지인')) dType = 'ACQUAINTANCE';
        else if (discountLabel.includes('미혼모')) dType = 'SINGLE_MOTHER';
        else if (discountLabel.includes('다문화')) dType = 'MULTICULTURAL';
      }

      newStudentsBatch.push({
        id: studentId,
        name,
        birthdate: no, // Using no as internal birthdate for login
        password: pw || "0000",
        role: 'STUDENT',
        balance: 0,
        enrolledCourses: matchedCid ? [matchedCid] : [],
        coursePayments: matchedCid ? { [matchedCid]: { amount: 0, isFullyPaid: false } } : {},
        paidStatus: false,
        attendance: {},
        studentNo: no,
        phone,
        discountType: dType,
        discountedCourseId: matchedCid && dType !== 'NONE' ? matchedCid : undefined
      });

      if (matchedCid) {
        if (!courseEnrollmentMaps[matchedCid]) courseEnrollmentMaps[matchedCid] = [];
        courseEnrollmentMaps[matchedCid].push(studentId);
      }
    });

    if (newStudentsBatch.length > 0) {
      setStudents(prev => [...prev, ...newStudentsBatch]);

      if (Object.keys(courseEnrollmentMaps).length > 0) {
        setCourses(prev => prev.map(c => {
          if (courseEnrollmentMaps[c.id]) {
            return { ...c, studentIds: [...c.studentIds, ...courseEnrollmentMaps[c.id]] };
          }
          return c;
        }));
      }
      alert(`${newStudentsBatch.length}명의 수강생이 등록되었습니다. (과목 자동 배정 포함)`);
    } else {
      alert('올바른 형식이 아닙니다 (번호,이름,연락처,강좌명,할인유형,비밀번호).');
    }
  };
  
  const bulkRegisterToCourse = (sids: string[], cid: string) => {
    const targetCourse = courses.find(c => c.id === cid);
    if (!targetCourse) return;

    setStudents(prev => prev.map(s => {
      if (sids.includes(s.id)) {
        if (!s.enrolledCourses.includes(cid)) {
          return {
            ...s,
            enrolledCourses: [...s.enrolledCourses, cid],
            coursePayments: {
              ...s.coursePayments,
              [cid]: { amount: 0, isFullyPaid: false }
            }
          };
        }
      }
      return s;
    }));

    setCourses(prev => prev.map(c => {
      if (c.id === cid) {
        const uniqueIds = Array.from(new Set([...c.studentIds, ...sids]));
        return { ...c, studentIds: uniqueIds };
      }
      return c;
    }));

    alert(`${sids.length}명의 수강생이 '${targetCourse.title}' 강좌에 일괄 등록되었습니다.`);
  };

  const updateCourseFee = (id: string, fee: number) => {
    setCourses(prev => prev.map(c => c.id === id ? { ...c, fee } : c));
  };

  const updateStudentPayment = (sid: string, cid: string, amount: number, isFullyPaid: boolean) => {
    setStudents(prev => prev.map(s => {
      if (s.id === sid) {
        return {
          ...s,
          coursePayments: {
            ...s.coursePayments,
            [cid]: { amount, isFullyPaid }
          }
        };
      }
      return s;
    }));
  };

  const updateStudentDiscount = (sid: string, cid: string, type: DiscountType) => {
    setStudents(prev => prev.map(s => {
      if (s.id === sid) {
        if (type === 'NONE') {
          // Only clear if this course was the one being discounted
          if (s.discountedCourseId === cid) {
            return { ...s, discountType: 'NONE', discountedCourseId: undefined };
          }
          return s;
        } else {
          return { ...s, discountType: type, discountedCourseId: cid };
        }
      }
      return s;
    }));
  };

  const downloadAttendanceCSV = () => {
    const data = [["날짜", "번호", "강좌명", "학생명(보호자)", "연락처", "출석여부"]];
    courses.forEach(c => {
      c.studentIds.forEach(sid => {
        const s = students.find(student => student.id === sid);
        if (s) {
          const status = s.attendance[selectedDate] ? "출석" : "미출석";
          data.push([selectedDate, s.studentNo || s.id, c.title, s.name, s.phone || 'N/A', status]);
        }
      });
    });
    const worksheet = XLSX.utils.aoa_to_sheet(data);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Attendance");
    XLSX.writeFile(workbook, `attendance_${selectedDate}.xlsx`);
  };

  const downloadFinanceCSV = () => {
    const data = [[`번호`, `이름(보호자)`, `연락처`, `강좌명`, `할인유형`, `기본수강료`, `납부금액`, `교회지원금(${discountRate}%)`, `완납여부`]];
    courses.forEach(c => {
      c.studentIds.forEach(sid => {
        const s = students.find(student => student.id === sid);
        if (s) {
          const p = s.coursePayments[c.id] || { amount: 0, isFullyPaid: false };
          const discountAmt = (s.discountedCourseId === c.id && s.discountType && s.discountType !== 'NONE') ? Math.round(c.fee * (discountRate / 100)) : 0;
          const discountLabel = DISCOUNT_LABELS[s.discountType || 'NONE'].split(' / ')[0];
          data.push([s.studentNo || s.id, s.name, s.phone || 'N/A', c.title, discountLabel, c.fee, p.amount, discountAmt, p.isFullyPaid ? "완납" : "미납"]);
        }
      });
    });
    const worksheet = XLSX.utils.aoa_to_sheet(data);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Finance");
    XLSX.writeFile(workbook, "finance_status.xlsx");
  };

  const downloadStudentTemplateCSV = () => {
    const data = [
      ["번호", "이름(보호자)", "연락처", "강좌명", "할인 대상 가정", "비밀번호"],
      ["1", "홍길동", "010-1234-5678", "명품 와인", "일반", "1234"],
      ["2", "성춘향", "010-9876-5432", "프리미엄 세라믹", "다문화", "0000"]
    ];
    const worksheet = XLSX.utils.aoa_to_sheet(data);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "RegistrationTemplate");
    XLSX.writeFile(workbook, "registration_template.xlsx");
  };

  if (isLoading) {
    return (
      <div style={{ height: '100vh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', background: 'var(--primary-black)', color: 'white' }}>
        <motion.div
          animate={{ opacity: [0.5, 1, 0.5] }}
          transition={{ duration: 2, repeat: Infinity }}
          style={{ textAlign: 'center' }}
        >
          <h1 style={{ fontSize: '2rem', letterSpacing: '4px', marginBottom: '10px', fontWeight: 900 }}>LITTLE FOREST</h1>
          <div style={{ width: '40px', height: '2px', background: 'var(--accent-gold)', margin: '0 auto 24px' }} />
          <p style={{ fontSize: '0.8rem', color: 'var(--text-grey)', letterSpacing: '4px' }}>SYNCHRONIZING...</p>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="layout">
      {!currentUser ? (
        <LoginView
          loginForm={loginForm}
          setLoginForm={setLoginForm}
          handleLogin={handleLogin}
          showPassword={showPassword}
          setShowPassword={setShowPassword}
        />
      ) : (
        <>
          {(currentUser.role === 'ADMIN' || currentUser.role === 'SUPER_ADMIN') && (
            <AdminView
              currentUser={currentUser as BaseUser}
              activeTab={activeTab}
              setActiveTab={setActiveTab}
              students={students}
              instructors={instructors}
              generalAdmins={generalAdmins}
              courses={courses}
              selectedDate={selectedDate}
              setEditUser={setEditUser}
              editUser={editUser}
              updateUserInfo={updateUserInfo}
              onShowStats={() => setShowStatsModal(true)}
              onAddGeneralAdmin={addGeneralAdmin}
              onDeleteAdmin={deleteAdmin}
              onAddInstructor={addInstructor}
              onDeleteInstructor={deleteInstructor}
              onAddStudent={addStudent}
              onDeleteStudent={deleteStudent}
              onAddCourse={addCourse}
              onDeleteCourse={deleteCourse}
              onBulkAddStudents={bulkAddStudents}
              onUpdatePayment={updateStudentPayment}
              onUpdateCourseFee={updateCourseFee}
              onToggleAttendance={toggleAttendance}
              onDownloadAttendance={downloadAttendanceCSV}
              onDownloadFinance={downloadFinanceCSV}
              onUpdateDiscount={updateStudentDiscount}
              onDownloadStudentTemplate={downloadStudentTemplateCSV}
              onBulkDeleteStudents={bulkDeleteStudents}
              onBulkDeleteInstructors={bulkDeleteInstructors}
              onBulkDeleteCourses={bulkDeleteCourses}
              discountRate={discountRate}
              onUpdateDiscountRate={setDiscountRate}
              onBulkRegisterToCourse={bulkRegisterToCourse}
            />
          )}
          {currentUser.role === 'INSTRUCTOR' && (
            <InstructorView
              user={currentUser as Instructor}
              courses={courses}
              students={students}
              selectedDate={selectedDate}
              toggleAttendance={toggleAttendance}
              onLogout={handleLogout}
              onAddStudent={addStudent}
              onDeleteStudent={deleteStudent}
              onBulkAddStudents={bulkAddStudents}
            />
          )}
          {currentUser.role === 'STUDENT' && (
            <StudentView
              user={currentUser as Student}
              courses={courses}
              isFlipped={isFlipped}
              setIsFlipped={setIsFlipped}
              onLogout={handleLogout}
              onRecharge={handleRecharge}
              activeTab={activeStudentTab}
            />
          )}

          <nav style={{ position: 'fixed', bottom: '24px', left: '24px', right: '24px', height: '72px', background: '#000', borderRadius: '24px', border: '1px solid var(--accent-gold)', display: 'flex', justifyContent: 'space-around', alignItems: 'center', zIndex: 100 }}>
            {(currentUser.role === 'ADMIN' || currentUser.role === 'SUPER_ADMIN') ? (
              <>
                <div onClick={() => setActiveTab('STUDENTS')} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', cursor: 'pointer' }}>
                  <Users color={activeTab === 'STUDENTS' ? 'var(--accent-gold)' : 'white'} size={20} />
                  <span style={{ fontSize: '0.6rem', color: activeTab === 'STUDENTS' ? 'var(--accent-gold)' : 'white', marginTop: '4px' }}>수강생 / STU</span>
                </div>
                <div onClick={() => setActiveTab('INSTRUCTORS')} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', cursor: 'pointer' }}>
                  <BookOpen color={activeTab === 'INSTRUCTORS' ? 'var(--accent-gold)' : 'white'} size={20} />
                  <span style={{ fontSize: '0.6rem', color: activeTab === 'INSTRUCTORS' ? 'var(--accent-gold)' : 'white', marginTop: '4px' }}>강사 / INST</span>
                </div>
                <div onClick={() => setActiveTab('REPORT')} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', cursor: 'pointer' }}>
                  <BarChart3 color={activeTab === 'REPORT' ? 'var(--accent-gold)' : 'white'} size={20} />
                  <span style={{ fontSize: '0.6rem', color: activeTab === 'REPORT' ? 'var(--accent-gold)' : 'white', marginTop: '4px' }}>통계 / RPT</span>
                </div>
                <div onClick={() => setActiveTab('FINANCE')} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', cursor: 'pointer' }}>
                  <DollarSign color={activeTab === 'FINANCE' ? 'var(--accent-gold)' : 'white'} size={20} />
                  <span style={{ fontSize: '0.6rem', color: activeTab === 'FINANCE' ? 'var(--accent-gold)' : 'white', marginTop: '4px' }}>납부 / FIN</span>
                </div>
                {currentUser.role === 'SUPER_ADMIN' && (
                  <div onClick={() => setActiveTab('ADMINS')} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', cursor: 'pointer' }}>
                    <ShieldCheck color={activeTab === 'ADMINS' ? 'var(--accent-gold)' : 'white'} size={20} />
                    <span style={{ fontSize: '0.6rem', color: activeTab === 'ADMINS' ? 'var(--accent-gold)' : 'white', marginTop: '4px' }}>관리 / ADM</span>
                  </div>
                )}
                <div onClick={handleLogout} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', cursor: 'pointer' }}>
                  <LogOut color="white" size={20} />
                  <span style={{ fontSize: '0.6rem', color: 'white', marginTop: '4px' }}>로그아웃</span>
                </div>
              </>
            ) : currentUser.role === 'STUDENT' ? (
              <>
                <div onClick={() => setActiveStudentTab('CARD')} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', cursor: 'pointer' }}>
                  <CreditCard color={activeStudentTab === 'CARD' ? 'var(--accent-gold)' : 'white'} size={20} />
                  <span style={{ fontSize: '0.6rem', color: activeStudentTab === 'CARD' ? 'var(--accent-gold)' : 'white', marginTop: '4px' }}>카드 / CARD</span>
                </div>
                <div onClick={() => setActiveStudentTab('HISTORY')} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', cursor: 'pointer' }}>
                  <History color={activeStudentTab === 'HISTORY' ? 'var(--accent-gold)' : 'white'} size={20} />
                  <span style={{ fontSize: '0.6rem', color: activeStudentTab === 'HISTORY' ? 'var(--accent-gold)' : 'white', marginTop: '4px' }}>내역 / HISTORY</span>
                </div>
                <div onClick={() => setActiveStudentTab('INFO')} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', cursor: 'pointer' }}>
                  <User color={activeStudentTab === 'INFO' ? 'var(--accent-gold)' : 'white'} size={20} />
                  <span style={{ fontSize: '0.6rem', color: activeStudentTab === 'INFO' ? 'var(--accent-gold)' : 'white', marginTop: '4px' }}>정보 / INFO</span>
                </div>
                <div
                  style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', cursor: 'pointer', color: 'white' }}
                  onClick={handleLogout}
                >
                  <LogOut size={20} />
                  <span style={{ fontSize: '0.7rem', marginTop: '4px' }}>로그아웃 / LOGOUT</span>
                </div>
              </>
            ) : (
              // Instructor view might have its own or none
              <div onClick={handleLogout} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', cursor: 'pointer' }}>
                <LogOut color="white" size={20} />
                <span style={{ fontSize: '0.6rem', color: 'white', marginTop: '4px' }}>로그아웃</span>
              </div>
            )}
          </nav>
        </>
      )}

      {/* Admin Statistics Modal */}
      <StatsModal
        isOpen={showStatsModal}
        onClose={() => setShowStatsModal(false)}
        students={students}
        instructors={instructors}
        courses={courses}
      />
    </div>
  );
};

export default App;
