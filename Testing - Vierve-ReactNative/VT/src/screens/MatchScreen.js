import React, { Component } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Platform, Modal, TouchableWithoutFeedback, TouchableHighlight, Image } from 'react-native';
import MapView from 'react-native-maps';
import Dimensions from 'Dimensions';
const {width, height} = Dimensions.get('window');
import MatchOverlayControl from './components/MatchOverlayControl';

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
	 map = null;
	 this.props.navigator.setOnNavigatorEvent(this.onNavigatorEvent.bind(this));
	 this.getCurrentPosition = this.getCurrentPosition.bind(this);
	 this.CancelSession = this.CancelSession.bind(this);
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
	}

	componentDidMount() {
		console.log("mounting worked")
		this.getCurrentPosition();
	}

	setRegion(region) {
		if(this.state.ready) {
			setTimeout(() => this.map.animateToRegion(region), 10);
		}
	}

	getCurrentPosition() {
		console.log("trying to get current position")
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
				(error) => {
					console.log("error getting current position")
				}
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
    this.props.navigator.push({
    	screen: 'vt.RatingScreen',
			backButtonHidden: true,
    });
  };


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