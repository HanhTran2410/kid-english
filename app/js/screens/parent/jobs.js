// Góc bố mẹ → Ảnh Đóng vai (SPEC-jobs.md mục 8): ảnh nền từng nghề (Bán hàng, Bưu tá, Cô giáo nhí, Cảnh sát, Cứu hỏa)
// — copy prompt, chọn / thay / bỏ ảnh; chia sẻ sang máy khác. Ảnh món Bán hàng thay ở Ảnh Cho Bông ăn, ảnh Bác sĩ nhí ở trang riêng.

import { h, toast, copyText } from '../../ui.js';
import { setWordImage, removeWordImage, mediaBlob } from '../../db.js';
import { resizeImage } from '../../image.js';
import { dayKey } from '../../text.js';
import { applyBackup, BackupError } from '../../backup.js';
import { JOBS_BG_IMAGES, JOB_BACKGROUNDS } from '../../jobs/backgrounds.js';
import { parentLayout, goParent, section, notice } from './common.js';
import { imageErrorMessage } from './lessons.js';
import { mediaShareSection } from './media-share.js';

/** Nhận ảnh nền Đóng vai từ file của máy khác (ảnh mới hơn thắng). Dùng chung cho trang này và Quản lý bài. */
export async function acceptJobsPayload(app, payload) {
  const images = payload.images.filter((img) => String(img.lessonId ?? '').startsWith('jobs:'));
  if (images.length) {
    await applyBackup(app.db, { ...payload, lessons: [], images, frameSets: [], recordings: [], progress: [], stickers: [], settings: [] }, 'merge');
  }
  return { images: images.length };
}

export function jobsAdminView(app) {
  const body = parentLayout(app, { title: 'Ảnh Đóng vai', back: () => goParent(app) });
  const reload = () => goParent(app, 'jobs');
  const urls = [];

  app.db.getAllByIndex('images', 'lessonId', JOBS_BG_IMAGES).catch(() => []).then((rows) => {
    const bg = new Map();
    for (const img of rows) {
      const url = URL.createObjectURL(mediaBlob(img));
      urls.push(url);
      bg.set(img.word, url);
    }
    body.append(
      notice('info', 'Các nghề chạy ngay bằng nền vẽ sẵn. Muốn đẹp hơn thì thay ảnh nền từng nghề (copy prompt để nhờ AI vẽ). Nhà, đồ chơi, lửa, bảng… vẫn là hình vẽ của app đặt lên trên ảnh nền, vì màu / số của chúng là đáp án. Ảnh món của Bán hàng thay ở "Ảnh Cho Bông ăn"; Bác sĩ nhí có trang ảnh riêng.'),
      ...JOB_BACKGROUNDS.map((job) => jobSection(job, bg.get(job.id))),
      h('div.actions', {},
        h('button.btn', { type: 'button', text: '🩺 Ảnh Bác sĩ nhí…', onclick: () => goParent(app, 'doctor') }),
        h('button.btn', { type: 'button', text: '🍌 Ảnh Cho Bông ăn (món của Bán hàng)…', onclick: () => goParent(app, 'feed') })),
      mediaShareSection(app, {
        what: 'ảnh Đóng vai',
        intro: 'Gửi ảnh nền các nghề sang máy khác (ảnh nằm trong file). Trên máy kia: Góc bố mẹ → Ảnh Đóng vai → "Nhập từ file" (hoặc Quản lý bài → "Nhập bài từ file").',
        canMake: bg.size > 0,
        backup: { lessonIds: [JOBS_BG_IMAGES], settingsKeys: [], filename: `dong-vai-${dayKey()}.zip` },
        accept: async (payload) => {
          const got = await acceptJobsPayload(app, payload);
          if (!got.images) throw new BackupError('File này không có ảnh Đóng vai.');
          return `Đã nhận ${got.images} ảnh (ảnh mới hơn thay ảnh cũ).`;
        },
        done: reload,
      }),
    );
  });

  function jobSection(job, url) {
    const input = h('input', { type: 'file', accept: 'image/*', hidden: true });
    input.addEventListener('change', async () => {
      const file = input.files?.[0];
      input.value = '';
      if (!file) return;
      try {
        await setWordImage(app.db, { lessonId: JOBS_BG_IMAGES, word: job.id, ...await resizeImage(file) });
        toast(`Đã lưu ảnh nền ${job.vi}.`);
        reload();
      } catch (err) {
        toast(imageErrorMessage(err), 4000);
      }
    });
    return section(`${job.emoji} ${job.vi}`,
      h('div.jb-admin-job', { dataset: { job: job.id } },
        url ? h('img.dr-admin-bg', { src: url, alt: `Ảnh nền ${job.vi}` }) : h('p.muted', { text: 'Đang dùng nền vẽ sẵn.' }),
        h('div.actions', {},
          h('button.btn', { type: 'button', text: 'Copy prompt', onclick: () => copyText(job.prompt).then((ok) => toast(ok ? 'Đã copy prompt.' : 'Không copy được.')) }),
          h('button.btn.primary', { type: 'button', text: url ? 'Thay ảnh nền' : 'Chọn ảnh nền', onclick: () => input.click() }),
          url ? h('button.btn.danger', {
            type: 'button', text: 'Dùng nền vẽ sẵn',
            onclick: async () => {
              await removeWordImage(app.db, JOBS_BG_IMAGES, job.id);
              reload();
            },
          }) : null),
        input));
  }

  return () => urls.forEach((u) => URL.revokeObjectURL(u));
}
