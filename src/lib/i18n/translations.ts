// Translations for the 4 languages used in Kosovo schools
// sq = Shqip (Albanian, default), sr = Srpski (Serbian),
// tr = Türkçe (Turkish), bs = Bosanski (Bosnian)

export type Language = 'sq' | 'sr' | 'tr' | 'bs';

export const LANGUAGES: { code: Language; native: string; flag: string }[] = [
  { code: 'sq', native: 'Shqip', flag: 'AL' },
  { code: 'sr', native: 'Srpski', flag: 'RS' },
  { code: 'tr', native: 'Türkçe', flag: 'TR' },
  { code: 'bs', native: 'Bosanski', flag: 'BA' },
];

export const LANGUAGE_NAMES: Record<Language, string> = {
  sq: 'Shqip',
  sr: 'Srpski',
  tr: 'Türkçe',
  bs: 'Bosanski',
};

// Translation keys organized by section
export const translations = {
  // === COMMON ===
  'common.save': { sq: 'Ruaj', sr: 'Sačuvaj', tr: 'Kaydet', bs: 'Sačuvaj' },
  'common.cancel': { sq: 'Anulo', sr: 'Otkaži', tr: 'İptal', bs: 'Otkaži' },
  'common.delete': { sq: 'Fshi', sr: 'Obriši', tr: 'Sil', bs: 'Obriši' },
  'common.edit': { sq: 'Edito', sr: 'Uredi', tr: 'Düzenle', bs: 'Uredi' },
  'common.add': { sq: 'Shto', sr: 'Dodaj', tr: 'Ekle', bs: 'Dodaj' },
  'common.search': { sq: 'Kërko', sr: 'Pretraži', tr: 'Ara', bs: 'Pretraži' },
  'common.loading': { sq: 'Duke ngarkuar...', sr: 'Učitavanje...', tr: 'Yükleniyor...', bs: 'Učitavanje...' },
  'common.yes': { sq: 'Po', sr: 'Da', tr: 'Evet', bs: 'Da' },
  'common.no': { sq: 'Jo', sr: 'Ne', tr: 'Hayır', bs: 'Ne' },
  'common.confirm': { sq: 'Konfirmo', sr: 'Potvrdi', tr: 'Onayla', bs: 'Potvrdi' },
  'common.close': { sq: 'Mbyll', sr: 'Zatvori', tr: 'Kapat', bs: 'Zatvori' },
  'common.back': { sq: 'Kthehu', sr: 'Nazad', tr: 'Geri', bs: 'Nazad' },
  'common.next': { sq: 'Tjetri', sr: 'Dalje', tr: 'İleri', bs: 'Sljedeći' },
  'common.previous': { sq: 'I mëparshmi', sr: 'Prethodni', tr: 'Önceki', bs: 'Prethodni' },
  'common.required': { sq: 'I detyrueshëm', sr: 'Obavezno', tr: 'Zorunlu', bs: 'Obavezno' },
  'common.optional': { sq: 'Opsionale', sr: 'Opciono', tr: 'İsteğe bağlı', bs: 'Opcionalno' },
  'common.actions': { sq: 'Veprime', sr: 'Akcije', tr: 'İşlemler', bs: 'Akcije' },
  'common.status': { sq: 'Statusi', sr: 'Status', tr: 'Durum', bs: 'Status' },
  'common.date': { sq: 'Data', sr: 'Datum', tr: 'Tarih', bs: 'Datum' },
  'common.time': { sq: 'Ora', sr: 'Vreme', tr: 'Saat', bs: 'Vrijeme' },
  'common.name': { sq: 'Emri', sr: 'Ime', tr: 'İsim', bs: 'Ime' },
  'common.email': { sq: 'Email', sr: 'Email', tr: 'E-posta', bs: 'Email' },
  'common.phone': { sq: 'Telefon', sr: 'Telefon', tr: 'Telefon', bs: 'Telefon' },
  'common.error': { sq: 'Gabim', sr: 'Greška', tr: 'Hata', bs: 'Greška' },
  'common.success': { sq: 'Sukses', sr: 'Uspeh', tr: 'Başarılı', bs: 'Uspjeh' },
  'common.warning': { sq: 'Paralajmërim', sr: 'Upozorenje', tr: 'Uyarı', bs: 'Upozorenje' },
  'common.notes': { sq: 'Shënime', sr: 'Beleške', tr: 'Notlar', bs: 'Bilješke' },
  'common.description': { sq: 'Përshkrimi', sr: 'Opis', tr: 'Açıklama', bs: 'Opis' },
  'common.welcome': { sq: 'Mirë se vini', sr: 'Dobrodošli', tr: 'Hoş geldiniz', bs: 'Dobrodošli' },

  // === LOGIN ===
  'login.title': { sq: 'Shkolla Kos', sr: 'Škola Kos', tr: 'Kos Okulu', bs: 'Škola Kos' },
  'login.subtitle': { sq: 'Sistem menaxhimi shkollor', sr: 'Sistem za upravljanje školom', tr: 'Okul yönetim sistemi', bs: 'Sistem za upravljanje školom' },
  'login.password': { sq: 'Fjalëkalimi', sr: 'Lozinka', tr: 'Parola', bs: 'Lozinka' },
  'login.signin': { sq: 'Hyr', sr: 'Prijavi se', tr: 'Giriş yap', bs: 'Prijavi se' },
  'login.signup': { sq: 'Regjistrohu', sr: 'Registruj se', tr: 'Kayıt ol', bs: 'Registruj se' },
  'login.forgot_password': { sq: 'Keni harruar fjalëkalimin?', sr: 'Zaboravili ste lozinku?', tr: 'Şifrenizi mi unuttunuz?', bs: 'Zaboravili ste lozinku?' },
  'login.no_account': { sq: 'Nuk keni llogari?', sr: 'Nemate nalog?', tr: 'Hesabınız yok mu?', bs: 'Nemate nalog?' },
  'login.demo_account': { sq: 'Ose hyni me një llogari demo', sr: 'Ili se prijavite sa demo nalogom', tr: 'Veya demo hesapla giriş yapın', bs: 'Ili se prijavite sa demo nalogom' },

  // === ROLES ===
  'role.drejtor': { sq: 'Drejtor/e', sr: 'Direktor', tr: 'Müdür', bs: 'Direktor' },
  'role.mesues': { sq: 'Mësues/e', sr: 'Nastavnik', tr: 'Öğretmen', bs: 'Nastavnik' },
  'role.nxenes': { sq: 'Nxënës/e', sr: 'Učenik', tr: 'Öğrenci', bs: 'Učenik' },
  'role.prind': { sq: 'Prind', sr: 'Roditelj', tr: 'Veli', bs: 'Roditelj' },
  'role.pedagog': { sq: 'Pedagog/e', sr: 'Pedagog', tr: 'Pedagog', bs: 'Pedagog' },

  // === NAVIGATION ===
  'nav.dashboard': { sq: 'Paneli Kryesor', sr: 'Glavna tabla', tr: 'Ana panel', bs: 'Glavna tabla' },
  'nav.teachers': { sq: 'Mësuesit', sr: 'Nastavnici', tr: 'Öğretmenler', bs: 'Nastavnici' },
  'nav.students': { sq: 'Nxënësit', sr: 'Učenici', tr: 'Öğrenciler', bs: 'Učenici' },
  'nav.parents': { sq: 'Prindërit', sr: 'Roditelji', tr: 'Veliler', bs: 'Roditelji' },
  'nav.classes': { sq: 'Klasat', sr: 'Razredi', tr: 'Sınıflar', bs: 'Razredi' },
  'nav.subjects': { sq: 'Lëndët', sr: 'Predmeti', tr: 'Dersler', bs: 'Predmeti' },
  'nav.grades': { sq: 'Notat', sr: 'Ocene', tr: 'Notlar', bs: 'Ocjene' },
  'nav.attendance': { sq: 'Frekuentimi', sr: 'Pohađanje', tr: 'Devam', bs: 'Pohađanje' },
  'nav.schedule': { sq: 'Orari', sr: 'Raspored', tr: 'Program', bs: 'Raspored' },
  'nav.messages': { sq: 'Mesazhet', sr: 'Poruke', tr: 'Mesajlar', bs: 'Poruke' },
  'nav.announcements': { sq: 'Njoftimet', sr: 'Obaveštenja', tr: 'Duyurular', bs: 'Obavještenja' },
  'nav.reports': { sq: 'Raportet', sr: 'Izveštaji', tr: 'Raporlar', bs: 'Izvještaji' },
  'nav.behavior': { sq: 'Sjellja', sr: 'Vladanje', tr: 'Davranış', bs: 'Vladanje' },
  'nav.discipline': { sq: 'Disiplina', sr: 'Disciplina', tr: 'Disiplin', bs: 'Disciplina' },
  'nav.iep': { sq: 'NVA & PIA', sr: 'PIO & IOP', tr: 'BEP', bs: 'PIO & IOP' },
  'nav.councils': { sq: 'Organet Shkollore', sr: 'Školska tela', tr: 'Okul kurulları', bs: 'Školska tijela' },
  'nav.activities': { sq: 'Aktivitetet', sr: 'Aktivnosti', tr: 'Faaliyetler', bs: 'Aktivnosti' },
  'nav.meetings': { sq: 'Takimet me Prindër', sr: 'Sastanci sa roditeljima', tr: 'Veli toplantıları', bs: 'Sastanci sa roditeljima' },
  'nav.report_cards': { sq: 'Dëftesat', sr: 'Svedočanstva', tr: 'Karneler', bs: 'Svjedočanstva' },
  'nav.licensing': { sq: 'Licencat', sr: 'Licence', tr: 'Lisanslar', bs: 'Licence' },
  'nav.my_license': { sq: 'Licenca Ime', sr: 'Moja licenca', tr: 'Lisansım', bs: 'Moja licenca' },
  'nav.national_tests': { sq: 'Testet Kombëtare', sr: 'Nacionalni testovi', tr: 'Ulusal testler', bs: 'Nacionalni testovi' },
  'nav.audit_log': { sq: 'Audit Log', sr: 'Dnevnik aktivnosti', tr: 'Denetim kaydı', bs: 'Dnevnik aktivnosti' },
  'nav.deletion_requests': { sq: 'Kërkesat Fshirje', sr: 'Zahtevi za brisanje', tr: 'Silme talepleri', bs: 'Zahtjevi za brisanje' },
  'nav.privacy': { sq: 'Privatësia', sr: 'Privatnost', tr: 'Gizlilik', bs: 'Privatnost' },
  'nav.settings': { sq: 'Cilësimet', sr: 'Podešavanja', tr: 'Ayarlar', bs: 'Postavke' },
  'nav.my_classes': { sq: 'Klasat e Mia', sr: 'Moji razredi', tr: 'Sınıflarım', bs: 'Moji razredi' },
  'nav.enter_grades': { sq: 'Vendos Nota', sr: 'Unesi ocene', tr: 'Not gir', bs: 'Unesi ocjene' },
  'nav.accommodations': { sq: 'Akomodimet', sr: 'Prilagođavanja', tr: 'Düzenlemeler', bs: 'Prilagođavanja' },
  'nav.my_councils': { sq: 'Këshillat e Mi', sr: 'Moja veća', tr: 'Konseyim', bs: 'Moja vijeća' },
  'nav.my_grades': { sq: 'Notat e Mia', sr: 'Moje ocene', tr: 'Notlarım', bs: 'Moje ocjene' },
  'nav.my_schedule': { sq: 'Orari Im', sr: 'Moj raspored', tr: 'Programım', bs: 'Moj raspored' },
  'nav.child_iep': { sq: 'PIA i Fëmijës', sr: 'IOP deteta', tr: 'Çocuğun BEP', bs: 'IOP djeteta' },

  // === DASHBOARD ===
  'dashboard.welcome': { sq: 'Mirë se vini', sr: 'Dobrodošli', tr: 'Hoş geldiniz', bs: 'Dobrodošli' },

  // === GRADES ===
  'grade.1': { sq: 'Pamjaftueshme', sr: 'Nedovoljan', tr: 'Yetersiz', bs: 'Nedovoljan' },
  'grade.2': { sq: 'Mjaftueshme', sr: 'Dovoljan', tr: 'Yeterli', bs: 'Dovoljan' },
  'grade.3': { sq: 'Mirë', sr: 'Dobar', tr: 'İyi', bs: 'Dobar' },
  'grade.4': { sq: 'Shumë Mirë', sr: 'Vrlo dobar', tr: 'Çok iyi', bs: 'Vrlo dobar' },
  'grade.5': { sq: 'Shkëlqyeshëm', sr: 'Odličan', tr: 'Mükemmel', bs: 'Odličan' },

  // === PERIODS ===
  'period.1': { sq: 'Periudha e Parë', sr: 'Prvi period', tr: 'Birinci dönem', bs: 'Prvi period' },
  'period.2': { sq: 'Periudha e Dytë', sr: 'Drugi period', tr: 'İkinci dönem', bs: 'Drugi period' },
  'period.3': { sq: 'Periudha e Tretë', sr: 'Treći period', tr: 'Üçüncü dönem', bs: 'Treći period' },

  // === ATTENDANCE ===
  'attendance.prezent': { sq: 'Prezent', sr: 'Prisutan', tr: 'Mevcut', bs: 'Prisutan' },
  'attendance.mungon': { sq: 'Mungon', sr: 'Odsutan', tr: 'Devamsız', bs: 'Odsutan' },
  'attendance.vonese': { sq: 'Vonesë', sr: 'Kasni', tr: 'Geç', bs: 'Kasni' },
  'attendance.arsyeshme': { sq: 'Arsyeshme', sr: 'Opravdano', tr: 'Mazeretli', bs: 'Opravdano' },

  // === DAYS ===
  'day.1': { sq: 'E Hënë', sr: 'Ponedeljak', tr: 'Pazartesi', bs: 'Ponedjeljak' },
  'day.2': { sq: 'E Martë', sr: 'Utorak', tr: 'Salı', bs: 'Utorak' },
  'day.3': { sq: 'E Mërkurë', sr: 'Sreda', tr: 'Çarşamba', bs: 'Srijeda' },
  'day.4': { sq: 'E Enjte', sr: 'Četvrtak', tr: 'Perşembe', bs: 'Četvrtak' },
  'day.5': { sq: 'E Premte', sr: 'Petak', tr: 'Cuma', bs: 'Petak' },

  // === SETTINGS ===
  'settings.language': { sq: 'Gjuha', sr: 'Jezik', tr: 'Dil', bs: 'Jezik' },
  'settings.language_changed': { sq: 'Gjuha u ndryshua', sr: 'Jezik je promenjen', tr: 'Dil değiştirildi', bs: 'Jezik je promijenjen' },
  'settings.logout': { sq: 'Dilni', sr: 'Odjavi se', tr: 'Çıkış yap', bs: 'Odjavi se' },
  'settings.profile': { sq: 'Profili', sr: 'Profil', tr: 'Profil', bs: 'Profil' },
} as const;

export type TranslationKey = keyof typeof translations;
