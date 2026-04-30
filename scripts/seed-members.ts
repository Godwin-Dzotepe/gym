import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

// Plan ID map
const PLAN = {
  '2weeks':   'cmogvcjv3000312uisnaidud3',
  '1 month':  'plan-basic',
  '3 months': 'plan-trial',
  '6 months': 'cmogvahlw000212uid7rvejpr',
  'Student':  'plan-student',
  'Couple':   'cmoguv65i000012ui8zwjngqe',
  'Seniors':  'cmogv0e42000112uije2edce0',
} as Record<string, string>;

// Raw member data: [fullName, email|null, phone|null, plan|null, status]
// status: 'ACTIVE' | 'CANCELLED' | 'FROZEN'
const MEMBERS: [string, string | null, string | null, string | null, string][] = [
  // ── PDF 1: ACTIVE ──────────────────────────────────────────────
  // Block 1
  ['Emmanuel Dankyi',      'ed@turdemoji.lol',              '0504972569', '3 months', 'ACTIVE'],
  ['Otu Michael',          'milceotu8@gmail.com',           '0500007090', '3 months', 'ACTIVE'],
  ['Prozy Promise',        'itzprozzy@gmail.com',           '0538112026', '2weeks',   'ACTIVE'],
  ['Asante Richard',       'higherfly95@gmail.com',         '0506771007', '2weeks',   'ACTIVE'],
  ['Clement Torsu',        'cdodzi@gmail.com',              '0201694695', '3 months', 'ACTIVE'],
  ['Lynne Anguah',         'kynkyngya@gmail.com',           null,         '2weeks',   'ACTIVE'],
  ['Kojo Archurst',        'arkhurse3@icloud.com',          '0552505710', '3 months', 'ACTIVE'],
  ['Michelle Dekker',      'michelledekker48@yahoo.com',    '0553647408', '2weeks',   'ACTIVE'],
  ['Gilbart Morris',       null,                            '0542629256', '1 month',  'ACTIVE'],
  ['Patrick Nzuzi',        'nzuzipatrick@outhook.com',      '0548871640', '2weeks',   'ACTIVE'],
  ['Kelvin Offei',         'stevepatch1628@gmail.com',      '0245028814', '1 month',  'ACTIVE'],
  ['Kennet Addo',          null,                            '0244995077', 'Couple',   'ACTIVE'],
  ['Esther Agyekymwaa',    'agyekumwaaesther8@gmail.com',   '0534417156', 'Student',  'ACTIVE'],
  ['Kukua Afful',          'missaffulgh@gmail.com',         '0203142087', '1 month',  'ACTIVE'],
  ['Yvonne Asare',         'yvobaby28@gmail.com',           '0208379381', '2weeks',   'ACTIVE'],
  ['Isaac Jackson',        'dainegyy44@gmail.com',          '0554765220', 'Student',  'ACTIVE'],
  ['Francis Nana Yaw',     'taflightingt@gmail.com',        '0500069045', '2weeks',   'ACTIVE'],
  // Block 2
  ['Agnes Oforiwaa',       null,                            '0596579297', '2weeks',   'ACTIVE'],
  ['Malik Abdul',          null,                            '0540735203', '2weeks',   'ACTIVE'],
  ['Owura Apraku',         'under.dogg911@gmail.com',       '0533400901', '3 months', 'ACTIVE'],
  ['Gabriel Baush',        null,                            '0244803611', '1 month',  'ACTIVE'],
  ['Akua Fosuhemaa',       'akuamfum15@gmail.com',          '0542376853', '3 months', 'ACTIVE'],
  ['Braadrict Samuelson',  'braadricti@gmail.com',          '0595850949', '1 month',  'ACTIVE'],
  ['Alex Solomon',         'babaollex@gmail.com',           '0246123333', '1 month',  'ACTIVE'],
  ['Clara Benson',         'aduertithms@gmail.com',         '0591511603', '2weeks',   'ACTIVE'],
  ['Perfect Afenyo',       null,                            '0557622534', '1 month',  'ACTIVE'],
  ['Mrs Gigi',             'georgina176@yahoo.com',         '0505323188', 'Student',  'ACTIVE'],
  ['Lewis Kwaku Duah',     'nanakwaku2@yahoo.com',          '0208433918', '3 months', 'ACTIVE'],
  ['George Kyri Baffore',  null,                            '0542357758', '3 months', 'ACTIVE'],
  ['Opoku Mensah',         'ericopkumensah10@gmail.com',    '0243604199', 'Couple',   'ACTIVE'],
  ['Abigail Mensah',       null,                            null,         null,        'ACTIVE'],
  ['Katau Addapuay',       null,                            '0247252527', '2weeks',   'ACTIVE'],
  ['Debrah Aikins',        'debbie.aikins@gmail.com',       '0249829605', '1 month',  'ACTIVE'],
  ['Erica Boatemah',       'asareericaboatemah@yahoo.com',  '0242974408', '1 month',  'ACTIVE'],
  ['Zakaria Ibrahim',      'ibrahimlogan69@gmail.com',      '0509898851', 'Student',  'ACTIVE'],
  ['Zachariah Idiku',      null,                            '0537564163', 'Student',  'ACTIVE'],
  // Block 3
  ['Zaniyyah Idiku',       'zaniyyahidiku@gmail.com',       '0537564163', 'Student',  'ACTIVE'],
  ['Cassie Nartes',        'ceebaby254@gmail.com',          '0556376734', '2weeks',   'ACTIVE'],
  ['Peter Quist',          null,                            '0509046410', 'Seniors',  'ACTIVE'],
  ['Raka Sanusi',          'rsanusi@yahoo.com',             '0244824006', 'Seniors',  'ACTIVE'],
  ['Sigismond Segbefia',   'sigismond2g7@yahoo.com',        '0544343909', '1 month',  'ACTIVE'],
  ['Daniel Nuku Kone',     null,                            '0247974169', 'Couple',   'ACTIVE'],
  ['Aiden Aanan',          null,                            '0544332254', '3 months', 'ACTIVE'],
  ['Maame Ama',            'ogbormor@gmail.com',            '0202405960', '2weeks',   'ACTIVE'],
  ['Abena Darlebea',       'abenadarlebea@gmail.com',       '0240313055', 'Student',  'ACTIVE'],
  ['Richmond Koduah',      'richmondkoduah@gmail.com',      '0243571405', '2weeks',   'ACTIVE'],
  ['Dramani Payida',       null,                            null,         '1 month',  'ACTIVE'],
  ['Emmanuel Qwaahie',     null,                            '0505360804', '2weeks',   'ACTIVE'],
  ['Bright Ackah',         null,                            '0248739843', 'Student',  'ACTIVE'],
  ['Derrick Boateng',      'ofosuheneboat@gmail.com',       '0241553613', 'Student',  'ACTIVE'],
  ['Kafui Emmanuel',       'kaffresh@gmail.com',            '0555501745', null,        'ACTIVE'],
  ['Sylvia Kafui',         'sylviasos0025@gmail.com',       '0556884617', null,        'ACTIVE'],
  ['Naphisa Yaqub Issah',  null,                            '0244822345', 'Seniors',  'ACTIVE'],
  ['Francis Adanku',       null,                            '0540863500', null,        'ACTIVE'],
  ['Yaw Akyampong',        null,                            '0536582349', 'Student',  'ACTIVE'],
  ['Major Bonsu',          null,                            '0264323521', 'Seniors',  'ACTIVE'],
  // Block 4
  ['Pricilla Kosiedu',     'kofieduprisey123@gmail.com',    '0240744969', '1 month',  'ACTIVE'],
  ['Makafui Ayimey',       'makayimey@gmail.com',           '0202343434', '1 month',  'ACTIVE'],
  ['Selorm Ayimey',        'selormesioklu@gmail.com',       '0505094429', '1 month',  'ACTIVE'],
  ['Dela Ziga',            'haveviwo@gmail.com',            '0537541689', null,        'ACTIVE'],
  ['Benedicta Aseidua',    'kyeibenedicta5@gmail.com',      '0548205000', 'Student',  'ACTIVE'],
  ['Karo Jigbale',         'karojigbale@gmail.com',         '0531407365', null,        'ACTIVE'],
  ['Joy Quashie',          'nanaivy0@gmail.com',            '0500095485', null,        'ACTIVE'],
  ['Toufic Abdulai',       'touficco@yahoo.co.uk',          '0544772808', '1 month',  'ACTIVE'],
  ['Jacith Ama Tamaklo',   'lady.jash220@gmail.com',        '0548884600', '1 month',  'ACTIVE'],
  ['Richmond Kwesi Mensah', null,                           '0202665472', null,        'ACTIVE'],
  ['Kofi Sarpong',         'kofisarpong555@gmail.com',      '0271006598', '1 month',  'ACTIVE'],
  ['Noble Takpah',         'razaknoble622@gmail.com',       '0556612781', null,        'ACTIVE'],
  ['Kwane Ansah',          'ransah713@gmail.com',           '0552775976', '1 month',  'ACTIVE'],
  ['Juliet Bawuah',        'jukency@yahoo.com',             '0244178811', '1 month',  'ACTIVE'],
  ['Mayokun Iyantan',      'mayokuniyt@gmail.com',          '0535789192', 'Student',  'ACTIVE'],
  ['Antwi Adjei John',     'adjei@yahoo.com',               '0550548401', 'Couple',   'ACTIVE'],
  ['Appiah Kusi',          'uncleosei007@hotmail.com',      '0244861503', 'Couple',   'ACTIVE'],
  ['Ramatu Tanko',         'shantellmirraj19@gmail.com',    '0208669598', 'Student',  'ACTIVE'],
  ['Nana Akua',            'llartey27@yahoo.com',           '0553939065', '1 month',  'ACTIVE'],
  // Block 5
  ['Benedicta Attah',      null,                            '0543586214', '1 month',  'ACTIVE'],
  ['Winifred Pepple',      'winifredpepple@gmail.com',      '0550428972', '1 month',  'ACTIVE'],
  ['Osama',                null,                            '0557724896', '1 month',  'ACTIVE'],
  ['Adjo Appiah',          'adjo.appiah@gmail.com',         '0267102420', '1 month',  'ACTIVE'],
  ['Nathan Britton Musah', 'stydee@gmail.com',              '0506735342', null,        'ACTIVE'],
  ['Bright Katey',         null,                            '0241824998', '1 month',  'ACTIVE'],
  ['Ama Kessewah',         'kessyama@yahoo.com',            '0546434599', null,        'ACTIVE'],
  ['Darko Sarkwa',         'hubert.dsarkwa@gmail.com',      '0244896260', 'Seniors',  'ACTIVE'],
  ['Akosua Yeboah',        'akosua97@hotmail.com',          '0208145410', null,        'ACTIVE'],
  ['George Afriyie Osei',  'geoofriyie@hotmail.com',        '0263279072', null,        'ACTIVE'],
  ['Asante Agyei Boakye',  'agyeiboakyeasante@gmail.com',   '0549849150', 'Student',  'ACTIVE'],
  ['Jacqueline Eruaeds',   'jaxeduardo273@gmail.com',       '0240630228', 'Seniors',  'ACTIVE'],
  ['Josiah Gyampoh',       'gyampojosia@gmail.com',         '0507356221', 'Student',  'ACTIVE'],
  ['Gideon Appiah',        'papagorgi@yahoo.com',           '0244746822', '6 months', 'ACTIVE'],
  ['Kenneth Blankson',     'kennethblankson@yahoo.com',     '0202056455', '1 month',  'ACTIVE'],
  ['Narko Christal',       'crystalnyarko@yahoo.com',       null,         null,        'ACTIVE'],
  ['Mary Larbi',           null,                            '0248516766', null,        'ACTIVE'],
  ['Fatima Peregrino',     null,                            '0559874174', 'Student',  'ACTIVE'],
  ['Gideon Amoh Yamoah',   'gideonamohyamoah@gmail.com',   '0542672836', 'Student',  'ACTIVE'],
  ['Mery Larby',           null,                            null,         null,        'ACTIVE'],
  ['Hope Morgan',          'morganarahghana@gmail.com',     '0539688234', 'Couple',   'ACTIVE'],
  // Block 6
  ['Benaiah Uche',         null,                            '0209154964', '1 month',  'ACTIVE'],
  ['Timothy',              'timothythatchroot@gmail.com',   '0243425013', null,        'ACTIVE'],
  ['Richlove Akwetey',     'hillythilda@gmail.com',         '0205820485', '1 month',  'ACTIVE'],
  ['Abeiku Painstil',      'abeikupaintsil300@gmail.com',   '0554123241', 'Student',  'ACTIVE'],
  ['Michael Alorbu',       'alorbuu@gmail.com',             '0506114033', 'Couple',   'ACTIVE'],
  ['Joseph Boateng',       'shockerpicss@gmail.com',        '0249160633', null,        'ACTIVE'],
  ['Bassit Abdul',         'basherti102@gmail.com',         '0542608864', null,        'ACTIVE'],
  ['Adetokunbo Odumuyiwa', null,                            '0545029328', null,        'ACTIVE'],
  ['Barbara Adoley',       'bbarbara339@gmail.com',         '0547823652', null,        'ACTIVE'],
  ['Harry Dansu',          null,                            '0553134447', null,        'ACTIVE'],
  ['Derrick Richfield',    null,                            null,         'Student',  'ACTIVE'],
  ['Nana Ana Yeboah',      'ayeboah492@gmail.com',          '0547464245', null,        'ACTIVE'],
  ['Dillys Yeboah',        null,                            '0556196702', null,        'ACTIVE'],
  ['Derik Abrefa',         null,                            '0556377071', null,        'ACTIVE'],
  ['Priscilla Ahiaible',   'senafafali@gmail.com',          '0559179942', null,        'ACTIVE'],
  ['Gabriel Menlah',       null,                            '0554780503', null,        'ACTIVE'],
  ['Joyce Amos',           null,                            '0240443034', null,        'ACTIVE'],
  ['Jennifer Boachie',     'jennyasamah@gmail.com',         '0247740523', null,        'ACTIVE'],
  ['Otis Kwame Kye Qwaicoi', 'quaicoe83@gmail.com',         '0201313404', null,       'ACTIVE'],
  ['Lydia Osei',           'lee3jay3@yahoo.com',            '0558365628', null,        'ACTIVE'],
  ['Josephine Osei',       null,                            '0548952669', null,        'ACTIVE'],
  ['Michael Plange',       null,                            '0242051598', null,        'ACTIVE'],
  // Block 7
  ['Thomas Osei',          'thomas@pslafrica.com',          '0508982895', null,        'ACTIVE'],
  ['Mohamed',              null,                            '0592525653', null,        'ACTIVE'],
  ['Nana Afari',           null,                            '0243300000', null,        'ACTIVE'],
  ['Yaw Adum',             null,                            '0244979945', null,        'ACTIVE'],
  ['Nadia Kage',           null,                            '0551823487', '3 months', 'ACTIVE'],
  ['Martin Semordri',      null,                            '0599653964', null,        'ACTIVE'],
  ['Kelly Semordri',       null,                            null,         null,        'ACTIVE'],
  ['Hornam Alorbu',        null,                            '0530543130', null,        'ACTIVE'],
  ['Sumaila Amadu',        'barblady@gmail.com',            '0405591603', null,        'ACTIVE'],
  ['Patience Anyah',       null,                            '0553818725', null,        'ACTIVE'],
  ['Sumaila Fuseini',      null,                            '0503284716', null,        'ACTIVE'],
  ['Richard Kwame Boahene', 'richardboss16@gmail.com',      '0246354580', null,        'ACTIVE'],
  ['Julius Ogheneovo',     null,                            '0592337765', '6 months', 'ACTIVE'],
  ['Kelvin Orjaiko',       'preciousorjaikoi@gmail.com',    '0593754934', '2weeks',   'ACTIVE'],
  ['Kelvin Sabbah',        'ksweaux060@gmail.com',          '0557130074', null,        'ACTIVE'],
  ['Albet Achampong',      'albetachampong55@yahoo.com',    '0245225017', null,        'ACTIVE'],
  ['Mary Bluawofoabe',     'marybluawofogbel@gmail.com',    '0555181595', '1 month',  'ACTIVE'],
  ['Selase Patrick',       'patrickhypekhid@gmail.com',     '0594551354', null,        'ACTIVE'],
  ['Gbetroh Senyo Taj',    'senyogbetroh@gmail.com',        '0555113573', null,        'ACTIVE'],
  ['Elaine Williams',      null,                            '0595262865', null,        'ACTIVE'],
  ['Grace Yaa Asamoah',    'qraayasamoah@gmail.com',        '0245783319', null,        'ACTIVE'],
  ['Kwame Bama',           'kwamebaafi@gmail.com',          '0503910563', null,        'ACTIVE'],
  // Block 8
  ['Edah Chemet',          null,                            '0259866741', '3 months', 'ACTIVE'],
  ['Seth Dekomwine',       'sethsangberdery@gmail.com',     '0507969245', '1 month',  'ACTIVE'],
  ['Richmond Amakye',      'amakysrichmond1@gmail.com',     '0543425591', null,        'ACTIVE'],
  ['Acquah David',         'acquahdavid010@gmail.com',      '0248392413', null,        'ACTIVE'],
  ['Sowah Maher',          'hashbazsowah12@gmail.com',      '0540330532', null,        'ACTIVE'],
  ['Maddy Reginald',       null,                            '0203910109', null,        'ACTIVE'],
  ['Adepa Boadi',          null,                            '0559032514', null,        'ACTIVE'],
  ['Akosua Frimpomaa',     'fakisya227@gmail.com',          '0554912401', null,        'ACTIVE'],
  ['Delman Graham',        null,                            '0557413423', null,        'ACTIVE'],
  ['Alice T',              'yoliswatwum@gmail.com',         '0503890348', null,        'ACTIVE'],
  ['Dennis William',       null,                            '0556143545', '3 months', 'ACTIVE'],
  ['Yayra',                'yayradenutsi@gmail.com',        '0248784839', null,        'ACTIVE'],
  ['Mavis Ahihao',         'kingdommesinam@gmail.com',      '0543657711', null,        'ACTIVE'],
  ['Olivia Asante',        null,                            '0243803588', null,        'ACTIVE'],
  ['Angela Dadzie',        'angielariba@gmail.com',         '0249608499', null,        'ACTIVE'],
  ['Ade Ola',              null,                            '0534966456', null,        'ACTIVE'],
  ['Beatrice Brenu',       null,                            null,         '3 months', 'ACTIVE'],
  ['Adams Brimah',         null,                            '0243743575', null,        'ACTIVE'],
  ['Lodo Monica',          null,                            '0557673145', null,        'ACTIVE'],
  ['Margeret Adjoke',      'adjokemay@gmail.com',           '0541231118', null,        'ACTIVE'],
  ['Thomas Agyekum',       'takyeremeh@gmail.com',          '0247838202', '1 month',  'ACTIVE'],
  // Block 9
  ['Tetteh Felicia',       null,                            null,         '3 months', 'ACTIVE'],
  ['Ella Greyy',           null,                            '0537755611', null,        'ACTIVE'],
  ['Veronica Adu',         'adumiuenua@gmail.com',          '0552168487', '3 months', 'ACTIVE'],
  ['Pearl Blankson',       null,                            '0545237733', null,        'ACTIVE'],
  ['Richmond Daniel',      'danyrich.dr@gmail.com',         '0240450999', null,        'ACTIVE'],
  ['Gyamfi Josephine',     'gyamfijosephine60@gmail.com',   '0545526610', null,        'ACTIVE'],
  ['Kwame Ofori',          null,                            '0248851017', null,        'ACTIVE'],
  ['Yevu Selasi',          'yevujeromea2@gmail.com',        '0599485782', null,        'ACTIVE'],
  ['Michael Van',          'vanmike22@gmail.com',           '0597009609', null,        'ACTIVE'],
  ['Jemima Fateny',        'jemmyfent94@yahoo.com',         '0548449492', null,        'ACTIVE'],
  ['Michael Owusu',        'omicky83@gmail.com',            '0557612352', null,        'ACTIVE'],
  ['Matilda Tettey',       'akumatida5@gmail.com',          '0240475487', 'Student',  'ACTIVE'],
  ['Princess Brobbet',     'prinkabrob@gmail.com',          '0547752341', '3 months', 'ACTIVE'],
  ['Rejoice Kokor',        'rejoiceamanoetey21@gmail.com',  '0551062068', null,        'ACTIVE'],
  ['Christabel Ofosuhene', null,                            '0505492110', 'Student',  'ACTIVE'],
  ['Margaret Titey',       null,                            '0593828226', null,        'ACTIVE'],
  ['Dzemkle Divine',       'divinedzemkle@gmail.com',       '0550993239', null,        'ACTIVE'],
  ['Mr And Mrs Lams',      'lamsnwizu@gmail.com',           '0532324678', null,        'ACTIVE'],
  ['Amanortey Rejoyce',    'rehoyceabnorrey21@gmail.com',   null,         null,        'ACTIVE'],
  ['Ida Tracy Tagos',      null,                            '0548711400', null,        'ACTIVE'],
  ['Caroline Edwards',     null,                            '0241140216', null,        'ACTIVE'],
  ['Dennis Ofori',         'oforidennise603@gmail.com',     '0209151348', null,        'ACTIVE'],
  // Block 10
  ['Juliet Akakpo',        null,                            '0548266334', null,        'ACTIVE'],
  ['Jude Aulker',          null,                            '0244515893', null,        'ACTIVE'],
  ['Ralph Ayeh',           null,                            '0249475654', null,        'ACTIVE'],
  ['Sievers Brobby',       'henryllyog@gmail.com',          '0544828464', null,        'ACTIVE'],
  ['Iddrisu Isaah',        'alee003@gmail.com',             '0557065510', '3 months', 'ACTIVE'],
  ['Andrew Rodney',        'rodneyandrew99@gmail.com',      '0557622023', null,        'ACTIVE'],
  ['Ama Agyemang',         'amasikapapiowiredu@gmail.com',  '0542346909', '1 month',  'ACTIVE'],
  ['Gideon Baafoe',        'gideonbaffoe044@gmail.com',     '0248089368', null,        'ACTIVE'],
  ['Richard Dwumah',       'richarddwumah400@gmail.com',    '0536765184', null,        'ACTIVE'],
  ['Emelia Oppong',        'aseda97@gmail.com',             '0534986365', '3 months', 'ACTIVE'],
  ['Slyvia Roli',          'thissylviarooi@gmail.com',      '0257719886', '3 months', 'ACTIVE'],
  ['Prince Adu',           'prgnadr@gmail.com',             '0248725692', '6 months', 'ACTIVE'],
  ['Serwah Afriye',        'serwah.afriye@gmail.com',       null,         null,        'ACTIVE'],
  ['Ekow Amamoo',          'ekowbakaamamoo@gmail.com',      '0203791330', '6 months', 'ACTIVE'],
  ['Nana Asor Ampem',      'asorpee_kobby@yhoo.co',         '0244656424', null,        'ACTIVE'],
  ['Kwabena Ampem',        'kwabenaamem777@gmail.com',      '0550000012', null,        'ACTIVE'],
  ['Mark Appiah',          'scarwaye87@gmail.com',          '0547114532', null,        'ACTIVE'],
  ['Benjamin Apreku',      'nanakwekuasiedu@gmail.com',     '0206298990', '1 month',  'ACTIVE'],
  ['Isaac Asenso',         'isaacasenso@gmail.com',         '0244313550', null,        'ACTIVE'],
  ['Nana Darko',           'nanadarko223@gmail.com',        '0558364929', 'Student',  'ACTIVE'],
  ['Abreta Derrick',       'abreta.derrick@gmail.com',      '0556377021', null,        'ACTIVE'],
  // Block 11
  ['Dzadza Divine',        'dzadza_div@gmai.com',           '0244045176', '1 month',  'ACTIVE'],
  ['Manortey George',      'manorteygeorgel13@gmail.com',   '0530122458', null,        'ACTIVE'],
  ['Yaokumah Joshua',      'yaokumz909@gmail.com',          '0598135250', null,        'ACTIVE'],
  ['Godwin Owusu',         'rrgren1000@gmail.com',          '0241126110', 'Student',  'ACTIVE'],
  ['Cathrine Williams',    null,                            null,         null,        'ACTIVE'],
  ['George Botchway',      null,                            '0543673034', null,        'ACTIVE'],
  ['Emmanuel Kamasah',     'kmenclf@gmail.com',             '0570829220', null,        'ACTIVE'],
  ['Debbie Mark',          'debybaby77@gmail.com',          '0264250514', '1 month',  'ACTIVE'],
  ['Solomon Safo',         null,                            '0243056026', '1 month',  'ACTIVE'],
  ['Terry Tee',            null,                            '0248398505', 'Student',  'ACTIVE'],
  ['Dr Stephen Amanor',    'seteve.amanor@gmail.com',       '0548771307', '3 months', 'ACTIVE'],
  ['Mr And Mrs Owusu Asare', 'asarexander@gmail.com',       '0249811558', null,       'ACTIVE'],
  ['David Avor',           'avordm@gmail.com',              '0207628947', '3 months', 'ACTIVE'],
  ['Mawuena Bernice',      'mawuenaborince2@gmail.com',     '0202767288', '2weeks',   'ACTIVE'],
  ['Kaba Clare',           null,                            '0555321813', '3 months', 'ACTIVE'],
  ['Darliton Baah',        'darlitonbaah7@gmail.com',       '0503321321', 'Student',  'ACTIVE'],
  ['Anthony Kofi',         'kofi.toni@gmail.com',           '0243071602', null,        'ACTIVE'],
  ['Lotsu Sandra',         'lotsusandra@gmail.com',         '0207948464', null,        'ACTIVE'],
  ['Paul Adams',           null,                            '0244423737', '3 months', 'ACTIVE'],
  ['Adanusah Veronica',    'falysdecor@gmail.com',          '0535274702', null,        'ACTIVE'],
  // Block 12
  ['Sadia Maccomalinda',   null,                            '0200541270', null,        'ACTIVE'],
  ['Seyram Selma',         null,                            '0274046959', '3 months', 'ACTIVE'],
  ['Daniel Tiigah',        'danieltiigah345@gmail.com',     '0544261925', '1 month',  'ACTIVE'],
  ['Kingsley Agyeman',     null,                            '0244288246', null,        'ACTIVE'],
  ['Joshua Gidi',          'joshuagidieyram@gmail.com',     '0557114365', null,        'ACTIVE'],
  ['Kobby Mensah',         'mensahkobby@gmail.com',         '0269976675', '1 month',  'ACTIVE'],
  ['Erica Afful',          'aaerica5155@gmail.com',         '0245112209', null,        'ACTIVE'],
  ['Louisa Pokua',         null,                            '0247981528', null,        'ACTIVE'],
  ['Williams Mishio',      'eniormishio@gmail.com',         '0270375322', null,        'ACTIVE'],
  ['Mohammed Manaf',       'manafmohammed67@gmail.com',     '0559156782', null,        'ACTIVE'],
  ['Cecil Quist',          'cecilquist@gmail.com',          '0244222581', null,        'ACTIVE'],
  ['Lily Tabase',          'tabaselily5@gmail.com',         '0244936604', null,        'ACTIVE'],
  ['Roger Amey',           'amneyboy18@gmail.com',          '0244268422', null,        'ACTIVE'],
  ['Sandra Boateng',       null,                            '0548217300', '1 month',  'ACTIVE'],
  ['Sievers Brobbey',      'henryllyod275@gmail.com',       '0544828464', '1 month',  'ACTIVE'],
  ['Tony Danquah',         'tonydanquahusa@gmail.com',      '0244087324', null,        'ACTIVE'],
  ['Princess Diana',       null,                            '0594188177', null,        'ACTIVE'],
  ['Evans Gyampoh',        null,                            '0243143502', '1 month',  'ACTIVE'],
  ['Jerry Hukpati',        null,                            '0242160914', null,        'ACTIVE'],
  ['Cleland Yaw',          null,                            '0240787825', null,        'ACTIVE'],
  ['Freddrick Mensah',     null,                            '0543484268', null,        'ACTIVE'],
  // Block 13
  ['Fauzia',               null,                            '0200241648', null,        'ACTIVE'],
  ['Francis Amorin',       null,                            '0200666211', '3 months', 'ACTIVE'],
  ['Joy Anang',            null,                            '0246680153', null,        'ACTIVE'],
  ['Eric Ansah',           null,                            '0242403000', null,        'ACTIVE'],
  ['Michael Armah',        'mikeyamah@gmail.com',           '0551409591', '2weeks',   'ACTIVE'],
  ['Beatrice Aryee',       null,                            '0538226855', null,        'ACTIVE'],
  ['Gideon Dadzie',        'gideondadzie@icloud.com',       '0201981971', null,        'ACTIVE'],
  ['Edinam Daneku',        null,                            '0543255417', null,        'ACTIVE'],
  ['Naadu Eku',            null,                            null,         null,        'ACTIVE'],
  ['Prosper Felli',        'proskaf@gmail.com',             '0554530296', null,        'ACTIVE'],
  ['Emmanuel Nii',         'dokuemmanuelnii@gmail.com',     '0532350331', '3 months', 'ACTIVE'],
  ['Kwabena Ofori',        null,                            '0558035621', null,        'ACTIVE'],
  ['Falando Roberson',     null,                            '0547578811', 'Seniors',  'ACTIVE'],
  ['Steven Acquah',        null,                            '0507380474', null,        'ACTIVE'],

  // ── PDF 2: CANCELLED ──────────────────────────────────────────
  ['Kenneth Blankson 2',   null,                            null,         null,        'CANCELLED'],
  ['Emma Adjei',           null,                            '0246782373', null,        'CANCELLED'],
  ['Zinaya',               null,                            null,         null,        'CANCELLED'],
  ['Nancy Owusu',          null,                            '0200055811', null,        'CANCELLED'],
  ['Elorm Ribeiro',        null,                            '0205812334', null,        'CANCELLED'],
  ['Makarius',             null,                            '0546338740', null,        'CANCELLED'],
  ['Turkson',              null,                            '0545954239', null,        'CANCELLED'],
  ['Joseph Attah',         null,                            null,         null,        'CANCELLED'],
  ['June Joseph',          null,                            '0507045531', null,        'CANCELLED'],
  ['Delmar',               null,                            '0557413423', null,        'CANCELLED'],
  ['Christabel',           null,                            '0505492110', null,        'CANCELLED'],
  ['Festus Amoah',         null,                            '0202705486', null,        'CANCELLED'],
  ['Samuel Amponsah',      null,                            '0535474404', null,        'CANCELLED'],
  ['Steven Darku',         null,                            '0242219227', null,        'CANCELLED'],
  ['Sheron',               'shergaag@gmail.com',            null,         null,        'CANCELLED'],
  ['Igwe',                 null,                            '0509181819', null,        'CANCELLED'],
  ['Festus Amoah 2',       null,                            '0533040251', null,        'CANCELLED'],
  ['Michael Hardest',      null,                            '0557146711', null,        'CANCELLED'],
  ['Cilla',                'yhaacuty57@gmail.com',          '0543244644', null,        'CANCELLED'],
  ['Yaw Aceampong',        'yawachwampong391@gmail.com',    '0536582349', null,        'CANCELLED'],
  ['Gideon Bafo',          null,                            '0248089368', null,        'CANCELLED'],
  ['Clara Benson 2',       null,                            '0591511603', null,        'CANCELLED'],
  ['Mrs Amdtfey',          null,                            '0504230071', null,        'CANCELLED'],
  ['Ekow Abaka',           'ekowabakanamoo@gmail.com',      '0203791330', null,        'CANCELLED'],
  ['Naa Adjeley',          null,                            null,         null,        'CANCELLED'],
  ['Getty Adzawulah',      null,                            '0540733783', null,        'CANCELLED'],
  ['Peter Kusi',           'peter-kusiboateng@yahoo.com',   '0541613706', null,        'CANCELLED'],
  ['Mariam Twumasi',       'mtwunasi16@gmail.com',          '0243544066', null,        'CANCELLED'],
  ['Jowell Asamoah',       null,                            '0592668879', null,        'CANCELLED'],
  ['Kwesi Honam',          null,                            '0530543130', null,        'CANCELLED'],
  ['Josh Manorty',         null,                            '0530122458', null,        'CANCELLED'],
  ['Michael Voodo',        null,                            '0557146711', null,        'CANCELLED'],
  ['Delmar Graham',        'grahamdelmar2@gmail.com',       '0557413424', null,        'CANCELLED'],
  ['Kafui Nutor',          'nutorkafuu990@gmail.com',       '0555856446', null,        'CANCELLED'],
  ['Christabel Ofosuwa',   null,                            '0505492110', null,        'CANCELLED'],
  ['Abdullahi Abubakar',   'officialdagizag@gmail.com',     '0550456125', null,        'CANCELLED'],
  ['Della Ama',            null,                            '0261265194', null,        'CANCELLED'],
  ['Erogbogbo Gabriel',    'gabrielerogbogbo@gmail.com',    null,         null,        'CANCELLED'],
  ['Secheriah Idiku',      null,                            null,         null,        'CANCELLED'],
  ['Joseph Yaw',           null,                            '0598135250', null,        'CANCELLED'],
  ['Commando',             null,                            '0248851017', null,        'CANCELLED'],
  ['Rosa Lartey',          null,                            '0244458107', null,        'CANCELLED'],
  ['Andrew Ansah',         'andy0445@yahoo.com',            '0533264263', null,        'CANCELLED'],
  ['Nene Dorson',          null,                            '0202900358', null,        'CANCELLED'],
  ['Vic Mensah',           'joelmensah1738@gmail.com',      '0243810858', null,        'CANCELLED'],
  ['Francisca Saah',       'saahfranca4@gmail.com',         '0549826800', null,        'CANCELLED'],

  // ── PDF 3: FROZEN ─────────────────────────────────────────────
  ['Kwabena Ebenezer',     'bekoeebenezer27@gmail.com',     '0205533750', null,        'FROZEN'],
  ['Jimmy Grupee',         'jigrupee@gmail.com',            '0271328878', null,        'FROZEN'],
  ['Dennis Hunter',        'dennhunt@gmail.com',            '0531589021', null,        'FROZEN'],
];

function normName(full: string): [string, string] {
  const parts = full.trim().split(/\s+/);
  return [parts[0], parts.slice(1).join(' ') || '-'];
}

function normPhone(raw: string | null): string | null {
  if (!raw) return null;
  const d = raw.replace(/\D/g, '');
  if (d.length === 9) return '0' + d;
  return d.slice(0, 15);
}

function padNum(n: number): string {
  return String(n).padStart(4, '0');
}

async function main() {
  const passwordHash = await bcrypt.hash('Oracle2024!', 10);
  const seenEmails = new Set<string>();
  const seenPhones = new Set<string>();
  let counter = 0;
  let noContactCounter = 0;

  for (const [fullName, rawEmail, rawPhone, plan, status] of MEMBERS) {
    counter++;
    const [firstName, lastName] = normName(fullName);
    const phone = normPhone(rawPhone);

    // Resolve email
    let email: string;
    if (rawEmail && !seenEmails.has(rawEmail.toLowerCase())) {
      email = rawEmail.toLowerCase();
    } else if (phone && !seenPhones.has(phone)) {
      email = `member_${phone}@noemail.local`;
    } else {
      noContactCounter++;
      email = `member_nc${noContactCounter}@noemail.local`;
    }
    seenEmails.add(email.toLowerCase());
    if (phone) seenPhones.add(phone);

    const memberNumber = `M${padNum(counter)}`;

    try {
      // Skip if already inserted
      const existing = await prisma.user.findUnique({ where: { email } });
      if (existing) {
        console.log(`  [${counter}] ${firstName} ${lastName} — already exists, skipping`);
        continue;
      }

      const user = await prisma.user.create({
        data: { email, password: passwordHash, role: 'MEMBER' },
      });

      const member = await prisma.member.create({
        data: {
          userId: user.id,
          memberNumber,
          firstName,
          lastName,
          email,
          phone,
          status: status as any,
          pinCode: String(1000 + Math.floor(Math.random() * 9000)),
          checkinCode: Math.random().toString(36).slice(2, 8).toUpperCase(),
        },
      });

      // Assign plan if applicable
      const planId = plan ? PLAN[plan] : null;
      if (planId && status === 'ACTIVE') {
        const start = new Date();
        let endDate: Date | null = null;
        if (plan === '2weeks') {
          endDate = new Date(start); endDate.setDate(endDate.getDate() + 14);
        } else if (plan === '1 month') {
          endDate = new Date(start); endDate.setMonth(endDate.getMonth() + 1);
        } else if (plan === '3 months') {
          endDate = new Date(start); endDate.setMonth(endDate.getMonth() + 3);
        } else if (plan === '6 months') {
          endDate = new Date(start); endDate.setMonth(endDate.getMonth() + 6);
        } else if (plan === 'Student') {
          endDate = new Date(start); endDate.setMonth(endDate.getMonth() + 1);
        } else if (plan === 'Couple') {
          endDate = new Date(start); endDate.setMonth(endDate.getMonth() + 1);
        } else if (plan === 'Seniors') {
          endDate = new Date(start); endDate.setMonth(endDate.getMonth() + 1);
        }
        await prisma.memberPlan.create({
          data: {
            memberId: member.id,
            planId,
            startDate: start,
            endDate,
            nextBillingDate: endDate,
            paymentMethod: 'MANUAL',
            isActive: true,
          },
        });
      }

      console.log(`✓ [${counter}] ${firstName} ${lastName} (${status})`);
    } catch (err: any) {
      console.error(`✗ [${counter}] ${firstName} ${lastName}: ${err.message}`);
    }
  }

  console.log(`\nDone. ${counter} members processed.`);
}

main()
  .then(() => prisma.$disconnect())
  .catch(e => { console.error(e); prisma.$disconnect(); process.exit(1); });
