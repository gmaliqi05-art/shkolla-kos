import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../contexts/AuthContext';
import { logAudit } from '../../lib/audit';
import { useToast } from '../../components/ToastProvider';
import { GENDER_LABELS, type Profile, type SchoolInfo, type ReportCardType } from '../../types/database';
import { Loader2, Printer, ArrowLeft, FileCheck, Award, FileDown } from 'lucide-react';
import { generateCertificatePdf } from '../../lib/pdf';

// Certifikatë e klasës 5 / Diplomë e klasës 9 (UA 19/2018)
export default function CertificateView() {
  const { studentId, classId, type: typeStr } = useParams();
  const navigate = useNavigate();
  const { profile } = useAuth();
  const toast = useToast();

  const cardType = (typeStr as ReportCardType) || 'certifikate_klases_5';
  const isDiploma = cardType === 'diplome_klases_9';

  const [loading, setLoading] = useState(true);
  const [school, setSchool] = useState<SchoolInfo | null>(null);
  const [student, setStudent] = useState<Profile | null>(null);
  const [className, setClassName] = useState('');
  const [academicYearName, setAcademicYearName] = useState('');
  const [academicYearId, setAcademicYearId] = useState<string | null>(null);
  const [serial, setSerial] = useState('');
  const [issued, setIssued] = useState(false);
  const [issuing, setIssuing] = useState(false);

  useEffect(() => {
    if (studentId && classId) loadAll();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [studentId, classId, cardType]);

  const loadAll = async () => {
    setLoading(true);
    const [schoolRes, studentRes, classRes] = await Promise.all([
      supabase.from('school_info').select('*').limit(1).maybeSingle(),
      supabase.from('profiles').select('*').eq('id', studentId).maybeSingle(),
      supabase.from('classes').select('id, name, academic_year_id, academic_years(name)').eq('id', classId).maybeSingle(),
    ]);
    setSchool(schoolRes.data);
    setStudent(studentRes.data);
    if (classRes.data) {
      setClassName(classRes.data.name);
      setAcademicYearId(classRes.data.academic_year_id);
      const ay = classRes.data.academic_years as { name?: string } | null;
      setAcademicYearName(ay?.name || '');
    }

    const { data: existing } = await supabase
      .from('report_cards_issued')
      .select('id, serial_number')
      .eq('student_id', studentId)
      .eq('card_type', cardType)
      .is('period', null)
      .maybeSingle();
    if (existing) {
      setIssued(true);
      setSerial(existing.serial_number || '');
    }
    setLoading(false);
  };

  const issue = async () => {
    if (!profile || !studentId || !classId) return;
    setIssuing(true);
    const newSerial = `${(academicYearName || '').replace(/[^0-9]/g, '')}-${isDiploma ? 'DIP' : 'CERT'}-${(student?.personal_number || studentId).slice(-5)}`;
    const { error } = await supabase.from('report_cards_issued').insert({
      student_id: studentId,
      class_id: classId,
      academic_year_id: academicYearId,
      period: null,
      card_type: cardType,
      issued_by: profile.id,
      serial_number: newSerial,
    });
    if (!error) {
      setSerial(newSerial);
      setIssued(true);
      await logAudit({
        actorId: profile.id,
        actorRole: profile.role,
        action: 'create',
        resourceType: 'report_card',
        targetUserId: studentId,
        metadata: { card_type: cardType, serial: newSerial },
      });
    } else if (error.code === '23505') {
      setIssued(true);
    } else {
      toast.error('Gabim: ' + error.message);
    }
    setIssuing(false);
  };

  if (loading) {
    return <div className="flex items-center justify-center h-64"><Loader2 className="w-8 h-8 text-blue-500 animate-spin" /></div>;
  }
  if (!student) {
    return <div className="text-center py-12 text-rose-500">Nxënësi nuk u gjet.</div>;
  }

  const title = isDiploma ? 'DIPLOMË' : 'CERTIFIKATË';
  const bodyLead = isDiploma
    ? 'Certifikohet se nxënësi/ja ka përfunduar me sukses arsimin e mesëm të ulët (klasat 1–9) dhe ka fituar të drejtën për të vazhduar arsimin e mesëm të lartë.'
    : 'Certifikohet se nxënësi/ja ka përfunduar me sukses klasën e pestë (V) të arsimit fillor.';

  const downloadPdf = () => {
    if (!student) return;
    generateCertificatePdf({
      school: {
        name: school?.full_name || school?.name || 'Shkolla',
        municipality: school?.municipality || '',
        address: school?.address || '',
        registrationNumber: school?.registration_number || '',
        directorName: school?.director_name || '',
      },
      title,
      body: bodyLead,
      student: {
        fullName: student.full_name,
        personalNumber: student.personal_number || '',
        dateOfBirth: student.date_of_birth || '',
        placeOfBirth: student.place_of_birth || '',
        gender: student.gender ? GENDER_LABELS[student.gender] : '',
      },
      className,
      academicYear: academicYearName,
      serial,
      issuedDate: new Date().toLocaleDateString('sq-AL'),
    });
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between print:hidden">
        <button onClick={() => navigate('/drejtor/deftesat')} className="inline-flex items-center gap-2 px-3 py-2 text-sm text-slate-700 hover:bg-slate-100 rounded-xl">
          <ArrowLeft className="w-4 h-4" /> Kthehu
        </button>
        <div className="flex gap-2">
          {!issued ? (
            <button onClick={issue} disabled={issuing} className="inline-flex items-center gap-2 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-medium disabled:opacity-50">
              {issuing ? <Loader2 className="w-4 h-4 animate-spin" /> : <FileCheck className="w-4 h-4" />} Lësho Zyrtarisht
            </button>
          ) : (
            <span className="inline-flex items-center gap-2 px-4 py-2 bg-emerald-100 text-emerald-700 rounded-xl font-medium">
              <FileCheck className="w-4 h-4" /> E lëshuar
            </span>
          )}
          <button onClick={downloadPdf} className="inline-flex items-center gap-2 px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white rounded-xl font-medium">
            <FileDown className="w-4 h-4" /> Shkarko PDF
          </button>
          <button onClick={() => window.print()} className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-medium">
            <Printer className="w-4 h-4" /> Printo
          </button>
        </div>
      </div>

      <div id="certificate" className="bg-white rounded-2xl border border-slate-200 p-10 print:border-0 print:rounded-none print:p-0 print:shadow-none">
        <style>{`
          @media print {
            @page { size: A4; margin: 1.5cm; }
            body { background: white; }
            #certificate { box-shadow: none !important; border: 0 !important; padding: 0 !important; }
            .print\\:hidden { display: none !important; }
          }
        `}</style>

        <div className="border-4 border-double border-slate-800 rounded-lg p-8">
          <div className="text-center">
            {school?.logo_url && <img src={school.logo_url} alt="Logo" loading="lazy" className="w-20 h-20 object-contain mx-auto mb-2" />}
            <p className="text-xs text-slate-600">REPUBLIKA E KOSOVËS</p>
            <p className="text-xs text-slate-600">Ministria e Arsimit, Shkencës, Teknologjisë dhe Inovacionit</p>
            <p className="text-xs text-slate-600">Komuna {school?.municipality || '________'}</p>
            <h1 className="text-base font-bold text-slate-900 mt-1">{school?.full_name || school?.name || 'Shkolla'}</h1>
          </div>

          <div className="flex items-center justify-center gap-3 my-8">
            <Award className="w-8 h-8 text-amber-500" />
            <h2 className="text-3xl font-bold tracking-[0.2em] text-slate-900">{title}</h2>
            <Award className="w-8 h-8 text-amber-500" />
          </div>

          <p className="text-center text-slate-700 leading-relaxed max-w-2xl mx-auto">{bodyLead}</p>

          <div className="text-center my-8">
            <p className="text-2xl font-bold text-slate-900">{student.full_name}</p>
            <div className="mt-3 text-sm text-slate-600 space-y-0.5">
              <p>Numri personal: <span className="font-mono">{student.personal_number || '__________'}</span></p>
              <p>I/e lindur më {student.date_of_birth || '__________'} në {student.place_of_birth || '__________'}{student.gender ? ` · ${GENDER_LABELS[student.gender]}` : ''}</p>
              <p>Klasa: {className} · Viti shkollor: {academicYearName || '________'}</p>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-6 mt-12 text-sm">
            <div className="text-left">
              <p className="text-slate-500">Nr. serik: <span className="font-mono text-slate-800">{serial || '____________'}</span></p>
              <p className="text-slate-500 mt-1">Lëshuar më: {new Date().toLocaleDateString('sq-AL')}</p>
              <p className="text-slate-500">Vendi: {school?.municipality || '________'}</p>
            </div>
            <div className="text-center">
              <div className="border-t border-slate-400 pt-2 mt-8">
                <p className="font-semibold text-slate-900">Drejtori/ja i/e Shkollës</p>
                <p className="text-slate-600">{school?.director_name || '________________'}</p>
              </div>
              {school?.stamp_url && <img src={school.stamp_url} alt="Vula" loading="lazy" className="w-20 h-20 mx-auto mt-2 opacity-80" />}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
