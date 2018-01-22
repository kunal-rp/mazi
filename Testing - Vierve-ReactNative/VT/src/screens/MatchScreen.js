import React, { Component } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Platform, Modal, TouchableWithoutFeedback, TouchableHighlight, Image } from 'react-native';
import MapView from 'react-native-maps';
import Dimensions from 'Dimensions';
const {width, height} = Dimensions.get('window');
import MatchOverlayControl from './components/MatchOverlayControl';
import ServerTools from '../utils/ServerTools';
import Db_Helper_User from '../utils/Db_Helper_User';

const LATITUDE_DELTA = 0.0122;
const LONGITUDE_DELTA = 0.0121;

class MatchScreen extends Component{
	static navigatorStyle = {
	 	screenBackgroundColor: '#2f4858',
	  statusBarColor: '#2f4858',
	  navBarBackgroundColor: '#2f4858',
	  navBarTextColor: 'white',
	  navBarButtonColor: 'white',
	  navBarComponentAlignment: 'fill',
	  navBarCustomView: 'vt.MatchTopBar'
	};
	static navigatorButtons = {
		rightButtons: [
			{
				id: 'cancel',
				title: 'CANCEL',
			}
		],
	};

	constructor(props) {
	 super(props);
	 this.state = {
	 	modalVisible: false,
	 	region: {
	 		latitude: 34.057712,
			longitude: -117.820757,
			latitudeDelta: 0.0122,
			longitudeDelta: 0.0121,
	 	},
	 	ready: true
	 };
	 this.props.navigator.setOnNavigatorEvent(this.onNavigatorEvent.bind(this));
	 this.getCurrentPosition = this.getCurrentPosition.bind(this);
	 this.CancelSession = this.CancelSession.bind(this);
	 this.PushRatingScreen = this.PushRatingScreen.bind(this);
	 this.getUserStatus = this.getUserStatus.bind(this);
	 this.cancelMatch = this.cancelMatch.bind(this);
	}

	componentDidMount() {
		this.getCurrentPosition();
		this.startStatusHandler();
	}

	componentWillUnmount() {
		clearInterval(this.statusCheck);
	}

	async startStatusHandler() {
		this.statusCheck = setInterval(this.getUserStatus, 3000);
	}

	async getUserStatus() {
		let sessionData = await Db_Helper_User.getSessionData();
    let response = await ServerTools.getUserStatus({'token_user': sessionData.token_user, 'user_id': sessionData.user_id, 'action': 'getUserStatus'});
    if(response){
	    if(response.code==1){
	    	console.log(response.data.status);
	    	if(response.data.status=='rate'){
	    		this.PushRatingScreen();
	    	}
	    }
	  }
	}

	PushRatingScreen() {
		clearInterval(this.statusCheck);
		this.props.navigator.push({
    	screen: 'vt.RatingScreen',
			backButtonHidden: true,
    });
	}

	setRegion(region) {
		if(this.state.ready) {
			setTimeout(() => this.map.animateToRegion(region), 10);
		}
	}

	getCurrentPosition() {
		try{
			navigator.geolocation.getCurrentPosition(
				(position) => {
					const region = {
						latitude: position.coords.latitude,
						longitude: position.coords.longitude,
						latitudeDelta: LATITUDE_DELTA,
						longitudeDelta: LONGITUDE_DELTA,
					};
					this.setRegion(region);
				},
				(error) => console.log("error getting current position")
			);
		} catch(e) {
			console.log("error trying geolocation")
		}
	}

	CancelSession() {
  	this.props.navigator.showLightBox({
  		screen: 'vt.CancelLightBox',
  		passProps: {
  			onClose: this.dismissLightBox
  		},
  		style: {
  			backgroundBlur: 'dark',
        backgroundColor: 'transparent',
        tapBackgroundToDismiss: true
  		}
  	});
  }

  dismissLightBox = () => {
    this.props.navigator.dismissLightBox();
    this.cancelMatch();
    this.PushRatingScreen();
  };

  async cancelMatch() {
  	let sessionData = await Db_Helper_User.getSessionData();
    let response = await ServerTools.cancelMatch({'token_user': sessionData.token_user, 'user_id': sessionData.user_id, 'action': 'cancelMatch'});
    console.log(response);
  }


	onNavigatorEvent(event) {
		if(event.type == 'NavBarButtonPress'){
			if(event.id == 'cancel'){
				this.CancelSession();
			}
		}
	}

	render() {
		return (
			<View style={styles.container}>
				<View style={styles.mapContainer}>
					<MapView style={styles.map}
						ref={ref => {this.map = ref}}
						showsUserLocation={true}
						showsMyLocationButton={false}
						loadingEnabled={true}
						initialRegion={{
							latitude: 34.057712,
	      			longitude: -117.820757,
	      			latitudeDelta: 0.0122,
	      			longitudeDelta: 0.0421,
						}}
					/>
				</View>
				<MatchOverlayControl navigator={this.props.navigator} getCurrentPosition={this.getCurrentPosition}/>
			</View>
		);
	}
}

const styles = StyleSheet.create({
	container: {
	},
	mapContainer: {
    height: height,
    width: width
  },
  map: {
    ...StyleSheet.absoluteFillObject,
  },
});

export default MatchScreen