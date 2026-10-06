-- MariaDB dump 10.19  Distrib 10.4.32-MariaDB, for Win64 (AMD64)
--
-- Host: localhost    Database: arenax
-- ------------------------------------------------------
-- Server version	10.4.32-MariaDB

/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET @OLD_CHARACTER_SET_RESULTS=@@CHARACTER_SET_RESULTS */;
/*!40101 SET @OLD_COLLATION_CONNECTION=@@COLLATION_CONNECTION */;
/*!40101 SET NAMES utf8mb4 */;
/*!40103 SET @OLD_TIME_ZONE=@@TIME_ZONE */;
/*!40103 SET TIME_ZONE='+00:00' */;
/*!40014 SET @OLD_UNIQUE_CHECKS=@@UNIQUE_CHECKS, UNIQUE_CHECKS=0 */;
/*!40014 SET @OLD_FOREIGN_KEY_CHECKS=@@FOREIGN_KEY_CHECKS, FOREIGN_KEY_CHECKS=0 */;
/*!40101 SET @OLD_SQL_MODE=@@SQL_MODE, SQL_MODE='NO_AUTO_VALUE_ON_ZERO' */;
/*!40111 SET @OLD_SQL_NOTES=@@SQL_NOTES, SQL_NOTES=0 */;

--
-- Table structure for table `bracket_advancement`
--

DROP TABLE IF EXISTS `bracket_advancement`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `bracket_advancement` (
  `advancement_id` int(11) NOT NULL AUTO_INCREMENT,
  `source_match_id` int(11) NOT NULL,
  `destination_match_id` int(11) NOT NULL,
  `outcome_type` enum('winner','loser') NOT NULL,
  `destination_side` enum('A','B') NOT NULL,
  PRIMARY KEY (`advancement_id`),
  KEY `source_match_id` (`source_match_id`),
  KEY `destination_match_id` (`destination_match_id`),
  CONSTRAINT `bracket_advancement_ibfk_1` FOREIGN KEY (`source_match_id`) REFERENCES `match` (`match_id`) ON DELETE CASCADE,
  CONSTRAINT `bracket_advancement_ibfk_2` FOREIGN KEY (`destination_match_id`) REFERENCES `match` (`match_id`) ON DELETE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=701 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `bracket_advancement`
--

LOCK TABLES `bracket_advancement` WRITE;
/*!40000 ALTER TABLE `bracket_advancement` DISABLE KEYS */;
/*!40000 ALTER TABLE `bracket_advancement` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `free_agent_profile`
--

DROP TABLE IF EXISTS `free_agent_profile`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `free_agent_profile` (
  `free_agent_id` int(11) NOT NULL AUTO_INCREMENT,
  `game_account_id` int(11) NOT NULL,
  `availability_status` varchar(30) NOT NULL,
  `preferred_role` varchar(30) DEFAULT NULL,
  PRIMARY KEY (`free_agent_id`),
  UNIQUE KEY `game_account_id` (`game_account_id`),
  CONSTRAINT `free_agent_profile_ibfk_1` FOREIGN KEY (`game_account_id`) REFERENCES `game_account` (`account_id`) ON DELETE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=8 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `free_agent_profile`
--

LOCK TABLES `free_agent_profile` WRITE;
/*!40000 ALTER TABLE `free_agent_profile` DISABLE KEYS */;
INSERT INTO `free_agent_profile` VALUES (1,5,'unavailable','Carry'),(2,7,'unavailable','Marksman'),(3,8,'unavailable','support'),(4,9,'unavailable','mid'),(5,10,'unavailable','Mid Lane'),(7,15,'unavailable',NULL);
/*!40000 ALTER TABLE `free_agent_profile` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `game`
--

DROP TABLE IF EXISTS `game`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `game` (
  `game_id` int(11) NOT NULL AUTO_INCREMENT,
  `game_name` varchar(50) NOT NULL,
  `short_code` varchar(10) NOT NULL,
  PRIMARY KEY (`game_id`),
  UNIQUE KEY `game_name` (`game_name`),
  UNIQUE KEY `short_code` (`short_code`)
) ENGINE=InnoDB AUTO_INCREMENT=38 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `game`
--

LOCK TABLES `game` WRITE;
/*!40000 ALTER TABLE `game` DISABLE KEYS */;
INSERT INTO `game` VALUES (1,'Dota 2','DOTA2'),(2,'League of Legends','LOL'),(3,'Mobile Legends: Bang Bang','MLBB'),(4,'Honor of Kings','HOK');
/*!40000 ALTER TABLE `game` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `game_account`
--

DROP TABLE IF EXISTS `game_account`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `game_account` (
  `account_id` int(11) NOT NULL AUTO_INCREMENT,
  `user_id` int(11) NOT NULL,
  `game_id` int(11) NOT NULL,
  `game_username` varchar(50) NOT NULL,
  `game_uid` varchar(50) NOT NULL,
  `server_region` varchar(30) DEFAULT NULL,
  `is_free_agent` tinyint(1) NOT NULL DEFAULT 0,
  `university` varchar(100) DEFAULT NULL,
  PRIMARY KEY (`account_id`),
  UNIQUE KEY `game_id` (`game_id`,`game_uid`),
  UNIQUE KEY `unique_user_game` (`user_id`,`game_id`),
  CONSTRAINT `game_account_ibfk_1` FOREIGN KEY (`user_id`) REFERENCES `user` (`user_id`) ON DELETE CASCADE,
  CONSTRAINT `game_account_ibfk_2` FOREIGN KEY (`game_id`) REFERENCES `game` (`game_id`) ON DELETE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=3817 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `game_account`
--

LOCK TABLES `game_account` WRITE;
/*!40000 ALTER TABLE `game_account` DISABLE KEYS */;
INSERT INTO `game_account` VALUES (1,1,4,'AV.AEGON','69237716109636952','Bangladesh',0,'United International University'),(2,2,4,'AX.TestPlayer','123456789','Bangladesh',1,'United International University'),(3,3,4,'AV.Oishi','123456','SEA',1,'UIU'),(4,3,3,'OIshiop','2784632984','SEA',1,'United International University'),(5,4,4,'oishi78gg','13498571934257','SEA',0,'DU'),(6,5,4,'CaptainA_HOK','HOK-CAPTAIN-001','SEA',0,'UIU'),(7,7,4,'PlayerB_HOK','HOK-PLAYER-001','SEA',0,'UIU'),(8,8,4,'playerC','1234','SEA',0,'UIU'),(9,9,4,'gg','3245346456','SEA',0,'nsu'),(10,13,4,'Aegon','129834794','SEA',0,'UIU'),(11,13,1,'Aeggg',',.,./!!@@','SEA',0,'UIU'),(12,16,2,'rohan11','16524376527635','SEA',0,'EWE'),(13,16,4,'rohan11','123445543','SEA',0,NULL),(15,18,4,'oishii1122','1231234','SEA',0,'uiu'),(16,1,1,'NEw Dota','394865834759347','SEA',0,'NNH');
/*!40000 ALTER TABLE `game_account` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `match`
--

DROP TABLE IF EXISTS `match`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `match` (
  `match_id` int(11) NOT NULL AUTO_INCREMENT,
  `stage_id` int(11) NOT NULL,
  `status` enum('scheduled','live','completed') NOT NULL DEFAULT 'scheduled',
  `scheduled_time` timestamp NULL DEFAULT NULL,
  `lobby_code` varchar(20) DEFAULT NULL,
  `server_region` varchar(30) DEFAULT NULL,
  `draft_mode` varchar(30) DEFAULT NULL,
  `round_number` int(11) NOT NULL,
  `bracket_position` int(11) NOT NULL,
  `group_id` int(11) DEFAULT NULL,
  `bracket_type` enum('group','play_in','upper','lower','grand_final') DEFAULT 'group',
  PRIMARY KEY (`match_id`),
  KEY `stage_id` (`stage_id`),
  KEY `fk_match_group_id` (`group_id`),
  CONSTRAINT `fk_match_group_id` FOREIGN KEY (`group_id`) REFERENCES `stage_group` (`group_id`) ON DELETE CASCADE,
  CONSTRAINT `match_ibfk_1` FOREIGN KEY (`stage_id`) REFERENCES `tournament_stage` (`stage_id`) ON DELETE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=3793 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `match`
--

LOCK TABLES `match` WRITE;
/*!40000 ALTER TABLE `match` DISABLE KEYS */;
/*!40000 ALTER TABLE `match` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `match_participant`
--

DROP TABLE IF EXISTS `match_participant`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `match_participant` (
  `match_participant_id` int(11) NOT NULL AUTO_INCREMENT,
  `match_id` int(11) NOT NULL,
  `registration_id` int(11) NOT NULL,
  `side` enum('A','B') NOT NULL,
  PRIMARY KEY (`match_participant_id`),
  UNIQUE KEY `match_id` (`match_id`,`side`),
  UNIQUE KEY `match_id_2` (`match_id`,`registration_id`),
  KEY `registration_id` (`registration_id`),
  CONSTRAINT `match_participant_ibfk_1` FOREIGN KEY (`match_id`) REFERENCES `match` (`match_id`) ON DELETE CASCADE,
  CONSTRAINT `match_participant_ibfk_2` FOREIGN KEY (`registration_id`) REFERENCES `registration` (`registration_id`) ON DELETE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=6891 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `match_participant`
--

LOCK TABLES `match_participant` WRITE;
/*!40000 ALTER TABLE `match_participant` DISABLE KEYS */;
/*!40000 ALTER TABLE `match_participant` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `match_result`
--

DROP TABLE IF EXISTS `match_result`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `match_result` (
  `result_id` int(11) NOT NULL AUTO_INCREMENT,
  `match_id` int(11) NOT NULL,
  `winning_registration_id` int(11) NOT NULL,
  `submitted_by` int(11) NOT NULL,
  `status` enum('SUBMITTED','VERIFIED','REJECTED') NOT NULL DEFAULT 'SUBMITTED',
  `confirmed_at` timestamp NULL DEFAULT NULL,
  `team_a_kills` int(11) NOT NULL DEFAULT 0,
  `team_b_kills` int(11) NOT NULL DEFAULT 0,
  `evidence_url` varchar(255) DEFAULT NULL,
  `submitted_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `verified_by` int(11) DEFAULT NULL,
  `verified_at` timestamp NULL DEFAULT NULL,
  PRIMARY KEY (`result_id`),
  UNIQUE KEY `match_id` (`match_id`),
  KEY `winning_registration_id` (`winning_registration_id`),
  KEY `submitted_by` (`submitted_by`),
  KEY `fk_match_result_verified_by` (`verified_by`),
  CONSTRAINT `fk_match_result_verified_by` FOREIGN KEY (`verified_by`) REFERENCES `user` (`user_id`),
  CONSTRAINT `match_result_ibfk_1` FOREIGN KEY (`match_id`) REFERENCES `match` (`match_id`) ON DELETE CASCADE,
  CONSTRAINT `match_result_ibfk_2` FOREIGN KEY (`winning_registration_id`) REFERENCES `registration` (`registration_id`),
  CONSTRAINT `match_result_ibfk_3` FOREIGN KEY (`submitted_by`) REFERENCES `user` (`user_id`)
) ENGINE=InnoDB AUTO_INCREMENT=1264 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `match_result`
--

LOCK TABLES `match_result` WRITE;
/*!40000 ALTER TABLE `match_result` DISABLE KEYS */;
/*!40000 ALTER TABLE `match_result` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `moba_game_result`
--

DROP TABLE IF EXISTS `moba_game_result`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `moba_game_result` (
  `game_result_id` int(11) NOT NULL AUTO_INCREMENT,
  `series_id` int(11) NOT NULL,
  `game_number` int(11) NOT NULL,
  `winner_registration_id` int(11) NOT NULL,
  `duration_seconds` int(11) NOT NULL,
  PRIMARY KEY (`game_result_id`),
  UNIQUE KEY `series_id` (`series_id`,`game_number`),
  KEY `winner_registration_id` (`winner_registration_id`),
  CONSTRAINT `moba_game_result_ibfk_1` FOREIGN KEY (`series_id`) REFERENCES `moba_series` (`series_id`) ON DELETE CASCADE,
  CONSTRAINT `moba_game_result_ibfk_2` FOREIGN KEY (`winner_registration_id`) REFERENCES `registration` (`registration_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `moba_game_result`
--

LOCK TABLES `moba_game_result` WRITE;
/*!40000 ALTER TABLE `moba_game_result` DISABLE KEYS */;
/*!40000 ALTER TABLE `moba_game_result` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `moba_series`
--

DROP TABLE IF EXISTS `moba_series`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `moba_series` (
  `series_id` int(11) NOT NULL AUTO_INCREMENT,
  `match_id` int(11) NOT NULL,
  `best_of` enum('BO1','BO3','BO5') NOT NULL,
  `series_winner_registration_id` int(11) DEFAULT NULL,
  PRIMARY KEY (`series_id`),
  UNIQUE KEY `match_id` (`match_id`),
  KEY `series_winner_registration_id` (`series_winner_registration_id`),
  CONSTRAINT `moba_series_ibfk_1` FOREIGN KEY (`match_id`) REFERENCES `match` (`match_id`) ON DELETE CASCADE,
  CONSTRAINT `moba_series_ibfk_2` FOREIGN KEY (`series_winner_registration_id`) REFERENCES `registration` (`registration_id`)
) ENGINE=InnoDB AUTO_INCREMENT=493 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `moba_series`
--

LOCK TABLES `moba_series` WRITE;
/*!40000 ALTER TABLE `moba_series` DISABLE KEYS */;
/*!40000 ALTER TABLE `moba_series` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `registration`
--

DROP TABLE IF EXISTS `registration`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `registration` (
  `registration_id` int(11) NOT NULL AUTO_INCREMENT,
  `tournament_id` int(11) NOT NULL,
  `team_id` int(11) NOT NULL,
  `status` enum('pending','approved','rejected') NOT NULL DEFAULT 'pending',
  `seed_number` int(11) DEFAULT NULL,
  `registered_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `approved_at` timestamp NULL DEFAULT NULL,
  PRIMARY KEY (`registration_id`),
  UNIQUE KEY `tournament_id` (`tournament_id`,`team_id`),
  KEY `team_id` (`team_id`),
  CONSTRAINT `registration_ibfk_1` FOREIGN KEY (`tournament_id`) REFERENCES `tournament` (`tournament_id`) ON DELETE CASCADE,
  CONSTRAINT `registration_ibfk_2` FOREIGN KEY (`team_id`) REFERENCES `team` (`team_id`) ON DELETE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=3803 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `registration`
--

LOCK TABLES `registration` WRITE;
/*!40000 ALTER TABLE `registration` DISABLE KEYS */;
INSERT INTO `registration` VALUES (2,4,6,'pending',NULL,'2026-09-29 08:40:04',NULL),(3,1,6,'pending',NULL,'2026-09-29 08:44:40',NULL),(3802,209,6,'approved',NULL,'2026-10-05 05:37:54','2026-10-05 05:40:10');
/*!40000 ALTER TABLE `registration` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `series_participant`
--

DROP TABLE IF EXISTS `series_participant`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `series_participant` (
  `series_participant_id` int(11) NOT NULL AUTO_INCREMENT,
  `series_id` int(11) NOT NULL,
  `registration_id` int(11) NOT NULL,
  `side` enum('A','B') NOT NULL,
  `game_wins` int(11) NOT NULL DEFAULT 0,
  PRIMARY KEY (`series_participant_id`),
  UNIQUE KEY `series_id` (`series_id`,`registration_id`),
  UNIQUE KEY `series_id_2` (`series_id`,`side`),
  KEY `registration_id` (`registration_id`),
  CONSTRAINT `series_participant_ibfk_1` FOREIGN KEY (`series_id`) REFERENCES `moba_series` (`series_id`) ON DELETE CASCADE,
  CONSTRAINT `series_participant_ibfk_2` FOREIGN KEY (`registration_id`) REFERENCES `registration` (`registration_id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `series_participant`
--

LOCK TABLES `series_participant` WRITE;
/*!40000 ALTER TABLE `series_participant` DISABLE KEYS */;
/*!40000 ALTER TABLE `series_participant` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `sessions`
--

DROP TABLE IF EXISTS `sessions`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `sessions` (
  `session_id` varchar(128) CHARACTER SET utf8mb4 COLLATE utf8mb4_bin NOT NULL,
  `expires` int(11) unsigned NOT NULL,
  `data` mediumtext CHARACTER SET utf8mb4 COLLATE utf8mb4_bin DEFAULT NULL,
  PRIMARY KEY (`session_id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `sessions`
--

LOCK TABLES `sessions` WRITE;
/*!40000 ALTER TABLE `sessions` DISABLE KEYS */;
INSERT INTO `sessions` VALUES ('_vgQ5dKOSUVRVz3FEuxlDT31eFdveHJa',1791350855,'{\"cookie\":{\"originalMaxAge\":86400000,\"expires\":\"2026-10-06T14:06:04.363Z\",\"secure\":false,\"httpOnly\":true,\"path\":\"/\"},\"userId\":3910}');
/*!40000 ALTER TABLE `sessions` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `stage_group`
--

DROP TABLE IF EXISTS `stage_group`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `stage_group` (
  `group_id` int(11) NOT NULL AUTO_INCREMENT,
  `stage_id` int(11) NOT NULL,
  `group_name` varchar(20) NOT NULL,
  `group_order` int(11) NOT NULL,
  PRIMARY KEY (`group_id`),
  UNIQUE KEY `stage_id` (`stage_id`,`group_name`),
  UNIQUE KEY `stage_id_2` (`stage_id`,`group_order`),
  UNIQUE KEY `group_id` (`group_id`,`stage_id`),
  CONSTRAINT `stage_group_ibfk_1` FOREIGN KEY (`stage_id`) REFERENCES `tournament_stage` (`stage_id`) ON DELETE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=659 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `stage_group`
--

LOCK TABLES `stage_group` WRITE;
/*!40000 ALTER TABLE `stage_group` DISABLE KEYS */;
/*!40000 ALTER TABLE `stage_group` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `stage_group_member`
--

DROP TABLE IF EXISTS `stage_group_member`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `stage_group_member` (
  `member_id` int(11) NOT NULL AUTO_INCREMENT,
  `group_id` int(11) NOT NULL,
  `stage_id` int(11) NOT NULL,
  `registration_id` int(11) NOT NULL,
  `slot_number` tinyint(4) NOT NULL,
  `final_rank` tinyint(4) DEFAULT NULL,
  `qualified` tinyint(1) DEFAULT NULL,
  `playoff_seed` int(11) DEFAULT NULL,
  `bye_status` tinyint(1) NOT NULL DEFAULT 0,
  PRIMARY KEY (`member_id`),
  UNIQUE KEY `stage_id` (`stage_id`,`registration_id`),
  UNIQUE KEY `group_id` (`group_id`,`slot_number`),
  UNIQUE KEY `group_id_2` (`group_id`,`registration_id`),
  KEY `group_id_3` (`group_id`,`stage_id`),
  KEY `registration_id` (`registration_id`),
  CONSTRAINT `stage_group_member_ibfk_1` FOREIGN KEY (`group_id`, `stage_id`) REFERENCES `stage_group` (`group_id`, `stage_id`) ON DELETE CASCADE,
  CONSTRAINT `stage_group_member_ibfk_2` FOREIGN KEY (`registration_id`) REFERENCES `registration` (`registration_id`) ON DELETE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=2621 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `stage_group_member`
--

LOCK TABLES `stage_group_member` WRITE;
/*!40000 ALTER TABLE `stage_group_member` DISABLE KEYS */;
/*!40000 ALTER TABLE `stage_group_member` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `team`
--

DROP TABLE IF EXISTS `team`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `team` (
  `team_id` int(11) NOT NULL AUTO_INCREMENT,
  `game_id` int(11) NOT NULL,
  `captain_id` int(11) NOT NULL,
  `team_name` varchar(50) NOT NULL,
  `team_tag` varchar(20) NOT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `status` enum('forming','active') NOT NULL DEFAULT 'forming',
  PRIMARY KEY (`team_id`),
  UNIQUE KEY `team_name` (`team_name`),
  UNIQUE KEY `team_tag` (`team_tag`),
  KEY `game_id` (`game_id`),
  KEY `captain_id` (`captain_id`),
  CONSTRAINT `team_ibfk_1` FOREIGN KEY (`game_id`) REFERENCES `game` (`game_id`),
  CONSTRAINT `team_ibfk_2` FOREIGN KEY (`captain_id`) REFERENCES `game_account` (`account_id`)
) ENGINE=InnoDB AUTO_INCREMENT=3812 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `team`
--

LOCK TABLES `team` WRITE;
/*!40000 ALTER TABLE `team` DISABLE KEYS */;
INSERT INTO `team` VALUES (2,4,2,'ArenaX Legends','AXL','2026-09-21 14:16:54','forming'),(3,4,3,'AntiGravity','AG','2026-09-22 05:05:45','forming'),(5,4,6,'ArenaX War','ARENAX','2026-09-22 07:43:32','active'),(6,4,1,'yut','T','2026-09-22 08:29:35','forming'),(7,1,11,'AOP','AP','2026-09-22 08:51:43','forming'),(11,2,12,'War02','ABCDE','2026-09-29 05:41:34','forming'),(12,1,16,'XYZ','XF','2026-09-29 08:46:09','forming');
/*!40000 ALTER TABLE `team` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `team_application`
--

DROP TABLE IF EXISTS `team_application`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `team_application` (
  `application_id` int(11) NOT NULL AUTO_INCREMENT,
  `team_id` int(11) NOT NULL,
  `game_account_id` int(11) NOT NULL,
  `status` enum('pending','accepted','rejected') NOT NULL DEFAULT 'pending',
  `applied_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `responded_at` timestamp NULL DEFAULT NULL,
  PRIMARY KEY (`application_id`),
  KEY `team_id` (`team_id`),
  KEY `game_account_id` (`game_account_id`),
  CONSTRAINT `team_application_ibfk_1` FOREIGN KEY (`team_id`) REFERENCES `team` (`team_id`) ON DELETE CASCADE,
  CONSTRAINT `team_application_ibfk_2` FOREIGN KEY (`game_account_id`) REFERENCES `game_account` (`account_id`) ON DELETE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=5 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `team_application`
--

LOCK TABLES `team_application` WRITE;
/*!40000 ALTER TABLE `team_application` DISABLE KEYS */;
INSERT INTO `team_application` VALUES (1,5,7,'rejected','2026-09-22 07:44:32','2026-09-22 07:47:23'),(2,5,7,'accepted','2026-09-22 07:47:44','2026-09-22 07:48:39'),(3,5,9,'accepted','2026-09-22 08:12:29','2026-09-22 08:12:48'),(4,5,13,'accepted','2026-09-29 06:11:40','2026-09-29 06:12:24');
/*!40000 ALTER TABLE `team_application` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `team_invitation`
--

DROP TABLE IF EXISTS `team_invitation`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `team_invitation` (
  `invitation_id` int(11) NOT NULL AUTO_INCREMENT,
  `team_id` int(11) NOT NULL,
  `game_account_id` int(11) NOT NULL,
  `status` enum('pending','accepted','rejected') NOT NULL DEFAULT 'pending',
  `sent_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `responded_at` timestamp NULL DEFAULT NULL,
  PRIMARY KEY (`invitation_id`),
  KEY `team_id` (`team_id`),
  KEY `game_account_id` (`game_account_id`),
  CONSTRAINT `team_invitation_ibfk_1` FOREIGN KEY (`team_id`) REFERENCES `team` (`team_id`) ON DELETE CASCADE,
  CONSTRAINT `team_invitation_ibfk_2` FOREIGN KEY (`game_account_id`) REFERENCES `game_account` (`account_id`) ON DELETE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=6 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `team_invitation`
--

LOCK TABLES `team_invitation` WRITE;
/*!40000 ALTER TABLE `team_invitation` DISABLE KEYS */;
INSERT INTO `team_invitation` VALUES (2,5,8,'accepted','2026-09-22 07:48:18','2026-09-22 07:48:24'),(3,5,9,'rejected','2026-09-22 08:11:54','2026-09-22 08:12:04'),(4,6,10,'accepted','2026-09-22 08:55:42','2026-09-22 08:55:57'),(5,5,15,'accepted','2026-09-29 06:46:28','2026-09-29 06:46:38');
/*!40000 ALTER TABLE `team_invitation` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `team_member`
--

DROP TABLE IF EXISTS `team_member`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `team_member` (
  `member_id` int(11) NOT NULL AUTO_INCREMENT,
  `team_id` int(11) NOT NULL,
  `game_account_id` int(11) NOT NULL,
  `role` enum('captain','player','substitute') NOT NULL,
  `is_substitute` tinyint(1) NOT NULL DEFAULT 0,
  `is_active` tinyint(1) NOT NULL DEFAULT 1,
  `joined_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `assigned_role` varchar(30) DEFAULT NULL,
  PRIMARY KEY (`member_id`),
  UNIQUE KEY `team_id` (`team_id`,`game_account_id`),
  KEY `game_account_id` (`game_account_id`),
  CONSTRAINT `team_member_ibfk_1` FOREIGN KEY (`team_id`) REFERENCES `team` (`team_id`) ON DELETE CASCADE,
  CONSTRAINT `team_member_ibfk_2` FOREIGN KEY (`game_account_id`) REFERENCES `game_account` (`account_id`) ON DELETE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=19 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `team_member`
--

LOCK TABLES `team_member` WRITE;
/*!40000 ALTER TABLE `team_member` DISABLE KEYS */;
INSERT INTO `team_member` VALUES (2,2,2,'captain',0,1,'2026-09-21 14:16:54',NULL),(3,3,3,'captain',0,1,'2026-09-22 05:05:45',NULL),(5,5,6,'captain',0,1,'2026-09-22 07:43:32',NULL),(6,5,8,'player',0,1,'2026-09-22 07:48:24',NULL),(7,5,7,'player',0,1,'2026-09-22 07:48:39','Jungler'),(8,5,9,'player',0,1,'2026-09-22 08:12:48','Jungler'),(9,6,1,'captain',0,1,'2026-09-22 08:29:35',NULL),(10,7,11,'captain',0,1,'2026-09-22 08:51:43',NULL),(11,6,10,'player',0,1,'2026-09-22 08:55:57',NULL),(15,11,12,'captain',0,1,'2026-09-29 05:41:34',NULL),(16,5,13,'player',0,1,'2026-09-29 06:12:24','Roam'),(17,5,15,'substitute',1,1,'2026-09-29 06:46:38',NULL),(18,12,16,'captain',0,1,'2026-09-29 08:46:09',NULL);
/*!40000 ALTER TABLE `team_member` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `tournament`
--

DROP TABLE IF EXISTS `tournament`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `tournament` (
  `tournament_id` int(11) NOT NULL AUTO_INCREMENT,
  `game_id` int(11) NOT NULL,
  `organizer_id` int(11) NOT NULL,
  `name` varchar(100) NOT NULL,
  `format` enum('single_elimination','double_elimination') NOT NULL,
  `status` enum('draft','published','live','completed') NOT NULL DEFAULT 'draft',
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  `registration_start_at` datetime DEFAULT NULL,
  `registration_end_at` datetime DEFAULT NULL,
  `prize_pool_usd` decimal(12,2) DEFAULT NULL,
  PRIMARY KEY (`tournament_id`),
  KEY `game_id` (`game_id`),
  KEY `organizer_id` (`organizer_id`),
  CONSTRAINT `tournament_ibfk_1` FOREIGN KEY (`game_id`) REFERENCES `game` (`game_id`),
  CONSTRAINT `tournament_ibfk_2` FOREIGN KEY (`organizer_id`) REFERENCES `user` (`user_id`)
) ENGINE=InnoDB AUTO_INCREMENT=210 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `tournament`
--

LOCK TABLES `tournament` WRITE;
/*!40000 ALTER TABLE `tournament` DISABLE KEYS */;
INSERT INTO `tournament` VALUES (1,4,15,'South Asia Legacy','single_elimination','published','2026-09-27 08:30:08',NULL,NULL,NULL),(2,4,15,'Summer Championshipp','single_elimination','published','2026-09-29 06:52:14',NULL,NULL,NULL),(3,4,15,'abcc','single_elimination','live','2026-09-29 08:35:42',NULL,NULL,NULL),(4,4,15,'yyyy','single_elimination','published','2026-09-29 08:39:44',NULL,NULL,NULL),(209,4,3910,'Amrica Tournament','double_elimination','published','2026-10-05 05:32:04',NULL,NULL,NULL);
/*!40000 ALTER TABLE `tournament` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `tournament_stage`
--

DROP TABLE IF EXISTS `tournament_stage`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `tournament_stage` (
  `stage_id` int(11) NOT NULL AUTO_INCREMENT,
  `tournament_id` int(11) NOT NULL,
  `stage_order` int(11) NOT NULL,
  `stage_name` varchar(50) NOT NULL,
  `stage_format` enum('group_stage','single_elimination','double_elimination') NOT NULL,
  `group_assignment_mode` enum('sequential','random') DEFAULT NULL,
  `group_generation_status` enum('not_generated','groups_assigned','matches_generated','qualified','bracket_generated') NOT NULL DEFAULT 'not_generated',
  `groups_generated_at` datetime DEFAULT NULL,
  PRIMARY KEY (`stage_id`),
  UNIQUE KEY `tournament_id` (`tournament_id`,`stage_order`),
  CONSTRAINT `tournament_stage_ibfk_1` FOREIGN KEY (`tournament_id`) REFERENCES `tournament` (`tournament_id`) ON DELETE CASCADE
) ENGINE=InnoDB AUTO_INCREMENT=231 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `tournament_stage`
--

LOCK TABLES `tournament_stage` WRITE;
/*!40000 ALTER TABLE `tournament_stage` DISABLE KEYS */;
INSERT INTO `tournament_stage` VALUES (1,1,3,'group','single_elimination',NULL,'not_generated',NULL),(2,1,2,'quaterfinal','single_elimination',NULL,'not_generated',NULL),(4,1,1,'semifiinal','single_elimination',NULL,'not_generated',NULL),(5,2,1,'group','single_elimination',NULL,'not_generated',NULL),(6,2,2,'semifinal','single_elimination',NULL,'not_generated',NULL),(7,2,3,'final','single_elimination',NULL,'not_generated',NULL),(8,3,1,'group','single_elimination',NULL,'not_generated',NULL),(9,3,2,'qurter final','single_elimination',NULL,'not_generated',NULL),(226,209,1,'Group Stage','single_elimination',NULL,'not_generated',NULL),(227,209,2,'Round of 16','single_elimination',NULL,'not_generated',NULL),(228,209,3,'Quarter Final','double_elimination',NULL,'not_generated',NULL),(229,209,4,'Semi Final','double_elimination',NULL,'not_generated',NULL),(230,209,5,'FINAL','single_elimination',NULL,'not_generated',NULL);
/*!40000 ALTER TABLE `tournament_stage` ENABLE KEYS */;
UNLOCK TABLES;

--
-- Table structure for table `user`
--

DROP TABLE IF EXISTS `user`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `user` (
  `user_id` int(11) NOT NULL AUTO_INCREMENT,
  `username` varchar(30) NOT NULL,
  `email` varchar(100) NOT NULL,
  `password_hash` varchar(255) NOT NULL,
  `role` enum('player','organizer') NOT NULL,
  `account_status` enum('active','suspended','banned') NOT NULL DEFAULT 'active',
  `is_email_verified` tinyint(1) NOT NULL DEFAULT 0,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp(),
  PRIMARY KEY (`user_id`),
  UNIQUE KEY `username` (`username`),
  UNIQUE KEY `email` (`email`)
) ENGINE=InnoDB AUTO_INCREMENT=3911 DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Dumping data for table `user`
--

LOCK TABLES `user` WRITE;
/*!40000 ALTER TABLE `user` DISABLE KEYS */;
INSERT INTO `user` VALUES (1,'aegon','aegon77@gmail.com','$2b$10$gaB.FY3e2S0podzgP/Ka8ebKDcVuPpEbi5nTFFwUUAFKBugyM2.ka','player','active',0,'2026-09-19 09:35:07'),(2,'aegon78','aegon78@gmail.com','$2b$10$tfzMro03Omj6nKVEY39AguO3UGqLWltg5J0.U250jzxwjlJVukreK','organizer','active',0,'2026-09-19 14:36:24'),(3,'oishi','oishi77@gmail.com','$2b$10$Km1v6IczlHlBhJaRNe5wI.YS.Di.CNh1brhrbuNswTUFSCnXc8tJa','player','active',0,'2026-09-22 05:03:29'),(4,'oishi78','oishi78@gmail.com','$2b$10$RLurik9swNo.TF0PgTIYteui0Y9KXWneX6kMIRibrYYj1D8pZRWSa','player','active',0,'2026-09-22 06:16:26'),(5,'CaptainA','captainA10@gmail.com','$2b$10$qh3m8WrEz1IN2QYH2Fg1FOQpphzlZEyGm8a/nTQ9921cwTotaU/iO','player','active',0,'2026-09-22 07:35:36'),(7,'PlayerB','playerB10@gmail.com','$2b$10$1j4PKDK4LvA3jRwrpCgFn.s2DaAxoxDCkffkRQXl9zZV5WdVl3N7W','player','active',0,'2026-09-22 07:38:14'),(8,'playerC','playerC10@gmail.com','$2b$10$6NMF9ZJcPZYb3t4dzNWwpuIoL8LUlMh8ozTf0szqShsYpgNjxDaXi','player','active',0,'2026-09-22 07:41:37'),(9,'gg','gg2@gmail.com','$2b$10$iUtd5ks9mugCbsRwKfXmkeFaArVpeSVtXgTY0n9paLcJ4FE9EVD6e','player','active',0,'2026-09-22 08:10:25'),(10,'Quibusdam temporibus','qoretivy@mailinator.com','$2b$10$n8yHfOKxcHRWi2i7HemO3e2o1yygXcekBKCll4gYEBtfTIugcpNMC','player','active',0,'2026-09-22 08:23:35'),(12,'ggp','ggp@gmail.com','$2b$10$ZAi3rBavKkz6.WHkp3nwmeGvHyHcf5X86BfLRn2sdu3InRJde5Cla','player','active',0,'2026-09-22 08:24:18'),(13,'Rejwan','rejwan77@gmail.com','$2b$10$N461HVDb/LLgRbJ.TBoQ4eg6t2VzOzCqdzfSx6IgXxxn5bDjpzHwi','player','active',0,'2026-09-22 08:36:35'),(15,'eshamoni','esha123@gmail.com','$2b$10$jJxfwlViBQopqAAVi4O2jOqEEB1PKH5e5QeazLZmXS1Hp4Ko4T9Bi','organizer','active',0,'2026-09-27 08:28:13'),(16,'rohan','rohan123@gmail.com','$2b$10$TIQresewurSs15L3KF7RQu67sbeEt8EHLKBbeo0/VPRzk20u3slF.','player','active',0,'2026-09-29 05:09:27'),(18,'oishi111','oishi123@gmail.com','$2b$10$hLXUBxkD9AdtH7P/JHl0xu4d.si6.IJSeaU99AUr5b6AK8z.Rx29m','player','active',0,'2026-09-29 06:16:40'),(3910,'AAegon','aegon70@gmail.com','$2b$10$vSf1A2prSgv4DxwxexW4HOaEyZYCMjweg6Pdxa7wd7.lYAbzkz1rK','organizer','active',0,'2026-10-05 05:31:17');
/*!40000 ALTER TABLE `user` ENABLE KEYS */;
UNLOCK TABLES;
/*!40103 SET TIME_ZONE=@OLD_TIME_ZONE */;

/*!40101 SET SQL_MODE=@OLD_SQL_MODE */;
/*!40014 SET FOREIGN_KEY_CHECKS=@OLD_FOREIGN_KEY_CHECKS */;
/*!40014 SET UNIQUE_CHECKS=@OLD_UNIQUE_CHECKS */;
/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
/*!40111 SET SQL_NOTES=@OLD_SQL_NOTES */;

-- Dump completed on 2026-10-06 11:47:17
