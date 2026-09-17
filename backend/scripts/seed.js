/**
 * Seeds two demo accounts and a varied media library so search, ranking, filters and
 * visibility can be explored without uploading anything.
 *
 *   npm run seed            add demo data (existing demo data is replaced)
 *
 * The media points at Cloudinary's public "demo" cloud, so previews work on any account.
 */
const bcrypt = require('bcryptjs');
const mongoose = require('mongoose');

const DEMO_PASSWORD = 'Demo@1234';
const DAY_MS = 24 * 60 * 60 * 1000;
const CLOUD = 'https://res.cloudinary.com/demo';

const DEMO_USERS = [
  { key: 'demo', name: 'Demo User', email: 'demo@mediavault.dev' },
  { key: 'sam', name: 'Sam Rivera', email: 'sam@mediavault.dev' },
];

const image = (publicId) => ({
  category: 'image',
  mimeType: 'image/jpeg',
  extension: 'jpg',
  storage: {
    resourceType: 'image',
    publicId,
    url: `${CLOUD}/image/upload/${publicId}.jpg`,
    thumbnailUrl: `${CLOUD}/image/upload/c_fill,f_auto,g_auto,h_400,q_auto,w_640/${publicId}.jpg`,
  },
});

const video = (publicId) => ({
  category: 'video',
  mimeType: 'video/mp4',
  extension: 'mp4',
  storage: {
    resourceType: 'video',
    publicId,
    url: `${CLOUD}/video/upload/${publicId}.mp4`,
    thumbnailUrl: `${CLOUD}/video/upload/so_auto,c_fill,h_400,q_auto,w_640/${publicId}.jpg`,
  },
});

const audio = (publicId, extension, mimeType) => ({
  category: 'audio',
  mimeType,
  extension,
  storage: {
    resourceType: 'video',
    publicId,
    url: `${CLOUD}/video/upload/${publicId}.${extension}`,
    thumbnailUrl: `${CLOUD}/video/upload/fl_waveform,co_rgb:7C5CFF,b_transparent,w_640,h_200/${publicId}.png`,
  },
});

const pdf = (publicId, pages) => ({
  category: 'pdf',
  mimeType: 'application/pdf',
  extension: 'pdf',
  storage: {
    resourceType: 'image',
    publicId,
    pages,
    url: `${CLOUD}/image/upload/${publicId}.pdf`,
    thumbnailUrl: `${CLOUD}/image/upload/pg_1,c_fill,g_north,h_400,q_auto,w_640/${publicId}.jpg`,
  },
});

const DEMO_FILES = [
  { owner: 'demo', title: 'Pink flower macro', tags: ['nature', 'flower', 'macro'], description: 'Close-up of a flower in soft morning light.', views: 240, ageDays: 2, size: 120_000, ...image('sample') },
  { owner: 'sam', title: 'Couple at golden hour', tags: ['portrait', 'couple', 'sunset'], description: 'Outdoor portrait shot during sunset.', views: 88, ageDays: 12, size: 310_000, ...image('couple') },
  { owner: 'sam', title: 'Studio portrait', tags: ['portrait', 'studio'], description: 'Clean studio headshot on a light background.', views: 35, ageDays: 40, size: 205_000, ...image('lady') },
  { owner: 'demo', title: 'Sleepy kitten', tags: ['pets', 'cat', 'cute'], description: 'A kitten taking a nap.', views: 410, ageDays: 20, size: 180_000, ...image('kitten') },
  { owner: 'sam', title: 'Happy dog in the park', tags: ['pets', 'dog', 'park'], description: 'Playful dog enjoying a sunny afternoon.', views: 150, ageDays: 5, size: 240_000, ...image('dog') },
  { owner: 'demo', title: 'Mountain lake panorama', tags: ['travel', 'mountains', 'landscape'], description: 'Snowy peaks reflected in a calm lake.', views: 60, ageDays: 1, size: 450_000, ...image('mountain') },
  { owner: 'demo', title: 'Tropical beach', tags: ['travel', 'beach', 'summer'], description: 'Turquoise water and white sand on holiday.', views: 320, ageDays: 30, size: 390_000, ...image('beach') },
  { owner: 'sam', title: 'Spring flowers', tags: ['nature', 'flowers', 'spring'], description: 'A colorful spring bouquet.', views: 12, ageDays: 60, size: 260_000, ...image('flowers') },
  { owner: 'sam', title: 'Fashion models lookbook', tags: ['fashion', 'models'], description: 'Lookbook photo for the new season.', views: 70, ageDays: 18, size: 330_000, ...image('docs/models') },
  { owner: 'sam', title: 'Dog playing fetch', tags: ['pets', 'dog', 'video'], description: 'Short clip of a dog chasing a ball.', views: 520, ageDays: 3, size: 1_900_000, ...video('dog') },
  { owner: 'demo', title: 'Sea turtle swimming', tags: ['ocean', 'wildlife', 'turtle'], description: 'Underwater footage of a sea turtle.', views: 275, ageDays: 8, size: 4_800_000, ...video('sea_turtle') },
  { owner: 'sam', title: 'Elephants at the waterhole', tags: ['wildlife', 'safari', 'africa'], description: 'A herd of elephants drinking at sunset.', views: 190, ageDays: 15, size: 6_200_000, ...video('elephants') },
  { owner: 'demo', title: 'Horses running in snow', tags: ['winter', 'horses', 'wildlife'], description: 'Private draft — slow motion horses in fresh snow.', views: 45, ageDays: 25, size: 5_100_000, visibility: 'private', ...video('snow_horses') },
  { owner: 'demo', title: 'Dog barking sound effect', tags: ['sound-effects', 'dog', 'audio'], description: 'Short MP3 sound clip.', views: 30, ageDays: 6, size: 90_000, ...audio('dog', 'mp3', 'audio/mpeg') },
  { owner: 'demo', title: 'Dog barking WAV master', tags: ['sound-effects', 'dog', 'wav'], description: 'Lossless master of the sound clip.', views: 8, ageDays: 6, size: 2_580_000, visibility: 'private', ...audio('dog', 'wav', 'audio/wav') },
  { owner: 'sam', title: 'Multi-page product brochure', tags: ['document', 'brochure', 'marketing'], description: 'Product brochure with several pages.', views: 95, ageDays: 9, size: 350_000, ...pdf('multi_page_pdf', 3) },
];

async function seedDemoData({ log = console.log } = {}) {
  // Loaded lazily so the environment is configured before models are compiled.
  const { UserModel } = require('../src/models/user.model');
  const { MediaFileModel } = require('../src/models/media-file.model');
  const { RefreshTokenModel } = require('../src/models/refresh-token.model');
  const { FileViewModel } = require('../src/models/file-view.model');
  const { env } = require('../src/config/env');

  const emails = DEMO_USERS.map((user) => user.email);
  const existing = await UserModel.find({ email: { $in: emails } }).select('_id');
  const existingIds = existing.map((user) => user._id);
  if (existingIds.length > 0) {
    await Promise.all([
      MediaFileModel.deleteMany({ owner: { $in: existingIds } }),
      RefreshTokenModel.deleteMany({ user: { $in: existingIds } }),
      FileViewModel.deleteMany({ viewer: { $in: existingIds } }),
      UserModel.deleteMany({ _id: { $in: existingIds } }),
    ]);
  }

  const passwordHash = await bcrypt.hash(DEMO_PASSWORD, env.BCRYPT_ROUNDS);
  const users = {};
  for (const demoUser of DEMO_USERS) {
    users[demoUser.key] = await UserModel.create({ name: demoUser.name, email: demoUser.email, passwordHash });
  }

  const now = Date.now();
  for (const { owner, ageDays, storage, visibility = 'public', ...fields } of DEMO_FILES) {
    const createdAt = new Date(now - ageDays * DAY_MS);
    const document = new MediaFileModel({
      ...fields,
      owner: users[owner]._id,
      visibility,
      originalName: `${storage.publicId.split('/').pop()}.${fields.extension}`,
      storage: { provider: 'cloudinary-demo', ...storage },
    });
    document.createdAt = createdAt;
    document.updatedAt = createdAt;
    await document.save({ timestamps: false });
  }

  log(`Seeded ${DEMO_USERS.length} demo users and ${DEMO_FILES.length} files.`);
  log(`Sign in with ${DEMO_USERS[0].email} / ${DEMO_PASSWORD} (or ${DEMO_USERS[1].email}).`);
}

if (require.main === module) {
  const { connectDatabase } = require('../src/config/database');
  connectDatabase()
    .then(() => seedDemoData())
    .then(() => mongoose.disconnect())
    .catch(async (error) => {
      console.error('Seeding failed:', error.message);
      await mongoose.disconnect();
      process.exit(1);
    });
}

module.exports = { seedDemoData, DEMO_PASSWORD, DEMO_USERS };
