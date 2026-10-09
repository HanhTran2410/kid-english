// Cài đặt và trạng thái nhỏ của app, lưu trong kho `settings` dạng { key, value }.

export const DEFAULT_SETTINGS = {
  characterName: 'Bông',
  voiceURI: null, // null = tự chọn giọng en-US
  readVietnamese: false, // mặc định chỉ đọc tiếng Anh; bố mẹ bật lại được trong Cài đặt
  rate: 0.8,
  recordVoice: true,
  useRecognition: true,
  micOnlyWhenListening: false, // true = tắt mic khi Bông nói (thử nếu tiếng bị rè/nhỏ trên iPhone)
  limitMinutes: 15, // null = tắt giới hạn
  lastBackupAt: null,
  firstUseAt: null,
  samplesSeeded: false,
  lastPromptReviewWords: [],
  lastPromptTopic: '',
  session: null,
};

export const BACKUP_REMIND_DAYS = 7;

export async function loadSettings(db) {
  const rows = await db.getAll('settings');
  const stored = Object.fromEntries(rows.map((r) => [r.key, r.value]));
  return { ...DEFAULT_SETTINGS, ...stored };
}

export async function saveSetting(db, key, value) {
  await db.put('settings', { key, value });
}

/** Đã quá 7 ngày kể từ lần sao lưu gần nhất (chưa sao lưu lần nào thì tính từ lần đầu dùng app). */
export function isBackupDue(settings, now = Date.now()) {
  const since = settings.lastBackupAt ?? settings.firstUseAt;
  if (since == null) return false;
  return now - since > BACKUP_REMIND_DAYS * 24 * 60 * 60 * 1000;
}
