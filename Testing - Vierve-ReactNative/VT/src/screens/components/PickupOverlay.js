import React, {Component} from 'react';
import {StyleSheet, View, Image, Text, TouchableOpacity, Dimensions} from 'react-native';

const {width, height} = Dimensions.get('window');

class PickupOverlay extends Component {
	constructor(props) {
		super(props);
    this.onPickupSet = this.onPickupSet.bind(this);
	}

  componentDidMount(){
    this.moveNearCurrentLocation();
    setTimeout(() => this.props.onGetPosition(), 500);
  }

  moveNearCurrentLocation(){
    navigator.geolocation.getCurrentPosition(
      (position) => {
        const region = {
          latitude: position.coords.latitude,
          longitude: position.coords.longitude,
        };
        this.props.map.animateToCoordinate(region);
      },
      (error) => console.log("error getting current position"),
    );
  }

  onPickupSet(){
    console.log(width/2-20,height/2-40);
    // this.props.map.coordinateForPoint({x: width/2-20, y: height/2-40})
    //   .then((coord) => console.log(coord));
  }

	render(){
		return(
			<View style={styles.container}>
				<View style={styles.instruction}>
					<Text style={styles.description}>Please choose a pick up location near a road, so that the driver can easily pick you up.</Text>
				</View>
        <View style={styles.LocationViewContainer}>
          <TouchableOpacity onPress={this.props.onGetPosition}>
            <Image
              style={styles.image}
              source={require('../../res/ic_my_location.png')}
            />
          </TouchableOpacity>
        </View>
        <View style={styles.markerContainer}>
          <Image
            style={styles.markerStyle}
            source={require('../../res/user_marker.png')}
          />
        </View>
				<View style={styles.buttonContainer}>
          <TouchableOpacity onPress={this.onPickupSet} underlayColor="white">
            <View style={styles.button}>
              <Text style={styles.buttonText}>SET PICKUP LOCATION</Text>
            </View>
          </TouchableOpacity>
        </View>
        <View style={styles.arrowImageContainer}>
          <TouchableOpacity onPress={this.props.onBackPress}>
            <Image
              style={styles.image}
              source={require('../../res/left-arrow.png')}
            />
          </TouchableOpacity>
        </View>
      </View>
		);
	}
}

const styles = StyleSheet.create({
  container: {
    // ...StyleSheet.absoluteFillObject,
    position: 'absolute',
    left: 0,
    right: 0,
    alignItems: 'center',
    // backgroundColor: 'red',
    // flex:1,
  },
  instruction: {
    // flex:0,
  	// position: 'absolute',
    // top: 10,
    margin: 5,
  	padding: 5,
  	backgroundColor: 'white'
  },
  description: {
  	textAlign: 'center',
  	color: '#2f4858',
  	fontSize: 20,
  },
  markerContainer: {
    position: 'absolute',
    left: width/2-20,
    top: height/2-40,
  },
  markerStyle: {
    width: 40,
    height: 40
  },
  arrowImageContainer: {
    position: 'absolute',
    left: 20,
    top: height-125
  },
  LocationViewContainer: {
    // flex:0,
    // justifyContent: 'flex-end',
    // alignItems: 'flex-start',
    // marginRight: 20,
    // backgroundColor: 'blue',
    position: 'absolute',
    right: 20,
    top: 90,
  },
  image: {
    width: 35,
    height: 35,
    tintColor: '#2f4858'
  },
  buttonContainer: {
    // backgroundColor: 'green',
    position: 'absolute',
    top: height-135,
  },
  button: {
    alignItems: 'center',
    marginLeft: 10,
    marginRight: 10,
    backgroundColor: 'white',
  },
  buttonText: {
    padding: 15,
    color: '#2196F3'
  }
});

export default PickupOverlay