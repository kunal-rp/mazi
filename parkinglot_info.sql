-- phpMyAdmin SQL Dump
-- version 4.5.2
-- http://www.phpmyadmin.net
--
-- Host: localhost
-- Generation Time: May 05, 2017 at 04:42 AM
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
-- Indexes for table `parkinglot_info`
--
ALTER TABLE `parkinglot_info`
  ADD PRIMARY KEY (`parkinglot_id`);

/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
