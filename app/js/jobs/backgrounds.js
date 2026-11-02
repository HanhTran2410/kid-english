// Ảnh nền thay được của các trò đóng vai nghề (SPEC-jobs.md mục 8): mỗi nghề một ảnh, lưu trong kho ảnh
// `lessonId = 'jobs:bg'`, `word = mã nghề`. Bác sĩ nhí giữ trang ảnh riêng (ảnh đồ + ảnh nền phòng khám, `doctor:`).
// Nhà, đồ chơi, lửa, bảng… vẫn vẽ bằng SVG đè lên ảnh nền (là đáp án nên không thay bằng ảnh).

export const JOBS_BG_IMAGES = 'jobs:bg';

const COMMON = [
  'Pastel colours, simple flat shapes, thick soft outlines, a friendly cartoon style for a toddler game.',
  'No people, no animals, no text. Landscape 4:3.',
].join('\n');

/** Nghề có ảnh nền thay được: mã nghề, tên, prompt (chừa trống đúng chỗ game vẽ đè lên). */
export const JOB_BACKGROUNDS = [
  {
    id: 'shop', emoji: '🛒', vi: 'Bán hàng',
    prompt: `The inside of a small, cheerful corner shop seen from behind the counter: shelves with a few jars on the back wall, a striped awning at the top.\nKeep the middle of the picture plain (a toy animal customer will stand there) and the bottom quarter plain (the game draws the counter).\n${COMMON}`,
  },
  {
    id: 'post', emoji: '📮', vi: 'Bưu tá',
    prompt: `A sunny little street: blue sky with a soft sun and clouds at the top, green grass at the bottom.\nNo houses, no buildings (the game draws a row of houses along the bottom half).\n${COMMON}`,
  },
  {
    id: 'teacher', emoji: '👩‍🏫', vi: 'Cô giáo nhí',
    prompt: `A bright, empty classroom: a wall with a few colourful posters and a window, a wooden floor.\nNo blackboard, no desks in the middle (the game draws the board in the top middle and a student at the bottom left).\n${COMMON}`,
  },
  {
    id: 'police', emoji: '👮', vi: 'Cảnh sát giúp bạn',
    prompt: `A wide, open park: light sky at the top, a big green lawn, maybe a path and a few small trees at the far edges.\nKeep the lawn open and plain (the game places toys and bushes on it).\n${COMMON}`,
  },
  {
    id: 'fire', emoji: '🚒', vi: 'Lính cứu hỏa',
    prompt: `A calm neighbourhood background: light blue sky, a few far-away trees and hills, green grass at the bottom.\nNo houses, no fire, no smoke (the game draws a house or a tree in the middle).\n${COMMON}`,
  },
  // SPEC-jobs3 mục 8: 4 nghề mới.
  {
    id: 'farm', emoji: '👩‍🌾', vi: 'Nông trại',
    prompt: `A sunny farmyard: light blue sky, soft hills far away, a wooden fence along the back, green grass and a little dirt path at the bottom.\nNo barn, no animals, no trees in the middle (the game draws the barn, the hens and an apple tree).\n${COMMON}`,
  },
  {
    id: 'chef', emoji: '👨‍🍳', vi: 'Đầu bếp nhí',
    prompt: `A bright, tidy kitchen wall: pastel tiles, a shelf with a few jars and pots high up, a window with curtains.\nKeep the middle and the bottom half plain (the game draws the table, the oven and the food).\n${COMMON}`,
  },
  {
    id: 'build', emoji: '👷', vi: 'Thợ xây',
    prompt: `An empty, sunny building site: light sky, a few orange traffic cones and a small crane far away at the edges, flat sandy ground.\nKeep the middle plain (the game draws the house plan and the road).\n${COMMON}`,
  },
  {
    id: 'bus', emoji: '🚌', vi: 'Xe buýt',
    prompt: `A quiet town street seen from the side: light sky, small shops and trees far away, a pavement and a grey road along the bottom third.\nNo cars, no bus, no bus stop (the game draws them).\n${COMMON}`,
  },
];
export const JOB_BG_BY_ID = new Map(JOB_BACKGROUNDS.map((j) => [j.id, j]));
