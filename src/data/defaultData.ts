import type {
  AssessmentState,
  DdtkChecklist,
  ElementBank,
  PoseKey,
  PosePhotoItem,
  Predicate,
  SchoolSettings,
  StudentData,
  StudentRecord,
} from '../types/rapor';

export const PREDICATE_LABELS: Record<Predicate, { short: Predicate; full: string }> = {
  BB: { short: 'BB', full: 'Belum Berkembang' },
  MB: { short: 'MB', full: 'Mulai Berkembang' },
  BSH: { short: 'BSH', full: 'Berkembang Sesuai Harapan' },
  BSB: { short: 'BSB', full: 'Berkembang Sangat Baik' },
};

export const DEFAULT_SCHOOL_SETTINGS: SchoolSettings = {
  namaSekolah: 'TK SINAR DUNIA',
  namaYayasan: 'YAYASAN SOERJO ALAM PAKU BUMI',
  namaLembagaKop: 'LEMBAGA PENDIDIKAN TAMAN KANAK–KANAK SINAR DUNIA',
  npsn: '20574906',
  nss: '004052626940',
  alamatCover:
    'Jl. Sembon Durenan RT 01 RW 09 Desa Ngajum Kecamatan Ngajum Kabupaten Malang',
  alamatKop:
    'Jln. Sembon Durenan Rt 01 Rw 09 Ds Ngajum Kec Ngajum Kab Malang 65164',
  cpCover: '083126220193',
  cpKop: '083126220793',
  email: 'Tksinardunia2000@gmail.com',
  tahunAjaran: '2026/2027',
  semester: 'I (Gasal)',
  kotaRapor: 'Malang',
  tanggalRapor: '19 Desember 2026',
  namaGuru: 'Nur Alipah, S.Pd',
  nipGuru: '-',
  namaKoordinatorKokurikuler: '',
  nipKoordinatorKokurikuler: '-',
  namaKepalaSekolah: 'LENI NURLIANAH, S.Pd.AUD',
  nipKepalaSekolah: '-',
  logoDataUrl: null,
};

export const DEFAULT_NARRATIVE_BANK: ElementBank[] = [
  {
    id: 'agama',
    code: 'A',
    title: 'NILAI AGAMA DAN BUDI PEKERTI',
    openingTemplate:
      'Alhamdulillah, pada semester I di kelas B ini, Ananda [Nama] menunjukkan perkembangan dalam mengenal dan menerapkan nilai-nilai agama Islam dalam keseharian.',
    closingTemplate:
      'Pada semester II nanti, guru dan orang tua dapat terus mendampingi Ananda [Nama] untuk menguatkan kebiasaan baik ini, menambah hafalan surat pendek, memperluas pengetahuan keagamaan sesuai usianya, serta mengajak rajin beribadah ke masjid agar semakin dekat dengan Sang Pencipta.',
    indicators: [
      {
        id: 'agama-1',
        label: 'Indikator 1 — Mengenal Tuhan & ciptaan-Nya',
        texts: {
          BB: 'Ananda [Nama] memerlukan bimbingan penuh dari guru untuk mengenal dan menyebutkan nama agama, tempat ibadah, serta contoh ciptaan Tuhan.',
          MB: 'Ananda [Nama] mulai dapat menyebutkan nama agama, tempat ibadah, dan beberapa ciptaan Tuhan dengan bantuan pertanyaan pemantik dari guru.',
          BSH: 'Ananda [Nama] mampu menyebutkan nama agama, tempat ibadah, dan berbagai benda ciptaan Tuhan secara mandiri.',
          BSB: 'Ananda [Nama] mampu menyebutkan nama agama, tempat ibadah, serta menjelaskan dan membedakan benda ciptaan Tuhan dengan buatan manusia secara mandiri dan lancar.',
        },
      },
      {
        id: 'agama-2',
        label: 'Indikator 2 — Mempraktikkan ibadah harian',
        texts: {
          BB: 'Dalam kegiatan ibadah, Ananda [Nama] perlu pendampingan dan ajakan khusus untuk melakukan gerakan wudu serta mengikuti kegiatan salat Duha berjamaah.',
          MB: 'Dalam kegiatan ibadah, Ananda [Nama] mulai mengikuti kegiatan wudu dan salat Duha berjamaah dengan arahan dan contoh dari guru.',
          BSH: 'Saat kegiatan salat Duha berjamaah, Ananda [Nama] mampu berwudu, menyiapkan alat salat dengan sigap, serta mengikuti rangkaian salat secara mandiri.',
          BSB: 'Dalam praktik ibadah, Ananda [Nama] mampu berwudu dengan tertib, bersegera menyiapkan alat salat, dan berani menjadi imam saat salat Duha berjamaah.',
        },
      },
      {
        id: 'agama-3',
        label: 'Indikator 3 — Menghafal doa harian, surat pendek & dasar keislaman',
        texts: {
          BB: 'Pada aspek hafalan, Ananda [Nama] memerlukan bimbingan guru untuk menirukan pelafalan doa harian, surat pendek, dua kalimat syahadat, rukun Islam, dan rukun iman.',
          MB: 'Pada aspek hafalan, Ananda [Nama] mulai dapat melafalkan beberapa doa harian, surat pendek, dan dasar keislaman dengan bimbingan atau sedikit bantuan guru.',
          BSH: 'Dari segi hafalan, Ananda [Nama] mampu melafalkan doa harian (makan, tidur, orang tua), surat pendek (Al-Ikhlas, An-Nas, Al-Falaq, Al-Kautsar), syahadat beserta artinya, serta rukun Islam dan iman secara mandiri.',
          BSB: 'Pada aspek hafalan dan pengetahuan keagamaan, Ananda [Nama] mampu melafalkan seluruh doa harian, surat pendek, dua kalimat syahadat beserta artinya, serta rukun Islam dan iman dengan fasih, lancar, dan penuh percaya diri.',
        },
      },
      {
        id: 'agama-4',
        label: 'Indikator 4 — Perilaku santun & peduli sesama',
        texts: {
          BB: 'Dalam interaksi sehari-hari, Ananda [Nama] perlu diingatkan dan dicontohkan untuk mengucap salam, menunggu giliran, serta berbagi atau menolong teman.',
          MB: 'Dalam pembiasaan perilaku sehari-hari, Ananda [Nama] mulai terbiasa mengucap salam, antre, dan menolong teman apabila diingatkan oleh guru.',
          BSH: 'Dalam bersosialisasi, Ananda [Nama] terbiasa mengucap salam saat masuk dan keluar kelas, sabar menunggu giliran, serta bersedia berbagi dan menolong teman yang membutuhkan.',
          BSB: 'Dalam interaksi sehari-hari, Ananda [Nama] secara konsisten dan atas kesadaran sendiri mengucap salam, tertib menunggu giliran, serta sigap menawarkan bantuan maupun berbagi dengan teman tanpa diminta.',
        },
      },
      {
        id: 'agama-5',
        label: 'Indikator 5 — Menjaga kebersihan, kesehatan & rasa syukur',
        texts: {
          BB: 'Ananda [Nama] memerlukan bantuan dan arahan guru untuk merapikan mainan, membuang sampah pada tempatnya, serta mengucap syukur setelah berkegiatan.',
          MB: 'Ananda [Nama] mulai berpartisipasi membuang sampah, merapikan peralatan bermain, dan mengucap syukur dengan arahan guru.',
          BSH: 'Ananda [Nama] mampu membuang sampah pada tempatnya, merapikan peralatan setelah bermain, dan mengucap syukur secara mandiri.',
          BSB: 'Ananda [Nama] berinisiatif menjaga kebersihan diri dan lingkungan, sigap merapikan peralatan bermain tanpa diminta, serta selalu mengucap syukur di setiap akhir kegiatan.',
        },
      },
      {
        id: 'agama-6',
        label: 'Indikator 6 — Menghargai perbedaan & mengajak teman dalam kebaikan',
        texts: {
          BB: 'Ananda [Nama] memerlukan pendampingan guru untuk memahami perbedaan pendapat dengan teman serta cara mengajak teman berkegiatan bersama.',
          MB: 'Ananda [Nama] mulai belajar menerima perbedaan pendapat teman dan mau mengajak teman bermain atau belajar bersama dengan bimbingan guru.',
          BSH: 'Ananda [Nama] mampu menghargai pendapat teman yang berbeda tanpa memaksakan kehendak, serta mau mengajak teman yang enggan belajar untuk belajar bersama.',
          BSB: 'Ananda [Nama] menunjukkan sikap lapang dada terhadap perbedaan pendapat teman dan berinisiatif mengajak serta menyemangati teman untuk belajar bersama dengan ramah.',
        },
      },
      {
        id: 'agama-7',
        label: 'Indikator 7 — Menyayangi dan merawat lingkungan alam sekitar',
        texts: {
          BB: 'Ananda [Nama] memerlukan ajakan dan contoh dari guru untuk peduli dan ikut merawat tanaman di lingkungan sekolah.',
          MB: 'Ananda [Nama] mulai ikut merawat tanaman di sekitar sekolah saat diajak atau diarahkan oleh guru.',
          BSH: 'Ananda [Nama] mampu merawat lingkungan sekitar dengan cara menyiram tanaman yang tampak layu saat melihatnya.',
          BSB: 'Ananda [Nama] memiliki kepekaan dan inisiatif tinggi untuk merawat alam sekitar, seperti langsung menyiram tanaman yang layu tanpa menunggu arahan guru.',
        },
      },
    ],
    cpList: [
      {
        id: 'agama-cp-1',
        text: 'Anak percaya kepada Tuhan Yang Maha Esa, mulai mengenal dan mempraktikkan ajaran pokok sesuai dengan agama dan kepercayaannya.',
        mappedIndicatorIds: ['agama-1', 'agama-2', 'agama-3'],
      },
      {
        id: 'agama-cp-2',
        text: 'Anak berpartisipasi aktif dalam menjaga kebersihan, kesehatan, dan keselamatan diri sebagai bentuk rasa sayang terhadap dirinya dan rasa syukur kepada Tuhan Yang Maha Esa.',
        mappedIndicatorIds: ['agama-5'],
      },
      {
        id: 'agama-cp-3',
        text: 'Anak menghargai sesama manusia dengan berbagai perbedaannya dan mempraktikkan perilaku baik dan berakhlak mulia.',
        mappedIndicatorIds: ['agama-4', 'agama-6'],
      },
      {
        id: 'agama-cp-4',
        text: 'Anak menghargai alam dengan cara merawatnya dan menunjukkan rasa sayang terhadap makhluk hidup yang merupakan ciptaan Tuhan Yang Maha Esa.',
        mappedIndicatorIds: ['agama-7'],
      },
    ],
  },
  {
    id: 'jatiDiri',
    code: 'B',
    title: 'JATI DIRI',
    openingTemplate:
      'Pada semester I di kelas B ini, Ananda [Nama] menunjukkan perkembangan dalam mengenali diri, mengelola emosi, serta membangun hubungan sosial di lingkungan belajar.',
    closingTemplate:
      'Pada semester II nanti, guru dan orang tua dapat terus mendukung perkembangan Ananda [Nama] dengan memberikan kesempatan aktif berkegiatan fisik di rumah maupun sekolah, serta melibatkan Ananda dalam aktivitas harian yang aman seperti menjemur dan melipat baju guna mengasah kemandirian dan kreativitas.',
    indicators: [
      {
        id: 'jatidiri-1',
        label: 'Indikator 1 — Mengenali & mengelola emosi diri',
        texts: {
          BB: 'Saat bermain, Ananda [Nama] memerlukan pendampingan dan arahan langsung dari guru untuk menenangkan diri serta belajar bergantian saat bermain bersama teman.',
          MB: 'Saat bermain, Ananda [Nama] mulai belajar menahan diri untuk tidak marah atau merebut mainan ketika diingatkan dan didampingi oleh guru.',
          BSH: 'Saat bermain, Ananda [Nama] mampu mengelola emosi diri dengan tetap tenang, sabar bergantian, dan tidak merebut mainan saat bermain bersama teman.',
          BSB: 'Saat bermain, Ananda [Nama] mampu mengelola emosi dengan sangat tenang saat menghadapi situasi yang kurang menyenangkan, serta mau berbagi mainan dan menenangkan teman di sekitarnya.',
        },
      },
      {
        id: 'jatidiri-2',
        label: 'Indikator 2 — Menunjukkan rasa percaya diri',
        texts: {
          BB: 'Dalam hal kepercayaan diri, Ananda [Nama] memerlukan motivasi dan pendampingan khusus dari guru untuk berani tampil atau berbicara di depan teman-temannya.',
          MB: 'Kepercayaan diri Ananda [Nama] mulai tumbuh, terlihat saat mulai berani tampil bernyanyi atau memimpin doa di depan kelas dengan dorongan dan pendampingan guru.',
          BSH: 'Ananda [Nama] memiliki rasa percaya diri yang baik, ditunjukkan dengan keberanian menjadi petugas upacara, bernyanyi, dan memimpin doa di depan teman-teman.',
          BSB: 'Ananda [Nama] menunjukkan rasa percaya diri yang sangat tinggi dan penuh inisiatif untuk tampil menjadi petugas upacara, bernyanyi, serta memimpin doa dengan lantang dan ekspresif.',
        },
      },
      {
        id: 'jatidiri-3',
        label: 'Indikator 3 — Menyesuaikan diri dengan aturan & kedisiplinan',
        texts: {
          BB: 'Dalam pembiasaan aturan, Ananda [Nama] memerlukan pengingat dan bimbingan rutin dari guru untuk mengikuti kesepakatan kelas serta membiasakan kedisiplinan harian.',
          MB: 'Ananda [Nama] mulai memahami kesepakatan kelas dan berupaya hadir tepat waktu serta berseragam rapi dengan arahan guru dan orang tua.',
          BSH: 'Ananda [Nama] mampu menyesuaikan diri dengan lingkungan, ikut menyusun kesepakatan kelas, menaati tata tertib, hadir tepat waktu, dan berseragam rapi sesuai jadwal.',
          BSB: 'Ananda [Nama] secara konsisten dan penuh kesadaran menaati kesepakatan kelas, hadir tepat waktu dengan seragam rapi, serta menjadi teladan kedisiplinan bagi teman-temannya.',
        },
      },
      {
        id: 'jatidiri-4',
        label: 'Indikator 4 — Gerakan motorik kasar',
        texts: {
          BB: 'Pada aspek fisik motorik, Ananda [Nama] memerlukan ajakan dan contoh gerakan secara bertahap dari guru untuk berpartisipasi dalam kegiatan senam pagi dan jalan santai.',
          MB: 'Ananda [Nama] mulai mengikuti gerakan senam pagi dan kegiatan jalan santai bersama teman dengan bimbingan guru.',
          BSH: 'Ananda [Nama] mampu melakukan gerak motorik kasar dengan lincah, seperti mengikuti kegiatan jalan santai dan senam pagi setiap hari dengan penuh semangat.',
          BSB: 'Ananda [Nama] melakukan berbagai gerakan motorik kasar dengan kelenturan, keseimbangan, dan koordinasi tubuh yang sangat baik saat senam pagi maupun kegiatan jalan santai.',
        },
      },
      {
        id: 'jatidiri-5',
        label: 'Indikator 5 — Keterampilan motorik halus',
        texts: {
          BB: 'Untuk keterampilan motorik halus, Ananda [Nama] memerlukan bimbingan langsung dari guru dalam memegang dan menggerakkan gunting dengan posisi jari yang tepat.',
          MB: 'Ananda [Nama] mulai dapat memegang dan menggunakan gunting untuk memotong kertas secara sederhana dengan arahan guru.',
          BSH: 'Ananda [Nama] mampu menggunakan gunting dengan koordinasi mata dan tangan yang baik serta aman saat berkegiatan.',
          BSB: 'Ananda [Nama] terampil menggunakan gunting dengan sangat rapi, presisi mengikuti berbagai bentuk pola, dan penuh ketelitian.',
        },
      },
      {
        id: 'jatidiri-6',
        label: 'Indikator 6 — Kemandirian merawat diri & barang pribadi',
        texts: {
          BB: 'Ananda [Nama] memerlukan bantuan dan panduan langkah demi langkah dari orang dewasa untuk memakai maupun melipat bajunya sendiri.',
          MB: 'Ananda [Nama] mulai berlatih memakai dan melipat bajunya sendiri dengan sedikit bantuan serta arahan dari guru atau orang tua.',
          BSH: 'Ananda [Nama] mampu menunjukkan kemandirian diri dengan memakai dan melipat bajunya sendiri secara tertib.',
          BSB: 'Ananda [Nama] sangat mandiri dan cekatan dalam memakai serta melipat bajunya sendiri dengan rapi tanpa bantuan, bahkan bersedia membantu merapikan perlengkapan di sekitarnya.',
        },
      },
    ],
    cpList: [
      {
        id: 'jatidiri-cp-1',
        text: 'Anak mengenali, mengekspresikan, dan mengelola emosi diri serta membangun hubungan sosial secara sehat.',
        mappedIndicatorIds: ['jatidiri-1'],
      },
      {
        id: 'jatidiri-cp-2',
        text: 'Anak mengenal dan memiliki perilaku positif terhadap diri dan lingkungan (keluarga, sekolah, masyarakat, negara, dan dunia) serta rasa bangga sebagai anak Indonesia yang berlandaskan Pancasila.',
        mappedIndicatorIds: ['jatidiri-2'],
      },
      {
        id: 'jatidiri-cp-3',
        text: 'Anak menyesuaikan diri dengan lingkungan, aturan, dan norma yang berlaku.',
        mappedIndicatorIds: ['jatidiri-3'],
      },
      {
        id: 'jatidiri-cp-4',
        text: 'Anak menggunakan fungsi gerak (motorik kasar, halus, dan taktil) untuk mengeksplorasi dan memanipulasi berbagai objek dan lingkungan sekitar sebagai bentuk pengembangan diri.',
        mappedIndicatorIds: ['jatidiri-4', 'jatidiri-5', 'jatidiri-6'],
      },
    ],
  },
  {
    id: 'literasi',
    code: 'C',
    title:
      'PEMBELAJARAN DASAR-DASAR LITERASI, MATEMATIKA, SAINS, TEKNOLOGI, REKAYASA, DAN SENI',
    openingTemplate:
      'Alhamdulillah, pada semester I di kelas B ini, Ananda [Nama] menunjukkan perkembangan dalam kemampuan literasi dasar, berpikir logis, eksplorasi sains, dan berkarya seni.',
    closingTemplate:
      'Pada semester II nanti, guru akan mengajak Ananda [Nama] melakukan proyek eksplorasi bentuk, ukuran, dan bahan alam untuk melatih berpikir kritis dan kerja sama. Orang tua di rumah dapat mendampingi dengan melibatkan Ananda dalam rutinitas keluarga (membersihkan rumah, memasak, makan bersama), mengamati benda di kebun/pantai/sawah, serta membaca tulisan pada iklan atau rambu jalan untuk memperkaya kosakata.',
    indicators: [
      {
        id: 'literasi-1',
        label: 'Indikator 1 — Memahami informasi & mengomunikasikan gagasan',
        texts: {
          BB: 'Saat diskusi, Ananda [Nama] memerlukan pertanyaan pemantik dan dorongan langsung dari guru untuk merespons diskusi atau mengungkapkan keinginannya.',
          MB: 'Saat diskusi, Ananda [Nama] mulai berani menjawab pertanyaan guru dan menyampaikan pendapat sederhana sesuai topik dengan sedikit bimbingan.',
          BSH: 'Saat kegiatan diskusi dan tanya jawab, Ananda [Nama] mampu memahami informasi, merespons sesuai topik, serta berani mengajukan pertanyaan dan pendapat ketika ingin tahu.',
          BSB: 'Saat kegiatan diskusi dan tanya jawab, Ananda [Nama] aktif berdiskusi dengan kosakata yang kaya, merespons secara relevan, serta kritis mengajukan pertanyaan dan menyampaikan gagasan dengan sangat percaya diri.',
        },
      },
      {
        id: 'literasi-2',
        label: 'Indikator 2 — Minat pramembaca dan pramenulis',
        texts: {
          BB: 'Dalam kegiatan literasi awal, Ananda [Nama] memerlukan ajakan dan pendampingan guru untuk tertarik serta mulai membuat coretan atau gambar sederhana.',
          MB: 'Ananda [Nama] mulai menunjukkan minat pada kegiatan pramembaca dan mengekspresikan ide melalui coretan atau gambar dengan arahan guru.',
          BSH: 'Ananda [Nama] menunjukkan minat dan kegemaran dalam kegiatan pramembaca serta pramenulis melalui coretan dan gambar yang bermakna.',
          BSB: 'Ananda [Nama] sangat antusias dalam kegiatan pramembaca dan pramenulis, menghasilkan gambar yang detail, serta mulai menuliskan simbol huruf/kata untuk menjelaskan gambarnya.',
        },
      },
      {
        id: 'literasi-3',
        label: 'Indikator 3 — Bereksplorasi & berkarya dengan berbagai media/seni',
        texts: {
          BB: 'Dalam berkarya, Ananda [Nama] memerlukan contoh dan bimbingan langkah demi langkah untuk menyusun media menjadi sebuah karya sederhana.',
          MB: 'Ananda [Nama] mulai mampu menyusun berbagai media menjadi karya dan menceritakannya secara singkat dengan bantuan pertanyaan guru.',
          BSH: 'Ananda [Nama] mampu membuat berbagai karya kreatif menggunakan media loose parts (seperti pagar rumah dari stik es krim) dan menceritakannya dengan bahasa yang jelas.',
          BSB: 'Ananda [Nama] mampu merancang dan menciptakan karya yang kompleks dan orisinal dari berbagai media loose parts, serta mempresentasikan proses dan maknanya secara runtut dan ekspresif.',
        },
      },
      {
        id: 'literasi-4',
        label: 'Indikator 4 — Konsep pramatematika dalam kehidupan sehari-hari',
        texts: {
          BB: 'Pada pengenalan konsep pramatematika, Ananda [Nama] memerlukan bimbingan langsung dan alat bantu konkret dari guru untuk mengenal warna, konsep bilangan, serta pengukuran sederhana.',
          MB: 'Ananda [Nama] mulai mampu membedakan warna, melakukan penjumlahan sederhana, dan mencoba kegiatan mengukur atau menimbang dengan arahan guru.',
          BSH: 'Ananda [Nama] mampu menerapkan konsep pramatematika, seperti menyelesaikan penjumlahan sederhana, membaca berat saat menimbang, mengukur dengan langkah dan penggaris, membaca jarum jam, membedakan warna, serta bermain peran penjual dan pembeli.',
          BSB: 'Ananda [Nama] mampu memecahkan berbagai persoalan pramatematika secara mandiri dan akurat—mulai dari berhitung, menimbang, mengukur, membaca waktu, hingga melakukan transaksi sederhana dalam bermain peran jual-beli.',
        },
      },
      {
        id: 'literasi-5',
        label: 'Indikator 5 — Rasa ingin tahu melalui eksperimen sains sederhana',
        texts: {
          BB: 'Dalam kegiatan eksplorasi sains, Ananda [Nama] memerlukan ajakan dan panduan guru untuk mengamati serta menceritakan peristiwa sederhana yang terjadi di sekitarnya.',
          MB: 'Ananda [Nama] mulai tertarik mengikuti percobaan sederhana dan menyebutkan hasil pengamatannya dengan pertanyaan pemantik dari guru.',
          BSH: 'Ananda [Nama] mampu mengamati dan mengungkapkan fenomena yang terjadi saat melakukan eksplorasi sederhana, seperti benda yang dimasukkan ke dalam air dan benda yang dilempar ke atas.',
          BSB: 'Ananda [Nama] menunjukkan rasa ingin tahu yang tinggi, mampu memprediksi, mengamati, serta menjelaskan sebab-akibat sederhana dari percobaan benda di dalam air maupun benda yang dilempar ke atas.',
        },
      },
    ],
    cpList: [
      {
        id: 'literasi-cp-1',
        text: 'Anak mengenali dan memahami berbagai informasi, mengomunikasikan perasaan dan pikiran secara lisan, tulisan, atau menggunakan berbagai media serta membangun percakapan.',
        mappedIndicatorIds: ['literasi-1'],
      },
      {
        id: 'literasi-cp-2',
        text: 'Anak menunjukkan minat, kegemaran, dan berpartisipasi dalam kegiatan pramembaca dan pramenulis.',
        mappedIndicatorIds: ['literasi-2'],
      },
      {
        id: 'literasi-cp-3',
        text: 'Anak mengenali dan menggunakan konsep pramatematika untuk memecahkan masalah di dalam kehidupan sehari-hari.',
        mappedIndicatorIds: ['literasi-4'],
      },
      {
        id: 'literasi-cp-4',
        text: 'Anak menunjukkan kemampuan dasar berpikir kritis, kreatif, dan kolaboratif.',
        mappedIndicatorIds: ['literasi-1', 'literasi-3', 'literasi-5'],
      },
      {
        id: 'literasi-cp-5',
        text: 'Anak menunjukkan rasa ingin tahu melalui observasi, eksplorasi, dan eksperimen dengan menggunakan lingkungan sekitar dan media sebagai sumber belajar untuk mendapatkan gagasan mengenai fenomena alam dan sosial.',
        mappedIndicatorIds: ['literasi-5'],
      },
      {
        id: 'literasi-cp-6',
        text: 'Anak menunjukkan kemampuan awal menggunakan dan merekayasa teknologi serta untuk mencari informasi, gagasan, dan keterampilan secara aman dan bertanggung jawab.',
        mappedIndicatorIds: ['literasi-3'],
      },
      {
        id: 'literasi-cp-7',
        text: 'Anak mengeksplorasi berbagai proses seni, mengekspresikannya serta mengapresiasi karya seni.',
        mappedIndicatorIds: ['literasi-3'],
      },
    ],
  },
];

export const DEFAULT_DDTK_CHECKLIST: DdtkChecklist = {
  lingkarKepala: '50 cm',
  penglihatan: 'Normal (dapat mengenali bentuk, warna, dan objek dengan jelas)',
  pendengaran: 'Normal (merespons panggilan dan instruksi suara dengan baik)',
  motorik: 'Sesuai usia (lincah berlari, melompat, dan memegang alat tulis/gunting)',
  bahasaSosial: 'Sesuai usia (komunikatif, mampu bercerita dan berinteraksi baik)',
  catatanTambahan: '',
};

export function createEmptyPosePhotos(): Record<PoseKey, PosePhotoItem[]> {
  return {
    agama: [],
    jatiDiri: [],
    literasi: [],
    ekskul: [],
    kokurikuler: [],
  };
}

export const DEFAULT_SAMPLE_STUDENT: StudentData = {
  namaLengkap: 'Aisyah Putri Ramadhani',
  namaPanggilan: 'Aisyah',
  nik: '3507024506200001',
  nisnNipd: '0201456789 / 24250101',
  jenisKelamin: 'Perempuan',
  tempatLahir: 'Malang',
  tanggalLahir: '15 Juni 2020',
  agama: 'Islam',
  anakKe: '1 (Satu)',
  namaAyah: 'Ahmad Fauzi',
  namaIbu: 'Siti Aminah',
  noHpOrtu: '081234567890',
  pekerjaanAyah: 'Wiraswasta',
  pekerjaanIbu: 'Ibu Rumah Tangga',
  alamatJalan: 'Jl. Sembon Durenan RT 02 RW 09 Ds. Ngajum',
  kecamatan: 'Ngajum',
  kabupatenKota: 'Malang',
  provinsi: 'Jawa Timur',
  kodePos: '65164',
  fotoAnakDataUrl: null,
  umur: '6 Tahun 5 Bulan',
  kelas: 'B',
  tinggiBadan: '112 cm',
  beratBadan: '19 kg',
};

export const EMPTY_STUDENT: StudentData = {
  namaLengkap: '',
  namaPanggilan: '',
  nik: '',
  nisnNipd: '',
  jenisKelamin: 'Perempuan',
  tempatLahir: '',
  tanggalLahir: '',
  agama: 'Islam',
  anakKe: '',
  namaAyah: '',
  namaIbu: '',
  noHpOrtu: '',
  pekerjaanAyah: '',
  pekerjaanIbu: '',
  alamatJalan: '',
  kecamatan: 'Ngajum',
  kabupatenKota: 'Malang',
  provinsi: 'Jawa Timur',
  kodePos: '65164',
  fotoAnakDataUrl: null,
  umur: '',
  kelas: 'B',
  tinggiBadan: '',
  beratBadan: '',
};

export const DEFAULT_SAMPLE_ASSESSMENT: AssessmentState = {
  indicatorPredicates: {
    'agama-1': 'BSB',
    'agama-2': 'BSH',
    'agama-3': 'BSH',
    'agama-4': 'BSB',
    'agama-5': 'BSH',
    'agama-6': 'BSH',
    'agama-7': 'MB',
    'jatidiri-1': 'BSH',
    'jatidiri-2': 'BSB',
    'jatidiri-3': 'BSH',
    'jatidiri-4': 'BSH',
    'jatidiri-5': 'MB',
    'jatidiri-6': 'BSH',
    'literasi-1': 'BSB',
    'literasi-2': 'BSH',
    'literasi-3': 'BSH',
    'literasi-4': 'BSH',
    'literasi-5': 'MB',
  },
  cpOverrides: {},
  customNarratives: {},
  posePhotos: createEmptyPosePhotos(),
  ekskulText:
    'Pada semester I ini, Ananda Aisyah aktif mengikuti kegiatan ekstrakurikuler mewarnai dan menari tradisional dengan penuh antusias, mampu memadukan warna dengan rapi serta mengikuti irama gerak tari bersama teman-teman.',
  kokurikulerText:
    'Dalam kegiatan kokurikuler Proyek Penguatan Profil Pelajar Pancasila (P5) bertema "Aku Sayang Bumi", Ananda Aisyah turut berpartisipasi menanam bibit tanaman di pot bekas dan belajar merawat lingkungan sekolah.',
  refleksiGuru:
    'Ananda Aisyah menunjukkan perkembangan yang sangat positif selama semester I di kelas B. Semangat belajarnya tinggi, mudah bergaul dengan teman sebaya, dan mulai menunjukkan kemandirian dalam berbagai aktivitas kelas. Terus dampingi dengan pembiasaan baik dan apresiasi di rumah.',
  refleksiOrtu: '',
  ddtkCheck: structuredClone(DEFAULT_DDTK_CHECKLIST),
  deteksiDini:
    'Pertumbuhan tinggi badan (112 cm) dan berat badan (19 kg) sesuai kurva pertumbuhan usia 6 tahun. Daya lihat, daya dengar, serta perkembangan motorik dan bicara berkembang baik tanpa hambatan yang memerlukan rujukan khusus.',
  kehadiran: {
    sakit: '1',
    izin: '1',
    tanpaKeterangan: '0',
  },
  namaOrtuTtd: 'Ahmad Fauzi',
};

export const EMPTY_ASSESSMENT: AssessmentState = {
  indicatorPredicates: {
    'agama-1': 'BSH',
    'agama-2': 'BSH',
    'agama-3': 'BSH',
    'agama-4': 'BSH',
    'agama-5': 'BSH',
    'agama-6': 'BSH',
    'agama-7': 'BSH',
    'jatidiri-1': 'BSH',
    'jatidiri-2': 'BSH',
    'jatidiri-3': 'BSH',
    'jatidiri-4': 'BSH',
    'jatidiri-5': 'BSH',
    'jatidiri-6': 'BSH',
    'literasi-1': 'BSH',
    'literasi-2': 'BSH',
    'literasi-3': 'BSH',
    'literasi-4': 'BSH',
    'literasi-5': 'BSH',
  },
  cpOverrides: {},
  customNarratives: {},
  posePhotos: createEmptyPosePhotos(),
  ekskulText: '',
  kokurikulerText: '',
  refleksiGuru: '',
  refleksiOrtu: '',
  ddtkCheck: {
    lingkarKepala: '',
    penglihatan: 'Normal',
    pendengaran: 'Normal',
    motorik: 'Sesuai tahapan usia',
    bahasaSosial: 'Sesuai tahapan usia',
    catatanTambahan: '',
  },
  deteksiDini: '',
  kehadiran: {
    sakit: '0',
    izin: '0',
    tanpaKeterangan: '0',
  },
  namaOrtuTtd: '',
};

export function createStudentId(): string {
  return `murid-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
}

export function createDefaultSampleRecord(): StudentRecord {
  return {
    id: 'murid-contoh-1',
    updatedAt: new Date().toISOString(),
    student: structuredClone(DEFAULT_SAMPLE_STUDENT),
    assessment: structuredClone(DEFAULT_SAMPLE_ASSESSMENT),
  };
}

export function createEmptyStudentRecord(): StudentRecord {
  return {
    id: createStudentId(),
    updatedAt: new Date().toISOString(),
    student: structuredClone(EMPTY_STUDENT),
    assessment: structuredClone(EMPTY_ASSESSMENT),
  };
}

/**
 * Normalizes legacy assessment payloads (e.g., old JSON exports where posePhotos
 * stored a single string instead of an array of PosePhotoItem).
 */
export function normalizeAssessmentState(raw: unknown): AssessmentState {
  const base = structuredClone(EMPTY_ASSESSMENT);
  if (!raw || typeof raw !== 'object') return base;
  const obj = raw as Record<string, unknown>;

  const rawPosePhotos = (obj.posePhotos || {}) as Record<string, unknown>;
  const rawPoseCaptions = (obj.poseCaptions || {}) as Record<string, unknown>;
  const poseKeys: PoseKey[] = [
    'agama',
    'jatiDiri',
    'literasi',
    'ekskul',
    'kokurikuler',
  ];

  const normalizedPoses = createEmptyPosePhotos();
  for (const key of poseKeys) {
    const val = rawPosePhotos[key];
    if (Array.isArray(val)) {
      normalizedPoses[key] = val
        .filter((item): item is PosePhotoItem => Boolean(item && typeof item === 'object'))
        .map((item, idx) => ({
          id: item.id || `${key}-${idx}-${Date.now()}`,
          dataUrl: typeof item.dataUrl === 'string' ? item.dataUrl : '',
          caption: typeof item.caption === 'string' ? item.caption : '',
        }))
        .filter((item) => item.dataUrl);
    } else if (typeof val === 'string' && val.trim()) {
      normalizedPoses[key] = [
        {
          id: `${key}-migrated-0`,
          dataUrl: val,
          caption:
            typeof rawPoseCaptions[key] === 'string'
              ? (rawPoseCaptions[key] as string)
              : '',
        },
      ];
    }
  }

  return {
    ...base,
    ...(obj as Partial<AssessmentState>),
    posePhotos: normalizedPoses,
    ddtkCheck: {
      ...base.ddtkCheck,
      ...((obj.ddtkCheck as Partial<DdtkChecklist>) || {}),
    },
    kehadiran: {
      ...base.kehadiran,
      ...((obj.kehadiran as AssessmentState['kehadiran']) || {}),
    },
  };
}
