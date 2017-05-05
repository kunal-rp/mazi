-- phpMyAdmin SQL Dump
-- version 4.5.2
-- http://www.phpmyadmin.net
--
-- Host: localhost
-- Generation Time: May 05, 2017 at 06:55 AM
-- Server version: 10.1.19-MariaDB
-- PHP Version: 7.0.13

SET SQL_MODE = "NO_AUTO_VALUE_ON_ZERO";
SET time_zone = "+00:00";


/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET @OLD_CHARACTER_SET_RESULTS=@@CHARACTER_SET_RESULTS */;
/*!40101 SET @OLD_COLLATION_CONNECTION=@@COLLATION_CONNECTION */;
/*!40101 SET NAMES utf8mb4 */;

--
-- Database: `parking`
--

-- --------------------------------------------------------

--
-- Table structure for table `100010_area`
--

CREATE TABLE `100010_area` (
  `user_id` int(11) NOT NULL,
  `user_name` varchar(15) NOT NULL,
  `type` varchar(4) NOT NULL,
  `parkinglot_id` varchar(12) NOT NULL,
  `time` time NOT NULL,
  `socket_id` varchar(25) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=latin1;

-- --------------------------------------------------------

--
-- Table structure for table `100011_area`
--

CREATE TABLE `100011_area` (
  `user_id` int(11) NOT NULL,
  `user_name` varchar(15) NOT NULL,
  `parkinglot_id` varchar(12) NOT NULL,
  `time` time NOT NULL,
  `type` varchar(4) NOT NULL,
  `socket_id` varchar(25) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=latin1;

-- --------------------------------------------------------

--
-- Table structure for table `college_info`
--

CREATE TABLE `college_info` (
  `college_name` varchar(50) NOT NULL,
  `college_id` int(11) NOT NULL,
  `college_coor_lng` decimal(13,10) NOT NULL,
  `college_coor_lat` decimal(13,10) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=latin1;

--
-- Dumping data for table `college_info`
--

INSERT INTO `college_info` (`college_name`, `college_id`, `college_coor_lng`, `college_coor_lat`) VALUES
('California Polytechnic State University , SLO', 100011, '-120.6627620000', '35.3051020000'),
('California Polytechnic State University,Pomona', 100010, '-117.8216050000', '34.0565020000');

-- --------------------------------------------------------

--
-- Table structure for table `parkinglot_info`
--

CREATE TABLE `parkinglot_info` (
  `parkinglot_id` int(11) NOT NULL,
  `college_id` int(11) NOT NULL,
  `parkinglot_name` varchar(25) NOT NULL,
  `coor_lat` float NOT NULL,
  `coor_lng` float NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=latin1;

--
-- Dumping data for table `parkinglot_info`
--

INSERT INTO `parkinglot_info` (`parkinglot_id`, `college_id`, `parkinglot_name`, `coor_lat`, `coor_lng`) VALUES
(2001, 100010, 'Parking Lot J', 34.0574, -117.829),
(2002, 100010, 'Parking Lot M', 34.0557, -117.83),
(2003, 100011, 'H12', 35.3048, -120.664),
(2004, 100011, 'Visitor Parking', 35.3054, -120.663);

--
-- Indexes for dumped tables
--

--
-- Indexes for table `100010_area`
--
ALTER TABLE `100010_area`
  ADD PRIMARY KEY (`user_id`);

--
-- Indexes for table `100011_area`
--
ALTER TABLE `100011_area`
  ADD PRIMARY KEY (`user_id`);

--
-- Indexes for table `college_info`
--
ALTER TABLE `college_info`
  ADD PRIMARY KEY (`college_name`),
  ADD UNIQUE KEY `college_id` (`college_id`);

--
-- Indexes for table `parkinglot_info`
--
ALTER TABLE `parkinglot_info`
  ADD PRIMARY KEY (`parkinglot_id`);

/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
