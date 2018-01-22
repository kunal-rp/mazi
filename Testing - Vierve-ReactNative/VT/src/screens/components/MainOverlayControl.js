import React, {Component} from 'react';
import {BackHandler, View} from 'react-native';

import Db_Helper_Data from '../../utils/Db_Helper_Data';
import Db_Helper_User from '../../utils/Db_Helper_User';
import ServerTools from '../../utils/ServerTools';

import CollegeOverlay from './CollegeOverlay';
import ParkingOverlay from './ParkingOverlay';
import PickupOverlay from './PickupOverlay';

class MainOverlayControl extends Component {
	constructor(props) {
		super(props);
		this.handlePark = this.handlePark.bind(this);
		this.handleRide = this.handleRide.bind(this);
		this.handleParkingSet = this.handleParkingSet.bind(this);
		this.handleParkingBack = this.handleParkingBack.bind(this);
		this.handlePickupSet = this.handlePickupSet.bind(this);
		this.handlePickupBack = this.handlePickupBack.bind(this);
		
		this.state= {
			screen : 0,
			riding: false,
			college: '',
			parkingLot: '',
		};
	}

	componentDidMount() {
		BackHandler.addEventListener('androidBackPress', function() {
			console.log("hello test backpressing")
		});
	}

	handlePark(college){
		this.setState({screen:1, riding: false, college: college});
	}

	handleRide(college){
		this.setState({screen:1, riding: true, college: college});
	}

	async handleParkingSet(parkingLot){
		if (this.state.riding){
			this.setState({screen:2, parkingLot: parkingLot});
		}
		else{
			let sessionData = await Db_Helper_User.getSessionData();
   		let ids = await Db_Helper_Data.getIds(this.state.college, parkingLot);
    	let response = await ServerTools.request({'token_user': sessionData.token_user, 'user_id': sessionData.user_id, 'action': 'request', 'college_id': ids.college_id, 'parkinglot_id': ids.parkinglot_id, type: 'park'});
    	console.log(response);

			this.props.navigator.push({
				screen: 'vt.WaitingScreen',
				backButtonHidden: true,
				passProps: {type: 'Parking Spot', college: this.state.college, parkingLot: parkingLot},
			});
		}
	}

	handlePickupSet() {
		this.props.navigator.push({
				screen: 'vt.WaitingScreen',
				backButtonHidden: true,
				passProps: {type: 'Ride', college: this.state.college, parkingLot: this.state.parkingLot},
		});
	}

	handleParkingBack(){
		// this.toggleNavBar('shown');
		this.setState({screen: 0});
	}

	handlePickupBack(){
		this.setState({screen: 1});
	}

	toggleNavBar(value) {
		this.props.navigator.toggleNavBar({
  		to: value, // required, 'hidden' = hide navigation bar, 'shown' = show navigation bar
  		animated: true // does the toggle have transition animation or does it happen immediately (optional). By default animated: true
		});
	}

	setParkingSelectionTo(parkingLot){
		if(this.parkingoverlay) this.parkingoverlay.setParkingSelectionTo(parkingLot);
		else this.setState({parkingLot: parkingLot});
	}

	render(){
		const screen = this.state.screen;
		let overlay = null;

		if(screen == 0){
			overlay = <CollegeOverlay college={this.state.college} addMarkers={this.props.addMarkers} onPark={this.handlePark} onRide={this.handleRide} map={this.props.map} onGetPosition={this.props.getCurrentPosition}/>;
		} else if(screen==1){
			overlay = <ParkingOverlay ref={ref => {this.parkingoverlay=ref}} addMarkers={this.props.addMarkers} college={this.state.college} parkingLot={this.state.parkingLot} onParkingSet={this.handleParkingSet} map={this.props.map} onBackPress={this.handleParkingBack} onGetPosition={this.props.getCurrentPosition}/>;
		} else {
			overlay = <PickupOverlay college={this.state.college} parkingLot={this.state.parkingLot} lat={this.props.region.latitude} lng={this.props.region.longitude} map={this.props.map} onPickupSet={this.handlePickupSet} onBackPress={this.handlePickupBack} onGetPosition={this.props.getCurrentPosition}/>;
		}

		return(
			overlay
		);
	}
}

export default MainOverlayControl