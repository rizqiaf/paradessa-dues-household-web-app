import * as XLSX from 'xlsx';
import * as path from 'path';
import * as fs from 'fs';

// Create the Excel file from the exact raw text provided in user request
const sheet2026Csv = `No Rumah,Tanggal Transaksi,Jenis Transaksi,Keterangan,Masuk,Keluar,Saldo,Note
Blok A18,2025-06-05,Kas Masuk,Rizqi,100000,,100000,
Blok A5,2025-06-05,Kas Masuk,Yanwar,100000,,200000,
Blok A11,2025-06-10,Kas Masuk,Hafizh,100000,,300000,
Blok A15,2025-06-15,Kas Masuk,Fajar/Rahmat,100000,,400000,
Blok A1,2025-06-18,Kas Masuk,Eko,100000,,500000,
,2025-06-19,Pengeluaran,Listrik Token untuk Mesin Air,,100000,400000,
,2025-06-28,Pengeluaran,Besi penyangga lampu solar,,250000,150000,
Blok A3,2025-06-29,Kas Masuk,Robby,100000,,250000,
Blok A3,2025-07-02,Kas Masuk,Robby,100000,,350000,
Blok A12,2025-07-02,Kas Masuk,Aqmal,200000,,550000,
Blok A4,2025-07-12,Kas Masuk,Yanwar,100000,,650000,
Blok A11,2025-07-13,Kas Masuk,Hafizh,100000,,750000,
Blok A15,2025-07-15,Kas Masuk,Fajar/Rahmat,100000,,850000,
Blok A17,2025-07-19,Kas Masuk,Angga,100000,,950000,
Blok A1,2025-07-19,Kas Masuk,Eko,100000,,1050000,
,2025-07-19,Pengeluaran,Listrik Token untuk Mesin Air,,100000,950000,
Blok B38,2025-07-20,Kas Masuk,Gianaj,100000,,1050000,
Blok A18,2025-07-21,Kas Masuk,Rizqi,100000,,1150000,
Blok A1,2025-08-06,Kas Masuk,Eko,100000,,1250000,
,2025-08-06,Pengeluaran,Listrik Token untuk Mesin Air,,100000,1150000,
Blok A5,2025-08-15,Kas Masuk,Yanwar,100000,,1250000,
,2025-08-16,Pengeluaran,Donasi Karang Taruna Desa Pananjung,,100000,1150000,
Blok A15,2025-08-16,Kas Masuk,Fajar/Rahmat,100000,,1250000,
Blok A1,20 Agustus 2025,Kas Masuk,Eko,200000,,1450000,Untuk September
,20 Agustus 2025,Pengeluaran,Listrik Token untuk Mesin Air,,200000,1250000,
Blok A4,22 Agustus 2025,Kas Masuk,Yanwar,100000,,1350000,
,,,Listrik Token untuk Mesin Air,,100000,1250000,
,23 Agustus 2025,Pengeluaran,Bayar Sampah ke Pak Udin,,400000,850000,
Blok A17,26 Agustus 2025,Kas Masuk,Angga,100000,,950000,
Blok A12,28 Agustus 2025,Kas Masuk,Aqmal,200000,,1150000,Untuk September
Blok A11,30 Agustus 2025,Kas Masuk,Hafizh,200000,,1350000,Untuk September
Blok A3,2025-09-04,Kas Masuk,Robby,100000,,1450000,
Blok B38,2025-09-05,Kas Masuk,Gianaj,200000,,1650000,Untuk September
Blok A18,2025-09-10,Kas Masuk,Rizqi,100000,,1750000,
Blok A15,2025-09-15,Kas Masuk,Fajar/Rahmat,100000,,1850000,
Blok A17,2025-09-25,Kas Masuk,Angga,100000,,1950000,
,,,Bayar Sampah ke Pak Udin,,400000,1550000,
Blok A12,2025-10-01,Kas Masuk,Aqmal,120000,,1670000,
Blok A3,2025-10-06,Kas Masuk,Robby,120000,,1790000,
Blok A5,2025-10-11,Kas Masuk,Yanwar,140000,,1930000,
Blok A5,2025-10-10,Kas Masuk,Yanwar,100000,,2030000,
,,Pengeluaran,ganti uang pak yanwar,,100000,1930000,
Blok A1,2025-10-11,Kas Masuk,Eko,120000,,2050000,
,,Pengeluaran,Listrik Token untuk Mesin Air,,120000,1930000,
Blok A11,2025-10-12,Kas Masuk,Hafizh,120000,,2050000,
Blok A17,2025-10-13,Kas Masuk,Angga,120000,,2170000,
Blok A15,2025-10-15,Kas Masuk,Fajar/Rahmat,120000,,2290000,
Blok B38,2025-10-17,Kas Masuk,Gianaj,120000,,2410000,
Blok B50,2025-10-18,Kas Masuk,Agung,70000,,2480000,
Blok A23,2025-10-19,Kas Masuk,Saeful,120000,,2600000,
Blok A7,2025-10-20,Kas Masuk,Yana,70000,,2670000,
Blok A18,2025-10-20,Kas Masuk,Rizqi,120000,,2790000,
,2025-10-20,Pengeluaran,Listrik Token untuk Mesin Air,,100000,2690000,
,2025-10-24,Pengeluaran,Bayar Sampah ke Pak Udin,,450000,2240000,
,2025-10-31,Pengeluaran,Listrik Token untuk Mesin Air,,50000,2190000,
Blok A11,2025-11-01,Kas Masuk,Hafizh,70000,,2260000,
Blok A23,2025-11-02,Kas Masuk,Saeful,120000,,2380000,
Blok A3,2025-11-05,Kas Masuk,Robby,120000,,2500000,
Blok A1,2025-11-05,Kas Masuk,Eko,120000,,2620000,
Blok A12,2025-11-06,Kas Masuk,Aqmal,120000,,2740000,
Blok A5,2025-11-07,Kas Masuk,Yanwar,120000,,2860000,
Blok A17,2025-11-08,Kas Masuk,Angga,120000,,2980000,
Blok A7,2025-11-08,Kas Masuk,Wendy,240000,,3220000,Untuk Desember juga
Blok A9&A10,2025-11-14,Kas Masuk,Alan/Selena,120000,,3340000,
Blok A18,2025-11-08,Kas Masuk,Rizqi,120000,,3460000,
Blok B50,2025-11-09,Kas Masuk,Agung,70000,,3530000,
Blok A21,2025-11-09,Kas Masuk,Sunandar,120000,,3650000,
Blok A22,2025-11-09,Kas Masuk,Afin,70000,,3720000,
Blok A15,2025-11-17,Kas Masuk,Fajar/Rahmat,120000,,3840000,
Blok B19,2025-11-18,Kas Masuk,Azka,120000,,3960000,
Blok B38,2025-11-18,Kas Masuk,Gianaj,120000,,4080000,
,2025-11-25,Pengeluaran,Token Listrik,,104100,3975900,
,2025-11-25,Pengeluaran,Bayar Sampah ke Pak Udin,,650000,3325900,
,2025-11-28,Pengeluaran,Token Listrik,,204100,3121800,
,2025-11-30,Pengeluaran,Reparasi Mesin Air,,1000000,2121800,sisa 400rb uang talang pak Agung.
,2025-11-30,Pengeluaran,Jenguk Anaknya Pak Robi,,300000,1821800,
,,Pengeluaran,Debit Card Charges,,5000,1816800,
Blok A21,2025-12-01,Kas Masuk,Sunandar,120000,,1936800,
Blok A11,2025-12-02,Kas Masuk,Hafizh,70000,,2006800,
Blok A23,2025-12-03,Kas Masuk,Saeful,120000,,2126800,
Blok A17,2025-12-04,Kas Masuk,Angga,120000,,2246800,
Blok B38,2025-12-05,Kas Masuk,Gianaj,120000,,2366800,
Blok B50,2025-12-05,Kas Masuk,Agung,70000,,2436800,
Blok A3,2025-12-06,Kas Masuk,Robby,120000,,2556800,
,2025-12-11,Pengeluaran,Token Listrik,,104100,2452700,
Blok A15,2025-12-15,Kas Masuk,Fajar/Rahmat,150000,,2602700,Kelebihan Rp.30.000
Blok A18,2025-12-18,Kas Masuk,Rizqi,120000,,2722700,
Blok B19,2025-12-23,Kas Masuk,Azka,120000,,2842700,
Blok A12,2025-12-24,Kas Masuk,Aqmal,240000,,3082700,
,2025-12-25,Pengeluaran,Bayar Sampah ke Pak Udin,,650000,2432700,
,2025-12-30,Pengeluaran,Token Listrik,,204100,2228600,
Blok A5,2025-12-30,Kas Masuk,Yanwar,120000,,2348600,
,2025-12-31,Kas Masuk,Unang,240000,,2588600,
,,Kas Keluar,Ganti Uang talang pak agung,120000,,,sisa 400.000-120.000=280.000 (Dec)
,,Kas Keluar,Ganti Uang Liwet pak robi,40000,,,Untuk Januari Pak Robi hanya bayar Rp.80.000
Blok A23,2026-01-02,Kas Masuk,Saeful,120000,,2708600,
Blok B39,2026-01-03,Kas Masuk,Ilham,70000,,2778600,
Blok A11,2026-01-04,Kas Masuk,Hafizh,70000,,2848600,
,2026-01-04,Pengeluaran,Reparasi Mesin Air,,1400000,1448600,"1. Jasa naik dan turunkan mesin Rp.1.200.000
2. Bahan Radar dan lain-lain Rp.200.000"
,2026-01-05,Pengeluaran,Listrik Token untuk Mesin Air,,308200,1140400,
Blok B38,2026-01-05,Kas Masuk,Gianaj,120000,,1260400,
Blok A3,2026-01-05,Kas Masuk,Robby,80000,,1340400,
Blok A22,2026-01-05,Kas Masuk,Affin,140000,,1480400,
Blok A21,2026-01-05,Kas Masuk,Sunandar,120000,,1600400,
Blok A7,2026-01-06,Kas Masuk,Wendy,120000,,1720400,
Blok A9&A10,2026-01-07,Kas Masuk,Alan/Selena,600000,,2320400,Sampai April 2026
Blok A17,2026-01-07,Kas Masuk,Angga,120000,,2440400,
Blok B50,2026-01-10,Kas Masuk,Agung,70000,,2510400,
Blok B19,2026-01-14,Kas Masuk,Azka,120000,,2630400,
Blok A15,2026-01-15,Kas Masuk,Fajar/Rahmat,110000,,2740400,
Blok A5,2026-01-17,Kas Masuk,Yanwar,120000,,2860400,
Blok B39,2026-01-21,Kas Masuk,Ilham,150000,,3010400,Bulan Desember
,2026-01-25,Pengeluaran,Bayar Jasa Sampah Pak Udin,650000,,2360400,
,2026-01-25,Pengeluaran,Beli stabilizer mesin air (masih perkiraan),1256000,,1104400,
Blok A15,2026-01-28,Kas Masuk,Fajar/Rahmat,120000,,1224400,Iuran Bulan Februari
Blok A11,2026-01-31,Kas Masuk,Hafizh,70000,,1294400,Iuran Bulan Februari
Blok A23,2026-02-01,Kas Masuk,Saeful,120000,,1414400,
Blok A17,2026-02-02,Kas Masuk,Angga,120000,,1534400,
Blok A7,2026-02-05,Kas Masuk,Wendy,120000,,1654400,
Blok B38,2026-02-05,Kas Masuk,Gianaj,120000,,1774400,
Blok A5,2026-02-06,Kas Masuk,Yanwar,120000,,1894400,
Blok A18,2026-02-06,Kas Masuk,Rizqi,240000,,2134400,dengan bulan Januari
,2026-02-08,Pengeluaran,Listrik Token untuk Mesin Air,,303100,1831300,
Blok A21,2026-02-09,Kas Masuk,Sunandar,120000,,1951300,
,2026-02-10,Pengeluaran,Perbaikan Mesin Air ganti Termit,,145000,1806300,
Blok A3,2026-02-10,Kas Masuk,Robby,120000,,1926300,
Blok B19,2026-02-12,Kas Masuk,Azka,120000,,2046300,
Blok B50,2026-02-13,Kas Masuk,Agung,120000,,2166300,
Blok B52,2026-02-16,Kas Masuk,Agung Teja,120000,,2286300,
,2026-02-25,Pengeluaran,Bayar Jasa Sampah Pak Udin,,700000,1586300,
Blok A12,2026-02-26,Kas Masuk,Aqmal,240000,,1826300,Februari dan Maret
Blok A11,2026-02-27,Kas Masuk,Hafizh,70000,,1896300,
Blok A15,2026-02-28,Kas Masuk,Fajar/Rahmat,120000,,2016300,Bayar bulan Maret
Blok A17,2026-03-03,Kas Masuk,Angga,120000,,2136300,
Blok A23,2026-03-03,Kas Masuk,Saeful,120000,,2256300,
Blok B38,2026-03-05,Kas Masuk,Gianaj,120000,,2376300,
Blok A5,2026-03-05,Kas Masuk,Yanwar,120000,,2496300,
Blok B50,2026-03-06,Kas Masuk,Agung,120000,,2616300,
Blok A3,2026-03-06,Kas Masuk,Robby,120000,,2736300,
Blok A21,2026-03-06,Kas Masuk,Sunandar,120000,,2856300,
,2026-03-08,Pengeluaran,Listrik Token untuk Mesin Air,,203100,2653200,
Blok A1,2026-03-10,Kas Masuk,Eko,120000,,2773200,
,2026-03-11,Pengeluaran,THR Bingkisan untuk Pak Udin dan Pak Awo,,329800,2443400,
Blok B19,2026-03-13,Kas Masuk,Azka,120000,,2563400,
Blok A22,2026-03-14,Kas Masuk,Affin,140000,,2703400,
Blok B52,2026-03-15,Kas Masuk,Agung Teja,120000,,2823400,
Blok A18,2026-03-15,Kas Masuk,Rizqi,120000,,2943400,
,2026-03-16,Pengeluaran,Listrik Token untuk Mesin Air,,103100,2840300,
,,Pengeluaran,Bayar Jasa Sampah Pak Udin,750000,,2090300,15 Rumah Menetap
Blok A15,2026-03-28,Kas Masuk,Fajar/Rahmat,120000,,2210300,Bayar bulan April
Blok A3,2026-04-01,Kas Masuk,Robby,120000,,2330300,
Blok A22,2026-04-02,Kas Masuk,Afin,120000,,2450300,
Blok A21,2026-04-03,Kas Masuk,Sunandar,120000,,2570300,
Blok A11,2026-04-03,Kas Masuk,Hafizh,70000,,2640300,
,2026-04-03,Pengeluaran,Listrik Token untuk Mesin Air,,102100,2538200,
Blok B39,2026-04-04,Kas Masuk,Ilham,140000,,2678200,Febuari & Maret
Blok A23,2026-04-05,Kas Masuk,Saeful,120000,,2798200,
Blok B38,2026-04-05,Kas Masuk,Gianaj,120000,,2918200,
Blok A18,2026-04-05,Kas Masuk,Rizqi,120000,,3038200,
Blok A17,2026-04-05,Kas Masuk,Angga,120000,,3158200,
Blok A1,2026-04-05,Kas Masuk,Eko,120000,,3278200,
Blok B50,2026-04-05,Kas Masuk,Agung Tri Laksono,120000,,3398200,
Blok A5,2026-04-09,Kas Masuk,Yanwar,120000,,3518200,
Blok B19,2026-04-13,Kas Masuk,Azka,120000,,3638200,
Blok B52,2026-04-14,Kas Masuk,Agung Teja,120000,,3758200,
Blok A12,2026-04-24,Kas Masuk,Aqmal,240000,,3998200,April dan Mei
,2026-04-24,Pengeluaran,Listrik Token untuk Mesin Air,,203100,3795100,
,2026-04-24,Pengeluaran,Bayar Jasa Sampah Pak Udin,,800000,2995100,
Blok A11,2026-05-01,Kas Masuk,Hafizh,70000,,3065100,
Blok A22,2026-05-01,Kas Masuk,Afin,120000,,3185100,
,,Pengeluaran,Listrik Token untuk Mesin Air,,202600,2982500,
Blok A17,2026-05-03,Kas Masuk,Angga,120000,,3102500,
Blok A18,2026-05-03,Kas Masuk,Rizqi,120000,,3222500,
Blok A15,2026-05-04,Kas Masuk,Fajar/Rahman,120000,,3342500,
Blok A5,2026-05-04,Kas Masuk,Yanwar,120000,,3462500,
Blok A21,2026-05-04,Kas Masuk,Sunandar,120000,,3582500,
Blok A3,2026-05-05,Kas Masuk,Robby,120000,,3702500,
Blok B38,2026-05-05,Kas Masuk,Gianaj,120000,,3822500,
Blok A23,2026-05-05,Kas Masuk,Saeful,120000,,3942500,
,2026-05-09,Pengeluaran,Listrik Token untuk Mesin Air,,104100,3838400,
Blok C01,2026-05-10,Kas Masuk,Rahman,50000,,3888400,
Blok A9&A10,2026-05-10,Kas Masuk,Alan/Selena,720000,,4608400,Sampai October 2026
Blok A26,2026-05-11,Kas Masuk,Arga,120000,,4728400,
,2026-05-14,Pengeluaran,Donasi Semen untuk perbaikan jalan diluar Paradessa,,250000,4478400,
,2026-05-18,Pengeluaran,Patungan Naikin Toren ,,202500,4275900,
,2026-05-18,Pengeluaran,Pemasangan Lampu Portal,,290800,3985100,
,2026-05-25,Pengeluaran,Bayar Jasa Sampah Pak Udin,,800000,3185100,
Blok A15,2026-05-28,Kas Masuk,Fajar,120000,,3305100,Iuran Bulan Juni 2026
Blok C01,2026-05-28,Kas Masuk,Rahman,50000,,3355100,Iuran Bulan Juni 2026
Blok A1,2026-05-28,Kas Masuk,Eko,240000,,3595100,Iuran Bulan Mei dan Juni 2026
Blok B50,2026-05-29,Kas Masuk,Agung Tri Laksono,120000,,3715100,Iuran Bulan Mei 2026
Blok B19,2026-05-29,Kas Masuk,Azka,240000,,3955100,Iuran Bulan Mei dan Juni 2026
Blok A11,2026-05-29,Kas Masuk,Hafizh,70000,,4025100,Iuran Bulan Juni 2026
Blok A19,2026-05-31,Kas Masuk,Ramdani,100000,,4125100,Iuran Bulan Mei dan Juni 2026
Blok A22,2026-06-01,Kas Masuk,Afin,120000,,4245100,
Blok A17,2026-06-02,Kas Masuk,Angga,120000,,4365100,
Blok A3,2026-06-02,Kas Masuk,Robby,120000,,4485100,
Blok A21,2026-06-03,Kas Masuk,Sunandar,120000,,4605100,
Blok A23,2026-06-04,Kas Masuk,Saeful,120000,,4725100,
Blok B38,2026-06-05,Kas Masuk,Gianaj,120000,,4845100,
Blok A18,2026-06-05,Kas Masuk,Rizqi,120000,,4965100,
Blok A26,2026-06-06,Kas Masuk,Arga,120000,,5085100,
Blok A16,2026-06-06,Kas Masuk,Nur Rizky,120000,,5205100,
Blok B52,2026-06-06,Kas Masuk,Agung Teja,240000,,5445100,Mei dan Juni
Blok A5,2026-06-15,Kas Masuk,Yanwar,120000,,5565100,
Blok B20,2026-06-21,Kas Masuk,Rainer,150000,,5715100,Untuk bulan juli tinggal 90ribu
,2026-06-22,Pengeluaran,Listrik Token untuk Mesin Air,,204100,5511000,
,2026-06-22,Pengeluaran,Listrik Token untuk Mesin Air,,104100,5406900,
,2026-06-24,Pengeluaran,Bayar Sampah ke Pak Udin,,800000,4606900,
Blok A17,2026-06-25,Kas Masuk,Angga,120000,,4726900,Untuk bulan Juli 2026
Blok A15,2026-06-25,Kas Masuk,Fajar,120000,,4846900,Untuk bulan Juli 2026
Blok C01,2026-06-29,Kas Masuk,Rahman,50000,,4896900,Untuk bulan Juli 2026
Blok B50,2026-06-30,Kas Masuk,Agung Tri Laksono,120000,,5016900,
Blok A11,2026-06-30,Kas Masuk,Hafizh,70000,,5086900,Untuk bulan Juli 2026
Blok A3,2026-07-01,Kas Masuk,Robby,120000,,5206900,
Blok A22,2026-07-01,Kas Masuk,Afin,120000,,5326900,
Blok A23,2026-07-04,Kas Masuk,Saeful,120000,,5446900,
Blok A21,2026-07-04,Kas Masuk,Sunandar,120000,,5566900,
Blok B38,2026-07-05,Kas Masuk,Gianaj,120000,,5686900,
Blok B38,2026-07-05,Kas Masuk,Gianaj,120000,,5806900,Untuk bulan Agusuts 2026
Blok A5,2026-07-09,Kas Masuk,Yanwar,120000,,5926900,
Blok A18,2026-07-09,Kas Masuk,Rizqi,120000,,6046900,
Blok B52,2026-07-19,Kas Masuk,Agung Teja,120000,,6166900,
Blok A7,2026-07-20,Kas Masuk,Eka,120000,,6286900,
Blok A26,2026-07-23,Kas Masuk,Arga,120000,,6406900,
Blok A1,2026-07-25,Kas Masuk,Eko,120000,,6526900,
,,Pengeluaran,Listrik Token untuk Mesin Air,204100,,6322800,
,,Pengeluaran,Listrik Token untuk Mesin Air,104100,,6218700,
,,Pengeluaran,Bayar Sampah ke Pak Udin,800000,,5418700,
,,Pengeluaran,CCTV Bardi Untuk Taman,400000,,5018700,
Blok A17,2026-07-25,Kas Masuk,Angga,120000,,5138700,Untuk bulan Agusuts 2026
Blok A15,2026-07-28,Kas Masuk,Fajar,120000,,5258700,Untuk bulan Agusuts 2026
Blok C01,2026-07-28,Kas Masuk,Rahman,50000,,5308700,Untuk bulan Agusuts 2026
Blok A11,2026-07-31,Kas Masuk,Hafizh,70000,,5378700,Untuk bulan Agusuts 2026
Blok A7,2026-08-01,Kas Masuk,Eka,120000,,5498700,
Blok A23,2026-08-02,Kas Masuk,Saeful,120000,,5618700,
Blok A3,2026-08-03,Kas Masuk,Robby,120000,,5738700,
Blok A26,2026-08-04,Kas Masuk,Arga,120000,,5858700,
Blok B19,2026-08-06,Kas Masuk,Azka,120000,,5978700,Untuk Bulan Juli 2026
Blok A12,2026-08-09,Kas Masuk,Aqmal,240000,,6218700,Untuk Juli & Agustus 2026
Blok A5,2026-08-10,Kas Masuk,Yanwar,120000,,6338700,
Blok A22,2026-08-11,Kas Masuk,Afin,120000,,6458700,
Blok A21,2026-08-12,Kas Masuk,Sunandar,120000,,6578700,
,2026-08-15,Pengeluaran,Listrik Token untuk Mesin Air,,204100,6374600,
Blok A18,2026-08-18,Kas Masuk,Rizqi,120000,,6494600,
,2026-08-21,Pengeluaran,Biaya Pemotongan Rumput,,265000,6229600,
Blok B52,2026-08-24,Kas Masuk,Agung Teja,120000,,6349600,
,2026-08-25,Pengeluaran,Bayar Sampah ke Pak Udin,,800000,5549600,
,2026-08-26,Pengeluaran,Kotak Kunci Portal,,77360,5472240,
,2026-08-26,Pengeluaran,Listrik Token untuk Mesin Air,,104100,5368140,
Blok A16,2026-08-26,Kas Masuk,Kiky,240000,,5608140,Untuk Juli & Agustus 2026
Blok B50,2026-08-28,Kas Masuk,Agung Tri Laksono,120000,,5728140,Untuk bulan Juli
Blok A33,2026-08-29,Kas Masuk,Galih,240000,,5968140,Untuk April s/d Agustus 2026
Blok B39,2026-08-31,Kas Masuk,Ilham,240000,,6208140,"Untuk Juni, Juli & Agustus 2026"
Blok A11,2026-08-31,Kas Masuk,Hafizh,70000,,6278140,
Blok A22,2026-09-01,Kas Masuk,Afin,120000,,6398140,
Blok A7,2026-09-01,Kas Masuk,Eka,120000,,6518140,
Blok A17,2026-09-02,Kas Masuk,Angga,120000,,6638140,
Blok A3,2026-09-02,Kas Masuk,Robby,120000,,6758140,
Blok A23,2026-09-03,Kas Masuk,Saeful,120000,,6878140,
Blok A21,2026-09-11,Kas Masuk,Sunandar,120000,,6998140,
Blok A1,2026-09-14,Kas Masuk,Eko,360000,,7358140,"Untuk Agustus, September, Oktober 2026"
,2026-09-14,Pengeluaran,"Maintenance Pipa, Gudang, Pemasangan Brankas Kunci Portal",,1174000,6184140,
Blok A15,2026-09-15,Kas Masuk,Fajar,120000,,6304140,
Blok C01,2026-09-15,Kas Masuk,Rahman,50000,,6354140,
,2026-09-18,Pengeluaran,Listrik Token untuk Mesin Air,,204100,6150040,
,2026-09-20,Pengeluaran,Listrik Token untuk Mesin Air,,104100,6045940,
,2026-09-22,Pengeluaran,Listrik Token Area Tempat Pekerja,,23100,6022840,
,2026-09-24,Pengeluaran,Bayar Sampah ke Pak Udin,,800000,5222840,
Blok B20,2026-09-24,Kas Masuk,Rainer,330000,,5552840,"Juli, Agustus, September 2026"
Blok A5,2026-09-25,Kas Masuk,Yanwar,120000,,5672840,
Blok A18,2026-09-26,Kas Masuk,Rizky,120000,,5792840,
Blok A26,2026-09-27,Kas Masuk,Arga,120000,,5912840,
Blok A12,2026-09-27,Kas Masuk,Aqmal,240000,,6152840,September Oktober 2026
Blok B38,2026-09-28,Kas Masuk,Gianaj,120000,,6272840,
Blok B19,2026-09-29,Kas Masuk,Azka,240000,,6512840,"Agustus, September 2026"
Blok B52,2026-09-29,Kas Masuk,Agung Teja,120000,,6632840,
Blok B50,2026-09-29,Kas Masuk,Agung Tri Laksono,240000,,6872840,Agustus & September 2026
,2026-09-30,Pengeluaran,Biaya Pemotongan Rumput,,600000,6272840,
,2026-10-01,Pengeluaran,"Pasang lampu, pasang pagar depan, perbaikan pipa",,1002000,5270840,`;

const sheetRekapAwalCsv = `No,NO.R,KK,Tanggal serah terima,2025,,,,,,,,,,,,2026,,,,,,,,,,,,Belum Bayar,Sudah bayar,TOTAL TAGIHAN
,,,,1,2,3,4,5,6,7,8,9,10,11,12,1,2,3,4,5,6,7,8,9,10,11,12,,,
1,A1,EKO AGUNG PRABOWO,dicatatan mas alan tdk ada,-,,,,,,,,,,,,,,,,,,,,,,,,-,16,
2,A2,JULIO ROBIH PANGESTU,22/05/2025,-,-,-,-,,,,,,,,,,,,,,,,,,,,,15,-,
3,A3,ROBI SUGILAR ANDARA,25/05/2025,-,-,-,-,,,,,,,,,,,,,,,,,,,,,-,13,
4,A5,YANWAR YUSUP RUKMANA,dicatatan mas alan tdk ada,-,,,,,,,,,,,,,,,,,,,,,,,,-,16,
5,A6,SANDI IRWANTO,18/05/2025,-,-,-,-,,,,,,,,,,,,,,,,,,,,,13,-,
6,A7,NURANI ASSEGAFF/WENDY,19/05/2025,-,-,-,-,,,,,,,,,,,,,,,,,,,,,2,11,
7,A8,KANTOR (SELENA), ,,,,,,,,,,,,,,,,,,,,,,,,,-,17,
8,A9,DIAN MULYADI,2025-01-07,-,-,-,-,-,-,,,,,,,,,,,,,,,,,,,11,-,
9,A10,KANTOR (ALAN), ,,,,,,,,,,,,,,,,,,,,,,,,,-,17,
10,A11,HAFIIZH ALDI CHOIRUDDIN,22/05/2025,-,-,-,-,,,,,,,,,,,,,,,,,,,,,-,13,
11,A12,AQMAL NUGRARIZKY KUSUMA,2025-12-04,-,-,-,,,,,,,,,,,,,,,,,,,,,,-,14,
12,A15,MUHAMMAD FAJAR SIDDIQ,20/05/2025,-,-,-,-,,,,,,,,,,,,,,,,,,,,,-,13,
13,A16,KIKI NUR RIZKI,19/05/2025,-,-,-,-,,,,,,,,,,,,,,,,,,,,,13,-,
14,A17,ANGGA RAHMANSYAH,2025-06-07,-,-,-,-,-,-,,,,,,,,,,,,,,,,,,,-,11,
15,A18,RIZQI AHMAD FAUZI,2025-11-05,-,-,-,-,,,,,,,,,,,,,,,,,,,,,-,13,
16,A19,SYIFA NURUL FITRI,2025-01-11,-,-,-,-,-,-,-,-,-,-,,,,,,,,,,,,,,,7,-,
17,A20,DENDI SOPIANDI,2025-10-08,-,-,-,-,-,-,-,,,,,,,,,,,,,,,,,,10,-,
18,A21,SUNANDAR,2025-02-11,-,-,-,-,-,-,-,-,-,-,,,,,,,,,,,,,,,-,7,
19,A22,MUHAMMAD WAHYU ARIFIN,2025-12-09,-,-,-,-,-,-,-,-,,,,,,,,,,,,,,,,,-,9,
20,A23,SAEPUL DANA,2025-11-10,-,-,-,-,-,-,-,-,-,,,,,,,,,,,,,,,,-,8,
21,A26,ARGA RUKMANA,2026-02-05,-,-,-,-,-,-,-,-,-,-,-,-,-,-,-,-,,,,,,,,,-,1,
22,A33,GALIH BAGUS PRIADI,28/03/2025,-,-,,,,,,,,,,,,,,,,,,,,,,,15,-,
23,B18,RAINER NATANAEL,15/03/2026,-,-,-,-,-,-,-,-,-,-,-,-,-,-,,,,,,,,,,,3,-,
24,B19,WURIASTUTI,28/09/2025,-,-,-,-,-,-,-,-,,,,,,,,,,,,,,,,,9,-,
25,B38,GIANAJ HERMAWAN FAHIRA,2025-05-07,-,-,-,-,-,-,,,,,,,,,,,,,,,,,,,-,11,
26,B39,ILHAM NIFTA KHULLOH,29/06/2025,-,-,-,-,-,,,,,,,,,,,,,,,,,,,,-,12,
27,B50,AGUNG TRI LAKSONO,27/06/2025,-,-,-,-,-,,,,,,,,,,,,,,,,,,,,7,5,
28,B52,AGUNG TEJA NUGRAHA,28/06/2025,-,-,-,-,-,,,,,,,,,,,,,,,,,,,,8,4,
29,C01,RAHMAN HIDAYAT,15/03/2025,-,-,,,,,,,,,,,,,,,,,,,,,,,12,3,`;

const wb = XLSX.utils.book_new();

// Sheet 2026
const ws2026 = XLSX.utils.aoa_to_sheet(sheet2026Csv.split('\n').map(row => row.split(',')));
XLSX.utils.book_append_sheet(wb, ws2026, '2026');

// Sheet rekapan iuran dari awal
const wsRekapAwal = XLSX.utils.aoa_to_sheet(sheetRekapAwalCsv.split('\n').map(row => row.split(',')));
XLSX.utils.book_append_sheet(wb, wsRekapAwal, 'rekapan iuran dari awal');

const outPath = path.join(process.cwd(), 'data', 'paradessa_existing_workbook.xlsx');
XLSX.writeFile(wb, outPath);
console.log('Successfully created:', outPath);
