/*
  # Performance: covering indexes for remaining unindexed foreign keys

  Completes the Supabase performance advisor's "unindexed_foreign_keys"
  recommendation for the pre-existing tables (the new session tables were
  handled in 20260620190000). Each index covers a FK column used in joins,
  cascade deletes and RLS sub-queries. Columns already covered by a unique /
  composite index's leading column are not listed here. Idempotent.
*/

CREATE INDEX IF NOT EXISTS idx_absence_excuses_parent_id ON public.absence_excuses(parent_id);
CREATE INDEX IF NOT EXISTS idx_absence_excuses_reviewed_by ON public.absence_excuses(reviewed_by);
CREATE INDEX IF NOT EXISTS idx_academic_years_school_id ON public.academic_years(school_id);
CREATE INDEX IF NOT EXISTS idx_announcements_author_id ON public.announcements(author_id);
CREATE INDEX IF NOT EXISTS idx_annual_school_plans_approved_by ON public.annual_school_plans(approved_by);
CREATE INDEX IF NOT EXISTS idx_annual_school_plans_created_by ON public.annual_school_plans(created_by);
CREATE INDEX IF NOT EXISTS idx_annual_school_plans_school_id ON public.annual_school_plans(school_id);
CREATE INDEX IF NOT EXISTS idx_attendance_class_id ON public.attendance(class_id);
CREATE INDEX IF NOT EXISTS idx_attendance_recorded_by ON public.attendance(recorded_by);
CREATE INDEX IF NOT EXISTS idx_attendance_subject_id ON public.attendance(subject_id);
CREATE INDEX IF NOT EXISTS idx_behavior_assessments_teacher_id ON public.behavior_assessments(teacher_id);
CREATE INDEX IF NOT EXISTS idx_book_loans_issued_by ON public.book_loans(issued_by);
CREATE INDEX IF NOT EXISTS idx_class_journal_subject_id ON public.class_journal(subject_id);
CREATE INDEX IF NOT EXISTS idx_class_subjects_subject_id ON public.class_subjects(subject_id);
CREATE INDEX IF NOT EXISTS idx_class_subjects_teacher_id ON public.class_subjects(teacher_id);
CREATE INDEX IF NOT EXISTS idx_classes_homeroom_teacher_id ON public.classes(homeroom_teacher_id);
CREATE INDEX IF NOT EXISTS idx_council_meetings_created_by ON public.council_meetings(created_by);
CREATE INDEX IF NOT EXISTS idx_data_breaches_reported_by ON public.data_breaches(reported_by);
CREATE INDEX IF NOT EXISTS idx_data_deletion_requests_requested_by ON public.data_deletion_requests(requested_by);
CREATE INDEX IF NOT EXISTS idx_data_deletion_requests_reviewed_by ON public.data_deletion_requests(reviewed_by);
CREATE INDEX IF NOT EXISTS idx_descriptive_assessments_class_id ON public.descriptive_assessments(class_id);
CREATE INDEX IF NOT EXISTS idx_descriptive_assessments_subject_id ON public.descriptive_assessments(subject_id);
CREATE INDEX IF NOT EXISTS idx_descriptive_assessments_teacher_id ON public.descriptive_assessments(teacher_id);
CREATE INDEX IF NOT EXISTS idx_diagnostic_assessments_academic_year_id ON public.diagnostic_assessments(academic_year_id);
CREATE INDEX IF NOT EXISTS idx_diagnostic_assessments_subject_id ON public.diagnostic_assessments(subject_id);
CREATE INDEX IF NOT EXISTS idx_diagnostic_assessments_teacher_id ON public.diagnostic_assessments(teacher_id);
CREATE INDEX IF NOT EXISTS idx_disciplinary_actions_class_id ON public.disciplinary_actions(class_id);
CREATE INDEX IF NOT EXISTS idx_disciplinary_actions_issued_by ON public.disciplinary_actions(issued_by);
CREATE INDEX IF NOT EXISTS idx_disciplinary_actions_reviewed_by ON public.disciplinary_actions(reviewed_by);
CREATE INDEX IF NOT EXISTS idx_extracurricular_activities_academic_year_id ON public.extracurricular_activities(academic_year_id);
CREATE INDEX IF NOT EXISTS idx_extracurricular_activities_coordinator_id ON public.extracurricular_activities(coordinator_id);
CREATE INDEX IF NOT EXISTS idx_grades_teacher_id ON public.grades(teacher_id);
CREATE INDEX IF NOT EXISTS idx_iep_accommodations_applies_to_subject_id ON public.iep_accommodations(applies_to_subject_id);
CREATE INDEX IF NOT EXISTS idx_incident_reports_reported_by ON public.incident_reports(reported_by);
CREATE INDEX IF NOT EXISTS idx_incident_reports_reviewed_by ON public.incident_reports(reviewed_by);
CREATE INDEX IF NOT EXISTS idx_individual_education_plans_academic_year_id ON public.individual_education_plans(academic_year_id);
CREATE INDEX IF NOT EXISTS idx_individual_education_plans_coordinator_id ON public.individual_education_plans(coordinator_id);
CREATE INDEX IF NOT EXISTS idx_individual_education_plans_created_by ON public.individual_education_plans(created_by);
CREATE INDEX IF NOT EXISTS idx_individual_education_plans_parent_consent_by ON public.individual_education_plans(parent_consent_by);
CREATE INDEX IF NOT EXISTS idx_inspection_recommendations_finding_id ON public.inspection_recommendations(finding_id);
CREATE INDEX IF NOT EXISTS idx_inspection_recommendations_verified_by ON public.inspection_recommendations(verified_by);
CREATE INDEX IF NOT EXISTS idx_meeting_attendance_member_id ON public.meeting_attendance(member_id);
CREATE INDEX IF NOT EXISTS idx_meeting_minutes_approved_by ON public.meeting_minutes(approved_by);
CREATE INDEX IF NOT EXISTS idx_meeting_minutes_recorded_by ON public.meeting_minutes(recorded_by);
CREATE INDEX IF NOT EXISTS idx_national_test_results_recorded_by ON public.national_test_results(recorded_by);
CREATE INDEX IF NOT EXISTS idx_national_test_results_subject_id ON public.national_test_results(subject_id);
CREATE INDEX IF NOT EXISTS idx_national_tests_academic_year_id ON public.national_tests(academic_year_id);
CREATE INDEX IF NOT EXISTS idx_parent_meetings_organized_by ON public.parent_meetings(organized_by);
CREATE INDEX IF NOT EXISTS idx_portfolio_items_added_by ON public.portfolio_items(added_by);
CREATE INDEX IF NOT EXISTS idx_portfolio_items_subject_id ON public.portfolio_items(subject_id);
CREATE INDEX IF NOT EXISTS idx_professional_development_verified_by ON public.professional_development(verified_by);
CREATE INDEX IF NOT EXISTS idx_profiles_managed_locality_id ON public.profiles(managed_locality_id);
CREATE INDEX IF NOT EXISTS idx_report_cards_issued_academic_year_id ON public.report_cards_issued(academic_year_id);
CREATE INDEX IF NOT EXISTS idx_report_cards_issued_issued_by ON public.report_cards_issued(issued_by);
CREATE INDEX IF NOT EXISTS idx_schedule_subject_id ON public.schedule(subject_id);
CREATE INDEX IF NOT EXISTS idx_schedule_teacher_id ON public.schedule(teacher_id);
CREATE INDEX IF NOT EXISTS idx_school_calendar_created_by ON public.school_calendar(created_by);
CREATE INDEX IF NOT EXISTS idx_school_councils_academic_year_id ON public.school_councils(academic_year_id);
CREATE INDEX IF NOT EXISTS idx_school_info_municipality_id ON public.school_info(municipality_id);
CREATE INDEX IF NOT EXISTS idx_self_assessments_class_id ON public.self_assessments(class_id);
CREATE INDEX IF NOT EXISTS idx_self_assessments_subject_id ON public.self_assessments(subject_id);
CREATE INDEX IF NOT EXISTS idx_special_needs_created_by ON public.special_needs(created_by);
CREATE INDEX IF NOT EXISTS idx_student_competency_assessments_assessed_by ON public.student_competency_assessments(assessed_by);
CREATE INDEX IF NOT EXISTS idx_student_competency_assessments_competency_id ON public.student_competency_assessments(competency_id);
CREATE INDEX IF NOT EXISTS idx_student_health_records_updated_by ON public.student_health_records(updated_by);
CREATE INDEX IF NOT EXISTS idx_student_portfolios_academic_year_id ON public.student_portfolios(academic_year_id);
CREATE INDEX IF NOT EXISTS idx_subjects_curricular_area_id ON public.subjects(curricular_area_id);
