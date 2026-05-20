-- Paketa 49: Aktivizim i Realtime për messages dhe announcements
--
-- Konteksti: MessagesPage dhe Header tani përdorin supabase.channel()
-- për të dëgjuar ndryshime në kohë reale. Pa këtë publikim, kanalet
-- nuk marrin asnjë event.

ALTER PUBLICATION supabase_realtime ADD TABLE messages;
ALTER PUBLICATION supabase_realtime ADD TABLE announcements;
