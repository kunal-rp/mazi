-- MySQL dump 10.13  Distrib 5.7.17, for macos10.12 (x86_64)
--
-- Host: us-cdbr-iron-east-05.cleardb.net    Database: heroku_f95ea9c68d995b3
-- ------------------------------------------------------
-- Server version	5.6.36-log

/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET @OLD_CHARACTER_SET_RESULTS=@@CHARACTER_SET_RESULTS */;
/*!40101 SET @OLD_COLLATION_CONNECTION=@@COLLATION_CONNECTION */;
/*!40101 SET NAMES utf8 */;
/*!40103 SET @OLD_TIME_ZONE=@@TIME_ZONE */;
/*!40103 SET TIME_ZONE='+00:00' */;
/*!40014 SET @OLD_UNIQUE_CHECKS=@@UNIQUE_CHECKS, UNIQUE_CHECKS=0 */;
/*!40014 SET @OLD_FOREIGN_KEY_CHECKS=@@FOREIGN_KEY_CHECKS, FOREIGN_KEY_CHECKS=0 */;
/*!40101 SET @OLD_SQL_MODE=@@SQL_MODE, SQL_MODE='NO_AUTO_VALUE_ON_ZERO' */;
/*!40111 SET @OLD_SQL_NOTES=@@SQL_NOTES, SQL_NOTES=0 */;

--
-- Table structure for table `_area`
--

DROP TABLE IF EXISTS `_area`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `_area` (
  `user_id` varchar(6) NOT NULL,
  `user_name` varchar(15) NOT NULL,
  `type` varchar(4) NOT NULL,
  `college_id` varchar(6) NOT NULL,
  `parkinglot_id` varchar(12) NOT NULL,
  `time` time NOT NULL,
  `socket_id` varchar(25) NOT NULL,
  `pickup_lat` decimal(13,10) NOT NULL,
  `pickup_lng` decimal(13,10) NOT NULL,
  PRIMARY KEY (`user_id`)
) ENGINE=InnoDB DEFAULT CHARSET=latin1;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `_area`
--

LOCK TABLES `_area` WRITE;
/*!40000 ALTER TABLE `_area` DISABLE KEYS */;
/*!40000 ALTER TABLE `_area` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `_connect`
--

DROP TABLE IF EXISTS `_connect`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `_connect` (
  `index_room_name` varchar(30) NOT NULL,
  `college_id` int(11) NOT NULL,
  `parkinglot_id` int(11) NOT NULL,
  `rider_user_id` varchar(6) NOT NULL,
  `parker_user_id` varchar(6) NOT NULL,
  `start_timestamp` varchar(11) NOT NULL,
  `pu_lat` decimal(13,10) NOT NULL,
  `pu_lng` decimal(13,10) NOT NULL,
  `match_status` varchar(15) NOT NULL,
  PRIMARY KEY (`index_room_name`)
) ENGINE=InnoDB DEFAULT CHARSET=latin1;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `_connect`
--

LOCK TABLES `_connect` WRITE;
/*!40000 ALTER TABLE `_connect` DISABLE KEYS */;
INSERT INTO `_connect` VALUES ('15062904719D8FD059849D',100013,2014,'9D8FD0','59849D','1506290471',34.0291250000,-117.7762600000,'0'),('15063250499D8FD059849D',100013,2014,'9D8FD0','59849D','1506325049',34.0291200000,-117.7763400000,'0'),('150634844259849DBEED04',100013,2014,'59849D','BEED04','1506348442',34.0291520000,-117.7763000000,'0'),('15067581939D8FD059849D',100010,2001,'9D8FD0','59849D','1506758193',34.0291560000,-117.7763800000,'0'),('150675883359849D9D8FD0',100010,2001,'59849D','9D8FD0','1506758833',34.0291250000,-117.7763300000,'1|9D8FD0'),('150675896259849D9D8FD0',100010,2001,'59849D','9D8FD0','1506758962',34.0291250000,-117.7763300000,'0'),('15067590169D8FD059849D',100010,2001,'9D8FD0','59849D','1506759016',34.0291000000,-117.7763700000,'2|59849D'),('15067597199D8FD059849D',100010,2001,'9D8FD0','59849D','1506759719',34.0291670000,-117.7763000000,'0'),('150675978459849D9D8FD0',100010,2001,'59849D','9D8FD0','1506759784',34.0291600000,-117.7763000000,'0'),('15067599199D8FD059849D',100010,2001,'9D8FD0','59849D','1506759919',34.0291370000,-117.7763060000,'0'),('15067600589D8FD059849D',100010,2001,'9D8FD0','59849D','1506760058',34.0291750000,-117.7763000000,'0'),('150683763459849D9D8FD0',100010,2001,'59849D','9D8FD0','1506837634',34.0291300000,-117.7762900000,'2|59849D'),('15068376549D8FD059849D',100010,2001,'9D8FD0','59849D','1506837654',34.0291630000,-117.7763750000,'2|9D8FD0'),('15068387739D8FD059849D',100010,2001,'9D8FD0','59849D','1506838773',34.0291440000,-117.7762800000,'0'),('15068387889D8FD059849D',100010,2001,'9D8FD0','59849D','1506838788',34.0291440000,-117.7762800000,'2|59849D'),('15068390909D8FD059849D',100010,2001,'9D8FD0','59849D','1506839090',34.0291020000,-117.7763100000,'2|9D8FD0'),('15068391999D8FD059849D',100010,2001,'9D8FD0','59849D','1506839199',34.0331500000,-117.7835000000,'2|59849D'),('15068392119D8FD059849D',100010,2001,'9D8FD0','59849D','1506839211',34.0291330000,-117.7763100000,'0'),('150683947559849D9D8FD0',100010,2001,'59849D','9D8FD0','1506839475',34.0291440000,-117.7763100000,'2|9D8FD0'),('15068395159D8FD059849D',100010,2001,'9D8FD0','59849D','1506839515',34.0292100000,-117.7762700000,'2|59849D'),('15068414009D8FD059849D',100010,2001,'9D8FD0','59849D','1506841400',34.0291300000,-117.7762900000,'2|9D8FD0'),('15068414159D8FD059849D',100010,2001,'9D8FD0','59849D','1506841415',34.0291250000,-117.7762900000,'2|9D8FD0'),('15068416579D8FD059849D',100010,2001,'9D8FD0','59849D','1506841657',34.0291250000,-117.7762900000,'0'),('15068934249D8FD059849D',100010,2001,'9D8FD0','59849D','1506893424',34.0291700000,-117.7763440000,'2|9D8FD0'),('150689349659849D9D8FD0',100010,2001,'59849D','9D8FD0','1506893496',34.0291980000,-117.7762800000,'2|59849D'),('150689356559849D9D8FD0',100010,2001,'59849D','9D8FD0','1506893565',34.0291750000,-117.7763060000,'2|9D8FD0'),('150689358959849D9D8FD0',100010,2001,'59849D','9D8FD0','1506893589',34.0291700000,-117.7763200000,'2|9D8FD0'),('15068936179D8FD059849D',100010,2001,'9D8FD0','59849D','1506893617',34.0291750000,-117.7763200000,'2|59849D'),('15068936339D8FD059849D',100010,2001,'9D8FD0','59849D','1506893633',34.0291750000,-117.7763200000,'2|59849D'),('15069243789D8FD059849D',100010,2001,'9D8FD0','59849D','1506924378',34.0291330000,-117.7763400000,'0'),('15069246059D8FD059849D',100010,2001,'9D8FD0','59849D','1506924605',34.0292300000,-117.7763700000,'2|59849D');
/*!40000 ALTER TABLE `_connect` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `college_info`
--

DROP TABLE IF EXISTS `college_info`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `college_info` (
  `college_name` varchar(50) NOT NULL,
  `college_id` int(11) NOT NULL,
  `college_version` int(3) NOT NULL,
  `college_coor_lng` decimal(13,10) NOT NULL,
  `college_coor_lat` decimal(13,10) NOT NULL,
  `num_exchanges` int(11) NOT NULL,
  `ride_limit` float NOT NULL,
  `park_limit` float NOT NULL,
  PRIMARY KEY (`college_name`),
  UNIQUE KEY `college_id` (`college_id`)
) ENGINE=InnoDB DEFAULT CHARSET=latin1;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `college_info`
--

LOCK TABLES `college_info` WRITE;
/*!40000 ALTER TABLE `college_info` DISABLE KEYS */;
INSERT INTO `college_info` VALUES ('California Polytechnic State University Pomona',100010,2,-117.8216050000,34.0565020000,0,0.5,2),('California Polytechnic State University SLO',100011,0,-120.6627620000,35.3051020000,0,0.7,3),('Mt. San Antonio College',100012,0,-117.8447650000,34.0477240000,0,0.7,3);
/*!40000 ALTER TABLE `college_info` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `parkinglot_info`
--

DROP TABLE IF EXISTS `parkinglot_info`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `parkinglot_info` (
  `parkinglot_id` int(11) NOT NULL,
  `college_id` int(11) NOT NULL,
  `parkinglot_name` varchar(25) NOT NULL,
  `coor_lat` float NOT NULL,
  `coor_lng` float NOT NULL,
  `num_exchanges` int(11) NOT NULL,
  PRIMARY KEY (`parkinglot_id`)
) ENGINE=InnoDB DEFAULT CHARSET=latin1;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `parkinglot_info`
--

LOCK TABLES `parkinglot_info` WRITE;
/*!40000 ALTER TABLE `parkinglot_info` DISABLE KEYS */;
INSERT INTO `parkinglot_info` VALUES (2001,100010,'Parking Lot J',34.0574,-117.829,0),(2002,100010,'Parking Lot M',34.0557,-117.83,0),(2003,100011,'H12',35.3048,-120.664,0),(2004,100011,'Visitor Parking',35.3054,-120.663,0),(2005,100010,'Parking Lot L',34.0554,-117.825,0),(2006,100010,'Parking Lot A',34.0605,-117.825,0),(2007,100010,'Parking Lot F1-F4',34.0617,-117.817,0),(2008,100010,'Parking Building 106',34.0604,-117.817,0),(2009,100012,'Parking Lot B',34.0442,-117.847,0),(2010,100012,'Parking Lot D',34.045,-117.845,0),(2014,100013,'Parking Lot E',34.0297,-117.777,0),(2017,100010,'Parking Lot H',34.0609,-117.819,0),(2018,100010,'Parking Structure 2',34.0519,-117.82,0),(2019,100010,'Parking Lot B',34.0519,-117.816,0);
/*!40000 ALTER TABLE `parkinglot_info` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `suggestions`
--

DROP TABLE IF EXISTS `suggestions`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `suggestions` (
  `id` varchar(17) NOT NULL,
  `timestamp` int(11) NOT NULL,
  `user_id` varchar(6) NOT NULL,
  `type` varchar(15) NOT NULL,
  `system_data` varchar(400) NOT NULL,
  `message` varchar(300) NOT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `suggestions`
--

LOCK TABLES `suggestions` WRITE;
/*!40000 ALTER TABLE `suggestions` DISABLE KEYS */;
INSERT INTO `suggestions` VALUES ('1507003468|9D8FD0',1507003468,'9D8FD0','Report a Bug','SERIAL: A9M0216825007748|MODEL: H1611|ID: HUAWEIH1611|Manufacture: HUAWEI|Brand: HUAWEI|Type: user|User: android|BASE: 1|INCREMENTAL: C07B170|SDK:  23|BOARD: H1611|BRAND: HUAWEI|HOST: localhost#1|FINGERPRINT: HUAWEI/H1611/HWH1611-Q:6.0.1/HUAWEIH1611/C07B170:user/release-keys|Version Code: 6.0.1','app will randomly sputter and go through different activities ');
/*!40000 ALTER TABLE `suggestions` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `suggestions_bugs`
--

DROP TABLE IF EXISTS `suggestions_bugs`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `suggestions_bugs` (
  `id` varchar(17) NOT NULL,
  `timestamp` int(11) NOT NULL,
  `user_id` varchar(6) NOT NULL,
  `type` varchar(15) NOT NULL,
  `system_data` varchar(400) NOT NULL,
  `message` varchar(300) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=latin1;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `suggestions_bugs`
--

LOCK TABLES `suggestions_bugs` WRITE;
/*!40000 ALTER TABLE `suggestions_bugs` DISABLE KEYS */;
INSERT INTO `suggestions_bugs` VALUES ('',2147483647,'9D8FD0','suggestion','Android|Version7.2|9853.8363','Can\'t log in'),('',2147483647,'59849D','Suggestion ','SERIAL: LGK37110090d4|MODEL: LG-K371|ID: MRA58K|Manufacture: LGE|Brand: lge|Type: user|User: jenkins|BASE: 1|INCREMENTAL: 1627312504f12|SDK:  23|BOARD: msm8909|BRAND: lge|HOST: LGEACI8R13|FINGERPRINT: lge/m1v_att_us/m1v:6.0/MRA58K/1627312504f12:user/release-keys|Version Code: 6.0','First teat for the suggestion reporting from androids '),('',2147483647,'9D8FD0','suggestion','Android|Version7.2|9853.8363','Can\'t log in'),('',2147483647,'9D8FD0','Report a Bug','SERIAL: A9M0216825007748|MODEL: H1611|ID: HUAWEIH1611|Manufacture: HUAWEI|Brand: HUAWEI|Type: user|User: android|BASE: 1|INCREMENTAL: C07B170|SDK:  23|BOARD: H1611|BRAND: HUAWEI|HOST: localhost#1|FINGERPRINT: HUAWEI/H1611/HWH1611-Q:6.0.1/HUAWEIH1611/C07B170:user/release-keys|Version Code: 6.0.1','this is my reaction'),('',2147483647,'9D8FD0','Suggestion ','SERIAL: A9M0216825007748|MODEL: H1611|ID: HUAWEIH1611|Manufacture: HUAWEI|Brand: HUAWEI|Type: user|User: android|BASE: 1|INCREMENTAL: C07B170|SDK:  23|BOARD: H1611|BRAND: HUAWEI|HOST: localhost#1|FINGERPRINT: HUAWEI/H1611/HWH1611-Q:6.0.1/HUAWEIH1611/C07B170:user/release-keys|Version Code: 6.0.1','fhff'),('',1505889334,'9D8FD0','Suggestion ','SERIAL: A9M0216825007748|MODEL: H1611|ID: HUAWEIH1611|Manufacture: HUAWEI|Brand: HUAWEI|Type: user|User: android|BASE: 1|INCREMENTAL: C07B170|SDK:  23|BOARD: H1611|BRAND: HUAWEI|HOST: localhost#1|FINGERPRINT: HUAWEI/H1611/HWH1611-Q:6.0.1/HUAWEIH1611/C07B170:user/release-keys|Version Code: 6.0.1','fhfff'),('',1505930795,'9D8FD0','Suggestion ','SERIAL: A9M0216825007748|MODEL: H1611|ID: HUAWEIH1611|Manufacture: HUAWEI|Brand: HUAWEI|Type: user|User: android|BASE: 1|INCREMENTAL: C07B170|SDK:  23|BOARD: H1611|BRAND: HUAWEI|HOST: localhost#1|FINGERPRINT: HUAWEI/H1611/HWH1611-Q:6.0.1/HUAWEIH1611/C07B170:user/release-keys|Version Code: 6.0.1','this is my suggestion : do nothing '),('',1506639834,'894CFC','Suggestion ','SERIAL: 9dd49693|MODEL: SM-G930T|ID: NRD90M|Manufacture: samsung|Brand: samsung|Type: user|User: dpi|BASE: 1|INCREMENTAL: G930TUVU4BQH7|SDK:  24|BOARD: msm8996|BRAND: samsung|HOST: SWDE2211|FINGERPRINT: samsung/heroqltetmo/heroqltetmo:7.0/NRD90M/G930TUVU4BQH7:user/release-keys|Version Code: 7.0','Program does not allow you to login unless u manually turn on GPS. So probably turning on the GPS automatically or allowing to login and then ask user to turn on the GPS. Also the current registration windows is very crowded so a better spacing/font is required. ');
/*!40000 ALTER TABLE `suggestions_bugs` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `user_gen`
--

DROP TABLE IF EXISTS `user_gen`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `user_gen` (
  `user_id` varchar(6) NOT NULL,
  `rating` float NOT NULL,
  `total_matches` int(11) NOT NULL,
  `status` varchar(15) NOT NULL,
  `promo_user` varchar(6) DEFAULT NULL,
  PRIMARY KEY (`user_id`)
) ENGINE=InnoDB DEFAULT CHARSET=latin1;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `user_gen`
--

LOCK TABLES `user_gen` WRITE;
/*!40000 ALTER TABLE `user_gen` DISABLE KEYS */;
INSERT INTO `user_gen` VALUES ('12D294',5,0,'',NULL),('15371',5,0,'',NULL),('26037B',5,0,'',NULL),('27B169',5,0,'',NULL),('29A51B',5,0,'',NULL),('29B1FC',5,0,'',NULL),('3D63C1',5,0,'',NULL),('412D3A',5,0,'',NULL),('42F689',5,0,'',NULL),('43DA69',5,0,'',NULL),('47A3F9',5,0,'',NULL),('4892AD',5,0,'',NULL),('4E1F0C',5,0,'',NULL),('59849D',4.05224,67,'initial_connect',NULL),('6613D0',5,0,'',NULL),('663E55',5,0,'',NULL),('724BDB',5,0,'',NULL),('82B287',5,0,'',NULL),('894CFC',5,0,'',NULL),('8A1191',5,0,'',NULL),('8CF362',5,0,'',NULL),('9929F5',5,0,'',NULL),('9D8FD0',4.09016,61,'initial_connect',NULL),('AD6AD5',5,0,'',NULL),('BAB9AF',5,0,'',NULL),('BEED04',4.5,1,'initial_connect',NULL),('C941B2',5,0,'',NULL),('CB2436',5,0,'',NULL),('CF4BE0',5,0,'',NULL),('D52771',5,0,'',NULL),('E708E9',5,0,'',NULL),('EEAB3A',5,0,'',NULL),('FDA1B3',5,0,'',NULL);
/*!40000 ALTER TABLE `user_gen` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `user_prim`
--

DROP TABLE IF EXISTS `user_prim`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `user_prim` (
  `user_id` varchar(6) NOT NULL,
  `user_name` varchar(30) NOT NULL,
  `user_email` varchar(50) NOT NULL,
  `user_password` varchar(60) NOT NULL,
  `email_verified` tinyint(1) NOT NULL,
  `main_salt` varchar(30) NOT NULL,
  `create_timestamp` int(11) NOT NULL,
  PRIMARY KEY (`user_name`)
) ENGINE=InnoDB DEFAULT CHARSET=latin1;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `user_prim`
--

LOCK TABLES `user_prim` WRITE;
/*!40000 ALTER TABLE `user_prim` DISABLE KEYS */;
INSERT INTO `user_prim` VALUES ('E708E9','123','123@123.com','$2a$10$LmSlgzrH/xYMViq5WSYXJOWamsDG8Eq5CjjLmeekjL0e915Q1jjwu',0,'$2a$04$kqfgwOhByIyOn5ncHeNl5O',1506634141),('AD6AD5','ananth','ananth.baiju@yahoo.com','$2a$10$vtXD5ly7miuwtjNCKb0gaOXNkMDPwoW8hVWhMKl./.Qg36C84KUQu',1,'$2a$04$tsK85KlOAlxuJfGM4X3Oxu',1506646644),('D52771','anthony','sepulveda@outlook.at','$2a$10$eZMOwLkBy2KfZfUe5C7lTOvGzJUvtIJ/1.e.kM2BUV/xvWFy6YfZa',0,'$2a$04$2n39QLmtAAWuUKNyGryNd.',1506665766),('29A51B','bunchiesonfire','jlverarosas@cpp.edu','$2a$10$e80DIyx4TODNHEW9BZRO5.x3U/t97FwKsU7pntGyiJ/Bj1tYpiw8.',1,'$2a$04$TenEhHYKzWzTJCUxNV002.',1506925562),('EEAB3A','chen106','j4ye.chen@gmail.com','$2a$10$y/yijbnzKejSv1V/TcBUAOE9igbmb41SUnhj2uzanmVpG1d09OooW',1,'$2a$04$2IiiI1OIVctOUTzZQ2TvkO',1506654347),('4892AD','coboba','cnguyen235@yahoo.com','$2a$10$zT/3mHQYnA1R14sDcB.aF.HORPNf0RiR.7S8PNLmDzkVTw5jJT0mS',1,'$2a$04$f43Dh2tJgkllKGdbLxU1De',1506630937),('15371','crazyduke','dreamdude010@gmajl.com','$2a$10$BjrftTkXlIemUKo3nkMqVesbi6YcaarYBuUISVizJq4XJ.iG03zSu',0,'$2a$04$phvmxzfL3AzAFmY3EDB5k.',1506631210),('43DA69','dianachoi','dianachoi@cpp.edu','$2a$10$8ymbF9kJbwEHQuI.YArtQe9p8aIYrYMYkgZeevT69Rn4g/IaAKbtq',1,'$2a$04$KHAlw8P6Yp2l1cko86g8B.',1506706515),('FDA1B3','droura','davidroura17@live.com','$2a$10$Z0PNEWeOKXVJY10VJ2/8seEMuTGcZBb6Sd5GtHOIgVZkR9ivCSzVS',1,'$2a$04$c8mx5IrA6R57Mk87XktY3.',1506634954),('6613D0','ethan_scott','ebmrules@gmail.com','$2a$10$6V.Umj0CfrQ5MR9TX4ljze.eEIuTvbAItcgDQEVzAAsmMUCOg9mc6',0,'$2a$04$dk6a2ZLxaeiwNOrrdnyiH.',1506638305),('9929F5','evan3826','standardly@gmail.com','$2a$10$euJJs9yiMELaBNVoZy78FOWIr5ALSNx5Zh4R6xHVKqeR/3Lg4ediK',1,'$2a$04$jJDpU3LYEmRKnP6OHGox.e',1506641361),('47A3F9','gerbilord','Apcois@cpp.edu','$2a$10$kbKIh7qLtjaqcdkAa7vAauXPr4wDVOIags4sEoipnFDVr1a0zVhxq',0,'$2a$04$8hp0VMxAT8nyWFV1qLPdH.',1506361709),('8A1191','help','krpurohit@cpp.edu','$2a$10$7Wqj8AEYF./Ue4WY0DFt.ezubZvQb88baKLeyDhsTZHqGWz.OzdMy',1,'$2a$04$VPNB9JYTUetmZSO/VmpvLu',1506366084),('663E55','jktruong','jktruong@cpp.edu','$2a$10$EvBCS71KUNMKSHFe915GJesohnwv2lvrTJucHyVZPZtaLgR2tQPQe',1,'$2a$04$.6R1LRIKOcEBj31aqu8XVe',1506754076),('8CF362','jonjitsu','jcamarillo88@gmail.com','$2a$10$JoipcGguvQtQweEJKZ2WiOo6V8hmnWZovyywCnbji.Qv4PEkG//7G',1,'$2a$04$5zOOkGYVLJwgrQfdj9Jg7u',1506792954),('26037B','jordanharris','jordanharris@cpp.edu','$2a$10$mOJ2pufnnTfdZPWTLOX70eb8zkmIxczAnmqy1Pyq.zpJVXIxxdp2y',1,'$2a$04$AhDrw0H4nF38DnSTio8gme',1506644273),('9D8FD0','krp','aiamsimba@gmail.com','$2a$10$vYD5KbkiibokKXYXnD1RAep1xY/XsXvEG4N0fqbTdnhHL2Nfc0E8.',1,'$2a$04$LJVxHDBhOHfYjYDE.4EEJ.',2147483647),('82B287','kunal','aiamsimba@gmail.com','$2a$10$.I2EDWoYjQV0gRd2l4p3qe.D9FQdDB1CvpUqW5gNinl4frrp/RFgG',1,'$2a$04$C7P5F50iBp8W3a/tntZ6gu',2147483647),('4E1F0C','meat_titan','ashot9817@gmail.com','$2a$10$4fBZ0W1fdaDUNKa3LDQPnuMIfZ2.8ahMDillodnWvFkPPSaXkbM3C',1,'$2a$04$GpfBV9GRLczoViN986qVnu',1506657730),('27B169','mrdanley','ledaniel89@yahoo.com','$2a$10$zOzXdOAWVhJXuN3DEaNwPOpevpho7sqHhzRIbI3cusy4H8wubrLWm',1,'$2a$04$qSKjQr98pm9r47gR7mqhmO',1506699277),('42F689','mrvitaltime','ajlin@cpp.edu','$2a$10$SkU8CTULr3HPUyUetal8uuYSxYodgPGGSIB1bvBTE2K4BC4uW6TOu',1,'$2a$04$NCOQwrsuhNYyfu5rzsBZe.',1506926505),('724BDB','orphen','AQuach89@gmail.com','$2a$10$fuZAJOmGLizIAu5BsGCOp.lCYMncSODPYZgsuD2W4RB4nG.yYSA32',1,'$2a$04$UFzsfJAEyiWYECyJW5vqtu',1506649954),('59849D','ram','Raj.purohit@hotmail.com','$2a$10$MutgCduqlUWlsbhRIAwQIO1HzQ3PxJY3HX7vI.b547sTYgmmpksjO',1,'$2a$04$6hgxSmrBfuUtltjAy9xXru',2147483647),('12D294','rosoter','macedojakob@gmail.con','$2a$10$eDlsyj5MnmvmrMR6/OxTQuecye9y3XNLKFcBrussoIjx1gqMXPXha',0,'$2a$04$sKZP0jq6C0WrE2GFPgpa1.',1506630692),('BAB9AF','rosoter08','macedojakob@gmail.com','$2a$10$/GiBiwqsLEtaszH7TX03f.2sbMI0I3sMoVl.4tmuzr1zfJanmzpPS',1,'$2a$04$buxbZED5cFNZvOL7LdhWoO',1506661542),('CB2436','snowfire','snowfire5492@yahoo.com','$2a$10$UhLnL9y2CpRFBo1KaP8BpuSpVqE4Z09zLp8eRnuzmsevX24LNvWtC',0,'$2a$04$JCHyNk8UZtcuhV/nIMS5J.',1506655162),('BEED04','support','krp.reg@outlook.com','$2a$10$ujXwyukP.PLZpmkJ4KG4eOFUwiO3Bz/xlHJphcprTyUyqBUDKaW3u',1,'$2a$04$8929Ce0raqw4QYXyiUKpWe',2147483647),('CF4BE0','theman','kunal.rajpurohit@hotmail.com','$2a$10$Sl1i3YEUvdqAOgpx6QFPk.nzPbDge08ihbBxwnzG6WQblN.eAnDD.',1,'$2a$04$zNSGsCo7vg4tR9IftQCaiO',1506631393),('894CFC','thomas','Tpashangian@cpp.edu','$2a$10$CXZ4DceZtsBpnuH0Vi4AoOP4A5W5sC7bZN29n9hzZr/0bpqpm8Lhy',1,'$2a$04$bpFmbkqqRVI5Fwxsn8aVEu',1506639553),('412D3A','tienphat41','tienphat41@gmail.com','$2a$10$khiEhR/RRc8ci4TROXD.Du3HPOPUbYmzCo1.zR10quoTUIfBYtHXa',1,'$2a$04$5la9kq2CTMMuAbplmglJqu',1506651560),('C941B2','tonythetiger','asepulveda1@cpp.edu','$2a$10$3GjBJrwCROjQacC9T6O/4ug9jL2pH.je2Yuwp1g.uUpz3k6VzOoEu',1,'$2a$04$vXXSGAElrCDW6IN2CNYS6e',1506635941),('29B1FC','vierve','Kunal.r.rajpurohit@gmail.com','$2a$10$7xUd.U1iT3KaADIorJI03.j5EoJy4IJ.bKkB4LczL25V5d8Gw7Wzy',1,'$2a$04$gxdPF0DEw4iITlCJbdvQa.',2147483647),('3D63C1','yeramy','yeramhwang@cpp.edu','$2a$10$6ceNDxquc4JQ3HMl1A5rV.dqahiRR7JHRyAgVbVew.8WvfKOxdI7K',1,'$2a$04$.oooztPjc1pLq9Ny5oyHK.',1506653702);
/*!40000 ALTER TABLE `user_prim` ENABLE KEYS */;
UNLOCK TABLES;
/*!40103 SET TIME_ZONE=@OLD_TIME_ZONE */;

/*!40101 SET SQL_MODE=@OLD_SQL_MODE */;
/*!40014 SET FOREIGN_KEY_CHECKS=@OLD_FOREIGN_KEY_CHECKS */;
/*!40014 SET UNIQUE_CHECKS=@OLD_UNIQUE_CHECKS */;
/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
/*!40111 SET SQL_NOTES=@OLD_SQL_NOTES */;

-- Dump completed on 2017-10-03 11:59:35
