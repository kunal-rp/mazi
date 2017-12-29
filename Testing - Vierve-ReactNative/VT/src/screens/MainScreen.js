import React, { Component } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Platform, Modal, TouchableWithoutFeedback, TouchableHighlight, Image } from 'react-native';
import MapView from 'react-native-maps';
import Dimensions from 'Dimensions';
const {width, height} = Dimensions.get('window');
import MainOverlayControl from './components/MainOverlayControl';

const LATITUDE_DELTA = 0.0122;
const LONGITUDE_DELTA = 0.0121;

class MainScreen extends Component{
	static navigatorStyle = {
	 	screenBackgroundColor: '#2f4858',
	  statusBarColor: '#2f4858',
	  navBarBackgroundColor: '#2f4858',
	  navBarTextColor: 'white',
	  navBarButtonColor: 'white',
	  navBarComponentAlignment: 'fill',
	  navBarCustomView: 'vt.CustomTopBar'
	};
	static navigatorButtons = {
		rightButtons: [
			{
				id: 'settings',
				icon: require('../res/ic_settings_icon.png')
			}
		],
		leftButtons: [
			{
				id: 'profile',
				icon: require('../res/ic_profile_icon.png')
			}
		]
	};


	constructor(props) {
	 super(props);
	 map = null;
	 this.props.navigator.setOnNavigatorEvent(this.onNavigatorEvent.bind(this));
	 this.getCurrentPosition = this.getCurrentPosition.bind(this);
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

	showMenu(toggle) {
		this.setState({modalVisible: toggle});
	}

	pushBugReportScreen = () => {
		this.showMenu(false);
		this.props.navigator.push({
			screen: 'vt.BugReportScreen',
			title: 'BugReport',
			animationType: 'fade',
		});
	}

	AttemptLogOff = () => {
		this.showMenu(false);
		this.props.navigator.resetTo({
			screen: 'vt.LoginScreen',
			animated: true,
			animationType: 'fade',
		});
	}

	AttemptMatch = () => {
		this.props.navigator.push({
			screen: 'vt.WaitingScreen',
			backButtonHidden: true,
		});
	}

	onNavigatorEvent(event) {
		if(event.type == 'NavBarButtonPress'){
			if(event.id == 'profile'){
				this.props.navigator.push({
					screen: 'vt.ProfileScreen',
					backButtonHidden: true,
					animated: true
				});
			}
			if(event.id == 'settings'){
				this.showMenu(true);
			}
		}
	}

	render() {
		return (
			<View style={styles.container}>
				<View style={styles.mapContainer}>
						<MapView 
							style={styles.map}
							ref={ref => {this.map = ref}}
							showsUserLocation={true}
							showsMyLocationButton={false}
							loadingEnabled={false}
							initialRegion={{
								latitude: 34.057712,
		      			longitude: -117.820757,
		      			latitudeDelta: 0.0122,
		      			longitudeDelta: 0.0421,
							}}
						/>
					</View>
				{/*Modal is for showing small menu bar in right corner for settings*/}
				<Modal 
					onRequestClose={() => this.showMenu(false)}
					animationType='fade'
					transparent={true}
					visible={this.state.modalVisible}>
					<TouchableWithoutFeedback onPress={() => this.showMenu(false)}>
						<View style={styles.menuContainer}>
							<View style={{backgroundColor: '#2F2F2F'}}>
								<TouchableHighlight onPress={this.pushBugReportScreen} underlayColor='white'>
						    	<View style={styles.menuButton}>
						    		<Text style={styles.menubuttonText}>Suggestions/Report Bug</Text>
						    	</View>
						    </TouchableHighlight>
								<TouchableHighlight onPress={this.AttemptLogOff} underlayColor='white'>
						    	<View style={styles.menuButton}>
						    		<Text style={styles.menubuttonText}>Log Off</Text>
						    	</View>
						    </TouchableHighlight>
							</View>
						</View>
					</TouchableWithoutFeedback>
				</Modal>
				
				<MainOverlayControl navigator={this.props.navigator} getCurrentPosition={this.getCurrentPosition}/>
			</View>
		);
	}
}

const styles = StyleSheet.create({
	container: {
		// backgroundColor: 'red'
	},
	mapContainer: {
    height: height,
    width: width
  },
  map: {
    ...StyleSheet.absoluteFillObject
  },
  menuContainer: {
  	flex:1,
  	flexDirection: 'column',
  	justifyContent: 'flex-start',
  	alignItems: 'flex-end',
  	marginTop: 20,
  	marginRight: 5,
  },
  menuButton: {
    alignItems: 'flex-start',
    backgroundColor: '#2F2F2F',
  },
  menubuttonText: {
  	fontSize: 16,
		padding: 14,
    color: 'white'
  },
 //  imageViewContainer: {
	// 	position: 'absolute',
	// 	right: 20,
	// 	top: 70
	// },
	// image: {
 //    width: 35,
 //    height: 35,
 //    tintColor: '#2f4858'
 //  },
});

export default MainScreen